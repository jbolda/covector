import { spawn, timeout, Operation } from "effection";
import { exec } from "@effection/node";
import stripAnsi from "strip-ansi";
import path from "path";

type ComplexCommand = {
  pkg: string;
  pkgFile: { version: string };
  path: string;
  [getPublishedVersion: string]: any;
};

type RunningCommand = {
  command?: string | Function;
  shouldRunCommand?: boolean;
  runFromRoot?: boolean;
};

type NormalizedCommand = {
  command?: string;
  runFromRoot?: boolean;
  dryRunCommand?: boolean;
  pipe?: boolean;
};

export const attemptCommands = function* ({
  cwd,
  commands,
  command,
  commandPrefix = "",
  pkgCommandsRan,
  dryRun,
}: {
  cwd: string;
  commands: {
    pkg: string;
    path: string;
    [k: string]: string;
  }[];
  command: string; // the covector command that was ran
  commandPrefix?: string;
  pkgCommandsRan: object;
  dryRun: boolean;
}) {
  let _pkgCommandsRan: { [k: string]: { [c: string]: string | boolean } } = {
    ...pkgCommandsRan,
  };
  for (let pkg of commands) {
    if (!pkg[`${commandPrefix}command`]) continue;
    const c: string | Function | [] = pkg[`${commandPrefix}command`];
    const pubCommands: (NormalizedCommand | string | Function)[] =
      typeof c === "string" || typeof c === "function" || !Array.isArray(c)
        ? [c]
        : c;
    let stdout = "";
    for (let pubCommand of pubCommands) {
      const runningCommand: RunningCommand = {
        ...(typeof pubCommand === "object"
          ? { runFromRoot: pubCommand.runFromRoot }
          : {}),
      };
      if (
        typeof pubCommand === "object" &&
        pubCommand.dryRunCommand === false
      ) {
        runningCommand.command = pubCommand.command;
        runningCommand.shouldRunCommand = !dryRun;
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
        }
      } else {
        runningCommand.command = pubCommand;
        runningCommand.shouldRunCommand = !dryRun;
      }

      if (runningCommand.shouldRunCommand && runningCommand.command) {
        if (typeof runningCommand.command === "function") {
          try {
            yield runningCommand.command(pkg);

            if (typeof pubCommand === "object" && pubCommand.pipe) {
              console.warn(`We cannot pipe the function command in ${pkg.pkg}`);
            }
          } catch (e) {
            console.error(e);
          }
        } else {
          //@ts-ignore TODO generator error
          const ranCommand = yield runCommand({
            command: runningCommand.command,
            cwd,
            pkg: pkg.pkg,
            pkgPath: runningCommand.runFromRoot === true ? "" : pkg.path,
            log: `${pkg.pkg} [${commandPrefix}${command}${
              runningCommand.runFromRoot === true ? " run from the cwd" : ""
            }]: ${runningCommand.command}`,
          });

          if (typeof pubCommand === "object" && pubCommand.pipe) {
            stdout = `${stdout}${ranCommand}\n`;
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

    if (!!pkgCommandsRan)
      _pkgCommandsRan[pkg.pkg][`${commandPrefix}command`] =
        stdout !== "" ? stdout : true;
  }
  return _pkgCommandsRan;
};

export const confirmCommandsToRun = function* ({
  cwd,
  commands,
  command,
}: {
  cwd: string;
  commands: ComplexCommand[];
  command: string;
}) {
  let subPublishCommand = command.slice(7, 999);
  let commandsToRun: ComplexCommand[] = [];
  for (let pkg of commands) {
    const getPublishedVersion = pkg[`getPublishedVersion${subPublishCommand}`];
    if (!!getPublishedVersion) {
      //@ts-ignore TODO generator error
      const version = yield runCommand({
        command: getPublishedVersion,
        cwd,
        pkg: pkg.pkg,
        pkgPath: pkg.path,
        log: `Checking if ${pkg.pkg}@${pkg.pkgFile.version} is already published with: ${getPublishedVersion}`,
      });

      if (pkg.pkgFile.version === version) {
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
};

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
}): Generator<string> {
  if (log !== false) console.log(log);
  raceTime();

  //@ts-ignore TODO generator error
  const child = yield sh(
    command,
    {
      cwd: path.join(cwd, pkgPath),
      encoding: "utf8",
    },
    log
  );

  return child;
};

const sh = function* (
  command: string,
  options: object,
  log: false | string
): Generator<string> {
  // @ts-ignore
  let child: any = yield exec(command, options);

  if (log !== false) {
    // @ts-ignore
    yield spawn(
      child.stdout.subscribe().forEach(function* (datum: Buffer) {
        const out = stripAnsi(datum.toString().trim());
        if (out !== "") console.log(out);
      })
    );

    // @ts-ignore
    yield spawn(
      child.stderr.subscribe().forEach(function* (datum: Buffer) {
        const out = stripAnsi(datum.toString().trim());
        if (out !== "") console.error(out);
      })
    );
  }

  const out = yield child.expect();
  // @ts-ignore
  const stripped: string = stripAnsi(Buffer.concat(out.tail).toString().trim());
  return stripped;
};

export const raceTime = function ({
  t = 1200000,
  msg = `timeout out waiting ${t / 1000}s for command`,
}: {
  t?: number;
  msg?: string;
} = {}) {
  return spawn(function* () {
    yield timeout(t);
    throw new Error(msg);
  });
};

module.exports = {
  attemptCommands,
  confirmCommandsToRun,
  runCommand,
  raceTime,
};
