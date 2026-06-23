import { type Operation, sleep, until, spawn } from "effection";
import { exec, Stdio, type ExecOptions } from "@effectionx/process";
import { timebox } from "@effectionx/timebox";
import path from "path";
import { template } from "./template.ts";

import type {
  PkgVersion,
  PkgPublish,
  RunningCommand,
  CommandTypes,
  CommandsRan,
  BuiltInCommands,
  BuiltInCommandOptions,
  Logger,
} from "@covector/types";

export { template };
export type { Process } from "@effectionx/process";

export function* attemptCommands({
  logger,
  cwd,
  commands,
  command,
  commandPrefix = "",
  pkgCommandsRan,
  dryRun,
}: {
  logger: Logger;
  cwd: string;
  commands: (PkgVersion | PkgPublish)[];
  command: "version" | "publish" | string; // the covector command that was ran
  commandPrefix?: "pre" | "post" | "";
  pkgCommandsRan?: CommandsRan;
  dryRun: boolean;
}): Operation<CommandsRan> {
  let pkgCommandsRun = {
    ...pkgCommandsRan,
  };
  for (let pkg of commands) {
    const c = pkg[`${commandPrefix}command`];
    if (!c) continue;
    const initialStdout =
      pkgCommandsRan?.[pkg.pkg][`${commandPrefix}command`] &&
      typeof pkgCommandsRan[pkg.pkg][`${commandPrefix}command`] === "string"
        ? pkgCommandsRan[pkg.pkg][`${commandPrefix}command`]
        : false;
    const pubCommands: CommandTypes[] =
      typeof c === "string" || typeof c === "function" || !Array.isArray(c)
        ? [c]
        : c;
    let stdout = initialStdout ? `${initialStdout}\n` : "";

    stdout = yield* executeEachCommand({
      logger,
      cwd,
      stdout,
      dryRun,
      pkg,
      pubCommands,
      pkgCommandsRun,
      commandPrefix,
      command,
    });

    if (!!pkgCommandsRan)
      pkgCommandsRun[pkg.pkg][`${commandPrefix}command`] =
        stdout !== "" ? stdout : true;

    if (!!pkgCommandsRan && command === "publish" && !commandPrefix)
      pkgCommandsRun[pkg.pkg]["published"] = true;
  }
  return pkgCommandsRun;
}

function* executeEachCommand({
  logger,
  cwd,
  stdout,
  dryRun,
  pkg,
  pubCommands,
  pkgCommandsRun,
  command,
  commandPrefix,
}: {
  logger: Logger;
  cwd: string;
  stdout: string;
  dryRun: boolean;
  pkg: PkgVersion | PkgPublish;
  pubCommands: CommandTypes[];
  pkgCommandsRun: any;
  command: string;
  commandPrefix: string;
}): Operation<string> {
  for (let pubCommand of pubCommands) {
    const runningCommand: RunningCommand = {
      ...(typeof pubCommand === "object"
        ? { runFromRoot: pubCommand.runFromRoot }
        : {}),
    };
    if (typeof pubCommand === "object" && pubCommand.dryRunCommand === false) {
      runningCommand.command = pubCommand.command;
      runningCommand.shouldRunCommand = !dryRun;
      runningCommand.retries = pubCommand.retries;
      runningCommand.use = pubCommand.use;
      runningCommand.options = pubCommand.options;
    } else if (typeof pubCommand === "object") {
      // dryRunCommand will either be a !string (false) or !undefined (true) or !true (false)
      if (pubCommand.dryRunCommand === true) {
        runningCommand.command = pubCommand.command;
        runningCommand.shouldRunCommand = true;
      } else if (typeof pubCommand.dryRunCommand === "string" && dryRun) {
        runningCommand.command = pubCommand.dryRunCommand;
        runningCommand.shouldRunCommand = true;
      } else {
        runningCommand.command = pubCommand.command;
        runningCommand.shouldRunCommand = !dryRun;
        runningCommand.retries = pubCommand.retries;
        runningCommand.use = pubCommand.use;
        runningCommand.options = pubCommand.options;
      }
    } else {
      runningCommand.command = pubCommand;
      runningCommand.shouldRunCommand = !dryRun;
    }

    if (
      runningCommand.shouldRunCommand &&
      (runningCommand.command || runningCommand.use)
    ) {
      let commandBackoff = (runningCommand?.retries ?? []).concat([0]);
      for (let [index, attemptTimeout] of commandBackoff.entries()) {
        try {
          stdout = yield* callCommand({
            logger,
            cwd,
            pkg,
            runningCommand,
            pubCommand,
            command,
            commandPrefix,
            stdout,
            pkgCommandsRun,
          });
          // if nothing throws, continue out of the loop
          break;
        } catch (e) {
          if (index + 1 >= commandBackoff.length) {
            throw e;
          } else {
            yield* logger.error(e as Error);
          }
          yield* sleep(attemptTimeout);
        }
      }
    } else {
      yield* logger.info(
        `dryRun >> ${pkg.pkg} [${commandPrefix}${command}${
          runningCommand.runFromRoot === true ? " run from the cwd" : ""
        }]: ${runningCommand.command}`,
      );
    }
  }
  return stdout;
}

