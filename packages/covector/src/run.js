const { attemptCommands, raceTime } = require("@covector/command");
const { configFile, changeFiles } = require("@covector/files");
const { assemble, mergeIntoConfig } = require("@covector/assemble");
const { fillChangelogs } = require("@covector/changelog");
const { apply, changesConsideringParents } = require("@covector/apply");

module.exports.covector = function* covector({
  command,
  dryRun = false,
  cwd = process.cwd(),
}) {
  const config = yield configFile({ cwd });
  const changesArray = yield changeFiles({
    cwd,
    remove: command === "version" && !dryRun,
  });
  const assembledChanges = yield assemble({ cwd, vfiles: changesArray });

  if (command === "status" || !command) {
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
    const changes = changesConsideringParents({
      assembledChanges,
      config,
    });
    const commands = yield mergeIntoConfig({
      assembledChanges: changes,
      config,
      command,
      dryRun,
    });

    let pkgCommandsRan = Object.keys(config.packages).reduce((pkgs, pkg) => {
      pkgs[pkg] = {
        precommand: false,
        command: false,
        postcommand: false,
        applied: false,
      };
      return pkgs;
    }, {});

    pkgCommandsRan = yield attemptCommands({
      cwd,
      commands,
      commandPrefix: "pre",
      command,
      pkgCommandsRan,
      dryRun,
    });
    const applied = yield apply({
      commands,
      config,
      cwd,
      bump: !dryRun,
    });

    pkgCommandsRan = applied.reduce((pkgs, result) => {
      pkgs[result.name].applied = result;
      return pkgs;
    }, pkgCommandsRan);

    pkgCommandsRan = yield fillChangelogs({
      applied,
      assembledChanges: changes,
      config,
      cwd,
      pkgCommandsRan,
      create: !dryRun,
    });
    pkgCommandsRan = yield attemptCommands({
      cwd,
      commands,
      commandPrefix: "post",
      command,
      pkgCommandsRan,
      dryRun,
    });

    return pkgCommandsRan;
  } else {
    yield raceTime();
    const commands = yield mergeIntoConfig({
      assembledChanges,
      config,
      command,
      cwd,
      dryRun,
    });

    if (commands.length === 0) {
      console.log(`No commands configured to run on [${command}].`);
      return `No commands configured to run on [${command}].`;
    }

    let pkgCommandsRan = commands.reduce((pkgs, pkg) => {
      pkgs[pkg.pkg] = {
        precommand: false,
        command: false,
        postcommand: false,
        pkg,
      };
      return pkgs;
    }, {});

    pkgCommandsRan = yield attemptCommands({
      cwd,
      commands,
      commandPrefix: "pre",
      command,
      pkgCommandsRan,
      dryRun,
    });
    pkgCommandsRan = yield attemptCommands({
      cwd,
      commands,
      command,
      pkgCommandsRan,
      dryRun,
    });
    pkgCommandsRan = yield attemptCommands({
      cwd,
      commands,
      commandPrefix: "post",
      command,
      pkgCommandsRan,
      dryRun,
    });

    return pkgCommandsRan;
  }
};
