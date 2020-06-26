const { spawn, timeout } = require("effection");
const execa = require("execa");
const { once, on } = require("@effection/events");
const { configFile, changeFiles } = require("@covector/files");
const { assemble, mergeIntoConfig } = require("@covector/assemble");
const { fillChangelogs } = require("@covector/changelog");
const { apply } = require("@covector/apply");
const path = require("path");

module.exports.covector = function* covector({ command, cwd = process.cwd() }) {
  const config = yield configFile({ cwd });
  const changesArray = yield changeFiles({
    cwd,
    remove: command === "version",
  });
  const assembledChanges = assemble(changesArray);

  if (command === "status") {
    if (changesArray.length === 0) {
      console.info("There are no changes.");
      return "No changes.";
    } else {
      console.log("changes:");
      Object.keys(assembledChanges.releases).forEach((release) => {
        console.log(`${release} => ${assembledChanges.releases[release].type}`);
        console.dir(assembledChanges.releases[release].changes);
      });
      return `There are ${
        Object.keys(assembledChanges.releases).length
      } changes which include${Object.keys(assembledChanges.releases).map(
        (release) =>
          ` ${release} with ${assembledChanges.releases[release].type}`
      )}`;
    }
  } else if (command === "config") {
    delete config.vfile;
    return console.dir(config);
  } else if (command === "version") {
    yield raceTime();
    const commands = yield mergeIntoConfig({
      assembledChanges,
      config,
      command: "version",
    });

    const applied = yield apply({ changeList: commands, config, cwd });
    yield fillChangelogs({ applied, assembledChanges, config, cwd });
    return applied;
  } else if (command === "publish") {
    yield raceTime();
    const commands = yield mergeIntoConfig({
      assembledChanges,
      config,
      command: "publish",
      cwd,
    });

    let published = Object.keys(config.packages).reduce((pkgs, pkg) => {
      pkgs[pkg] = false;
      return pkgs;
    }, {});

    for (let pkg of commands) {
      if (!!pkg.getPublishedVersion) {
        const version = runCommand({
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
          continue;
        }
      }

      const response = yield runCommand({
        command: pkg.publish,
        cwd,
        pkg: pkg.pkg,
        pkgPath: pkg.path,
        log: `publishing ${pkg.pkg} with ${pkg.publish}`,
      });

      published[pkg.pkg] = true;
    }
    return published;
  }
};

function raceTime(
  t = 120000,
  msg = `timeout out waiting ${t / 1000}s for command`
) {
  return spawn(function* () {
    yield timeout(t);
    throw new Error(msg);
  });
}

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
      console.log(log);
      child = yield execa.command(command, {
        cwd: path.join(cwd, pkgPath),
        shell: process.env.shell || true,
        windowsHide: true,
      });

      console.log(child.stdout);
      return child.stdout;
    };
  } catch (error) {
    throw error;
  }
};