function* useFunction({
  pkg,
  use,
  options,
}: {
  pkg: PkgVersion | PkgPublish;
  use: BuiltInCommands;
  options?: BuiltInCommandOptions;
}): Operation<string> {
  if (use === "fetch:check") {
    if (options?.url) {
      const url = template(options.url)({ pkg });
      let request = yield* until(
        fetch(url, {
          headers: { ["user-agent"]: "covector/0 github.com/jbolda/covector" },
        }),
      );
      if (request.status >= 400) {
        const errorText = yield* until(request.text());
        throw new CommandError(
          `${pkg.pkg} request to ${url} returned code ${request.status} ${request.statusText}: ${errorText}`,
        );
      }
      const response = yield* until(request.json());
      if (response.errors) {
        const failedMessage = `${pkg.pkg} request to ${url} returned errors: ${JSON.stringify(
          response.errors,
          null,
          2,
        )}`;
        throw new CommandError(failedMessage);
      }
      if (url.startsWith("https://crates.io")) {
        return response.version.num;
      }
      return response.version;
    }
  }
  return "";
}

function* callCommand({
  logger,
  cwd,
  pkg,
  runningCommand,
  pkgCommandsRun,
  pubCommand,
  stdout,
  command,
  commandPrefix,
}: {
  logger: Logger;
  cwd: string;
  stdout: string;
  pkg: PkgVersion | PkgPublish;
  pubCommand: CommandTypes;
  runningCommand: RunningCommand;
  pkgCommandsRun: any;
  command: string;
  commandPrefix: string;
}): Operation<string> {
  // this helps with TS type guards
  const commandFn = runningCommand?.command;
  if (commandFn && typeof commandFn === "function") {
    const pipeToFunction = {
      ...pkg,
      pkgCommandsRan: {
        ...pkgCommandsRun[pkg.pkg],
        [`${commandPrefix}command`]: stdout,
      },
    };

    yield* commandFn(pipeToFunction);

    if (typeof pubCommand === "object" && pubCommand.pipe) {
      yield* logger.error(`We cannot pipe the function command in ${pkg.pkg}`);
    }
  } else if (typeof runningCommand.command === "string") {
    const ranCommand: string = yield* runCommand({
      logger,
      command: runningCommand.command,
      cwd,
      pkg: pkg.pkg,
      pkgPath: runningCommand.runFromRoot === true ? "" : pkg.path || "",
      log: `${pkg.pkg} [${commandPrefix}${command}${
        runningCommand.runFromRoot === true ? " run from the cwd" : ""
      }]: ${runningCommand.command}`,
    });

    if (typeof pubCommand === "object" && pubCommand.pipe) {
      stdout = `${stdout}${ranCommand}\n`;
    }
  } else if (runningCommand.use) {
    const used = yield* useFunction({
      pkg,
      use: runningCommand.use,
      options: runningCommand.options,
    });
    stdout = `${stdout}${used}\n`;
  }

  return stdout;
}

