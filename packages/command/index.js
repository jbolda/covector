const { spawn, timeout } = require("effection");
const { once, on } = require("@effection/events");
const execa = require("execa");
const path = require("path");
const { cpuUsage } = require("process");

const attemptCommands = function* ({
  cwd,
  commands,
  command,
  commandPrefix = "",
  pkgCommandsRan,
  dryRun,
}) {
  let _pkgCommandsRan = { ...pkgCommandsRan };
  for (let pkg of commands) {
    if (!pkg[`${commandPrefix}command`]) continue;
    const pubCommands =
      typeof pkg[`${commandPrefix}command`] === "string" ||
      !Array.isArray(pkg[`${commandPrefix}command`])
        ? [pkg[`${commandPrefix}command`]]
        : pkg[`${commandPrefix}command`];
    let stdout = "";
    for (let pubCommand of pubCommands) {
      const runningCommand = {};
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
        } else {
          runningCommand.command = !pubCommand.dryRunCommand
            ? pubCommand.command
            : pubCommand.dryRunCommand;
          runningCommand.shouldRunCommand = !dryRun;
        }
      } else {
        runningCommand.command = pubCommand;
        runningCommand.shouldRunCommand = !dryRun;
      }

      if (runningCommand.shouldRunCommand) {
        const ranCommand = yield runCommand({
          command: runningCommand.command,
          cwd,
          pkg: pkg.pkg,
          pkgPath: pkg.path,
          log: `${pkg.pkg} [${commandPrefix}${command}]: ${runningCommand.command}`,
        });

        if (pubCommand.pipe) {
          stdout = `${stdout}${ranCommand}\n`;
        }
      } else {
        console.log(
          `dryRun >> ${pkg.pkg} [${commandPrefix}${command}]: ${runningCommand.command}`
        );
      }
    }

    if (!!pkgCommandsRan)
      _pkgCommandsRan[pkg.pkg][`${commandPrefix}command`] =
        stdout !== "" ? stdout : true;
  }
  return _pkgCommandsRan;
};

const confirmCommandsToRun = function* ({ cwd, commands }) {
  let commandsToRun = [];
  for (let pkg of commands) {
    if (!!pkg.getPublishedVersion) {
      const version = yield runCommand({
        command: pkg.getPublishedVersion,
        cwd,
        pkg: pkg.pkg,
        pkgPath: pkg.path,
        stdio: "pipe",
        log: `Checking if ${pkg.pkg}@${pkg.pkgFile.version} is already published with: ${pkg.getPublishedVersion}`,
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

const runCommand = function* ({
  pkg,
  command,
  cwd,
  pkgPath,
  stdio = "pipe",
  log = `running command for ${pkg}`,
}) {
  let child;
  try {
    return yield function* () {
      if (log !== false) console.log(log);
      child = yield execa.command(command, {
        cwd: path.join(cwd, pkgPath),
        shell: process.env.shell || true,
        windowsHide: true,
        all: true,
        env: { FORCE_COLOR: 0 },
      });

      if (log !== false) console.log(child.all);
      return child.all;
    };
  } catch (error) {
    throw error;
  }
};

const raceTime = function (
  t = 120000,
  msg = `timeout out waiting ${t / 1000}s for command`
) {
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
