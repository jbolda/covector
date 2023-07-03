import { spawn, timeout, Operation, MainError, sleep, fetch } from "effection";
import { exec } from "@effection/process";
import path from "path";
import { template } from "lodash";

import type {
  PkgVersion,
  PkgPublish,
  RunningCommand,
  CommandTypes,
  CommandsRan,
} from "@covector/types";

export const attemptCommands = function* ({
  cwd,
  commands,
  command,
  commandPrefix = "",
  pkgCommandsRan,
  dryRun,
}: {
  cwd: string;
  commands: (PkgVersion | PkgPublish)[];
  command: "version" | "publish" | string; // the covector command that was ran
  commandPrefix?: "pre" | "post" | "";
  pkgCommandsRan?: CommandsRan;
  dryRun: boolean;
}): Operation<{ [k: string]: { [c: string]: string | boolean } }> {
  let pkgCommandsRun: { [k: string]: { [c: string]: string | boolean } } = {
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

    stdout = yield executeEachCommand({
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
};

function* executeEachCommand({
  cwd,
  stdout,
  dryRun,
  pkg,
  pubCommands,
  pkgCommandsRun,
  command,
  commandPrefix,
}: {
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
          stdout = yield callCommand({
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
            console.error(e);
          }
          yield sleep(attemptTimeout);
        }
      }
    } else {
      console.log(
        `dryRun >> ${pkg.pkg} [${commandPrefix}${command}${
          runningCommand.runFromRoot === true ? " run from the cwd" : ""
        }]: ${runningCommand.command}`
      );
    }
  }
  return stdout;
}

function* callCommand({
  cwd,
  pkg,
  runningCommand,
  pkgCommandsRun,
  pubCommand,
  stdout,
  command,
  commandPrefix,
}: {
  cwd: string;
  stdout: string;
  pkg: PkgVersion | PkgPublish;
  pubCommand: CommandTypes;
  runningCommand: RunningCommand;
  pkgCommandsRun: any;
  command: string;
  commandPrefix: string;
}): Operation<string> {
  if (typeof runningCommand.command === "function") {
    const pipeToFunction = {
      ...pkg,
      pkgCommandsRan: {
        ...pkgCommandsRun[pkg.pkg],
        [`${commandPrefix}command`]: stdout,
      },
    };

    yield runningCommand.command(pipeToFunction);

    if (typeof pubCommand === "object" && pubCommand.pipe) {
      console.warn(`We cannot pipe the function command in ${pkg.pkg}`);
    }
  } else if (typeof runningCommand.command === "string") {
    const ranCommand: string = yield runCommand({
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
  } else if (runningCommand.use === "fetch:check") {
    if (runningCommand?.options?.url) {
      const url = template(runningCommand.options.url)({ pkg });
      let request = yield fetch(url);
      if (request.status >= 400) {
        throw new MainError({
          exitCode: 1,
          message: `request returned code ${request.status}: ${request.statusText}`,
        });
      }
      const response = yield request.json();
      if (response.errors) {
        throw new MainError({
          exitCode: 1,
          message: `request returned errors: ${JSON.stringify(
            response.errors,
            null,
            2
          )}`,
        });
      }
      stdout = `${stdout}${response.version}\n`;
    }
  }

  return stdout;
}

export function* confirmCommandsToRun({
  cwd,
  commands,
  command,
}: {
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
      const version = yield runCommand({
        command: getPublishedVersion,
        cwd,
        pkg: pkg.pkg,
        pkgPath: pkg.path || "",
        log: `Checking if ${pkg.pkg}${
          !pkg.pkgFile ? "" : `@${pkg.pkgFile.version}`
        } is already published with: ${getPublishedVersion}`,
      });

      if (pkg.pkgFile && pkg.pkgFile.version === version) {
        console.log(
          `${pkg.pkg}@${pkg.pkgFile.version} is already published. Skipping.`
        );
        // early return if published already
        continue;
      }
    }
    commandsToRun = commandsToRun.concat([pkg]);
  }

  return commandsToRun;
}

export const runCommand = function* ({
  pkg = "package",
  command,
  cwd,
  pkgPath,
  log = `running command for ${pkg}`,
}: {
  pkg?: string;
  command: string;
  cwd: string;
  pkgPath: string;
  log: false | string;
}): Operation<string> {
  if (log !== false) console.log(log);

  const timeoutPeriod = 1200000;
  try {
    yield spawn(timeout(timeoutPeriod));
  } catch (e) {
    throw new MainError({
      message: `timeout waiting ${
        timeoutPeriod / 1000
      }s for command: ${command}`,
      exitCode: 1,
    });
  }

  const ran = yield sh(
    command,
    {
      cwd: path.join(cwd, pkgPath),
    },
    log
  );

  return ran.out;
};

export const sh = function* (
  command: string,
  options: { [k: string]: any },
  log: false | string
): Operation<{ result: Number; stdout: string; stderr: string; out: string }> {
  let out = "";
  let stdout = "";
  let stderr = "";

  let child;
  if (command.includes("|") && !options.shell) {
    child = yield exec(command, {
      ...options,
      shell: process.platform !== "win32" ? true : process.env.shell,
    });
  } else if (options.shell) {
    child = yield exec(command, {
      ...options,
      shell:
        process.platform === "win32" && options.shell === true
          ? "bash"
          : options.shell,
    });
  } else {
    child = yield exec(command, options);
  }

  yield spawn(
    child.stderr.forEach((chunk: Buffer) => {
      out += chunk.toString();
      stderr += chunk.toString();
      if (log !== false) console.error(chunk.toString().trim());
    })
  );

  yield spawn(
    child.stdout.forEach((chunk: Buffer) => {
      out += chunk.toString();
      stdout += chunk.toString();
      if (log !== false) console.log(chunk.toString().trim());
    })
  );

  const result = yield child.expect();
  return { result, stdout, stderr, out: out.trim() };
};

export const raceTime = function* ({
  t = 1200000,
  msg = `timeout out waiting ${t / 1000}s for command`,
}: {
  t?: number;
  msg?: string;
} = {}): Generator<any> {
  try {
    yield spawn(timeout(t));
  } catch (e) {
    throw new Error(msg);
  }
};
