import { spawn, timeout } from "effection";
import { exec } from "@effection/node";
import execa from "execa";
import stripAnsi from "strip-ansi";
import path from "path";

import { PkgVersion, PkgPublish } from "@covector/assemble";

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
  commands: (PkgVersion | PkgPublish)[];
  command: string; // the covector command that was ran
  commandPrefix?: string;
  pkgCommandsRan?: object;
  dryRun: boolean;
}): Generator<any, { [k: string]: { [c: string]: string | boolean } }, string> {
  let _pkgCommandsRan: { [k: string]: { [c: string]: string | boolean } } = {
    ...pkgCommandsRan,
  };
  for (let pkg of commands) {
    //@ts-ignore
    if (!pkg[`${commandPrefix}command`]) continue;
    //@ts-ignore
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
            const pipeToFunction = { ...pkg, pkgCommandsRan: _pkgCommandsRan };
            yield runningCommand.command(pipeToFunction);

            if (typeof pubCommand === "object" && pubCommand.pipe) {
              console.warn(`We cannot pipe the function command in ${pkg.pkg}`);
            }
          } catch (e) {
            console.error(e);
          }
        } else {
          const ranCommand = yield runCommand({
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
  commands: PkgPublish[];
  command: string;
}): Generator<any, PkgPublish[], any> {
  let subPublishCommand = command.slice(7, 999);
  let commandsToRun: PkgPublish[] = [];
  for (let pkg of commands) {
    //@ts-ignore
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

export const sh = function* (
  command: string,
  options: object,
  log: false | string
): Generator<string> {
  if (command.includes("|")) {
    try {
      //@ts-ignore
      const child: any = yield execa.command(command, {
        ...options,
        shell: true,
        all: true,
        timeout: 1200000,
      });
      const out = child.stdout;
      if (log !== false) {
        console.log(out);
      }
      return out;
    } catch (e) {
      throw new Error(e);
    }
  } else {
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
    const stripped: string = stripAnsi(
      //@ts-ignore
      Buffer.concat(out.tail).toString().trim()
    );
    return stripped;
  }
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