export function* confirmCommandsToRun({
  logger,
  cwd,
  commands,
  command,
}: {
  logger: Logger;
  cwd: string;
  commands: PkgPublish[];
  command: string;
}): Operation<PkgPublish[]> {
  let subPublishCommand = command.slice(7, 999);
  let commandsToRun: PkgPublish[] = [];
  for (let pkg of commands) {
    //@ts-expect-error template literals issues
    const getPublishedVersion = pkg[`getPublishedVersion${subPublishCommand}`];
    if (!!getPublishedVersion) {
      let version = "";
      if (typeof getPublishedVersion === "string") {
        version = yield* runCommand({
          logger,
          command: getPublishedVersion,
          cwd,
          pkg: pkg.pkg,
          pkgPath: pkg.path || "",
          log: `Checking if ${pkg.pkg}${
            !pkg.pkgFile ? "" : `@${pkg.pkgFile.version}`
          } is already published with: ${getPublishedVersion}`,
        });
      } else if (typeof getPublishedVersion === "object") {
        if (getPublishedVersion.use === "fetch:check") {
          yield* logger.info(
            `Checking if ${pkg.pkg}${
              !pkg.pkgFile ? "" : `@${pkg.pkgFile.version}`
            } is already published with built-in ${getPublishedVersion.use}`,
          );

          try {
            version = yield* useFunction({
              pkg,
              use: getPublishedVersion.use,
              options: getPublishedVersion.options,
            });
          } catch (error: any) {
            // it throws if version is not found
          }
        } else {
          throw new CommandError(
            `This configuration is not supported for getPublishedVersion on ${
              pkg.pkg
            }: ${JSON.stringify(getPublishedVersion, null, 2)}`,
          );
        }
      }
      version = version.trim();
      if (pkg.pkgFile && pkg.pkgFile.version === version) {
        yield* logger.info(
          `${pkg.pkg}@${pkg.pkgFile.version} is already published. Skipping.`,
        );
        // early return if published already
        continue;
      }
    }
    commandsToRun = commandsToRun.concat([pkg]);
  }

  return commandsToRun;
}

export function* runCommand({
  logger,
  pkg = "package",
  command,
  cwd,
  pkgPath,
  log = `running command for ${pkg}`,
  options = {},
}: {
  logger: Logger;
  pkg?: string;
  command: string;
  cwd: string;
  pkgPath: string;
  log: false | string;
  options?: Partial<ExecOptions>;
}): Operation<string> {
  if (log !== false) yield* logger.info(log);

  const workingOptions = { ...options, cwd: path.join(cwd, pkgPath) };
  if (command.includes(" | ") && !options?.shell) {
    workingOptions.shell = true;
    yield* logger.warn(`"|" detected in command, setting shell to true: ${command}`);
  }

  let out = "";
  const timeoutPeriod = 1200000;
  const result = yield* timebox(timeoutPeriod, function* () {
    yield* Stdio.around({
      *stdout(line, next) {
        const [bytes] = line;
        const text = bytes.toString();
        out += text;
        if (log !== false) {
          const message = text.trim();
          if (message !== "") {
            yield* logger.stdout(message);
          }
        }
      },
      *stderr(line, next) {
        const [bytes] = line;
        const text = bytes.toString();
        out += text;
        if (log !== false) {
          const message = text.trim();
          if (message !== "") {
            yield* logger.stderr(message);
          }
        }
      },
    });

    const process = yield* exec(command, workingOptions);

    return yield* process.expect();
  });

  if (result.timeout) {
    throw new Error(
      `timeout waiting ${timeoutPeriod / 1000}s for command: ${command}`,
    );
  }

  return out.trim();
}

export interface CommandErrorOptions {
  exitCode?: number;
  message?: string;
}
export class CommandError extends Error {
  name = "CommandError";

  public exitCode: number;

  constructor(options: CommandErrorOptions | string) {
    super(typeof options === "string" ? options : options?.message || "");
    this.exitCode = typeof options === "string" ? -1 : options?.exitCode || -1;
  }
}

export function isCommandError(error: unknown): error is CommandError {
  return (
    !!error &&
    typeof error === "object" &&
    "name" in error &&
    error.name === "CommandError"
  );
}
