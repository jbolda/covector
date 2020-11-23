const { spawn, timeout } = require("effection");
const { exec } = require("@effection/node");
const stripAnsi = require("strip-ansi");
const path = require("path");

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
      const runningCommand = { runFromRoot: pubCommand.runFromRoot };
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

      if (runningCommand.shouldRunCommand) {
        const ranCommand = yield runCommand({
          command: runningCommand.command,
          cwd,
          pkg: pkg.pkg,
          pkgPath: runningCommand.runFromRoot === true ? "" : pkg.path,
          log: `${pkg.pkg} [${commandPrefix}${command}${
            runningCommand.runFromRoot === true ? " run from the cwd" : ""
          }]: ${runningCommand.command}`,
        });

        if (pubCommand.pipe) {
          stdout = `${stdout}${ranCommand}\n`;
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

const confirmCommandsToRun = function* ({ cwd, commands, command }) {
  let subPublishCommand = command.slice(7, 999);
  let commandsToRun = [];
  for (let pkg of commands) {
    if (!!pkg[`getPublishedVersion${subPublishCommand}`]) {
      const version = yield runCommand({
        command: pkg[`getPublishedVersion${subPublishCommand}`],
        cwd,
        pkg: pkg.pkg,
        pkgPath: pkg.path,
        stdio: "pipe",
        log: `Checking if ${pkg.pkg}@${
          pkg.pkgFile.version
        } is already published with: ${
          pkg[`getPublishedVersion${subPublishCommand}`]
        }`,
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
  log = `running command for ${pkg}`,
}) {
  if (log !== false) console.log(log);
  raceTime();

  let child = yield sh(
    command,
    {
      cwd: path.join(cwd, pkgPath),
      encoding: "utf8",
    },
    log
  );

  return child;
};

const sh = function* (command, options, log) {
  let child = yield exec(command, options);

  if (log !== false) {
    yield spawn(
      child.stdout.subscribe().forEach(function* (datum) {
        const out = stripAnsi(datum.toString().trim());
        if (out !== "") console.log(out);
      })
    );

    yield spawn(
      child.stderr.subscribe().forEach(function* (datum) {
        const out = stripAnsi(datum.toString().trim());
        if (out !== "") console.error(out);
      })
    );
  }

  const out = yield child.expect();
  return stripAnsi(Buffer.concat(out.tail).toString().trim());
};

const raceTime = function ({
  t = 1200000,
  msg = `timeout out waiting ${t / 1000}s for command`,
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
