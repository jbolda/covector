const {
  attemptCommands,
  confirmCommandsToRun,
  raceTime,
} = require("@covector/command");
const {
  configFile,
  changeFiles,
  changeFilesToVfile,
  changeFilesRemove,
} = require("@covector/files");
const { assemble, mergeIntoConfig } = require("@covector/assemble");
const { fillChangelogs } = require("@covector/changelog");
const { apply, changesConsideringParents } = require("@covector/apply");

module.exports.covector = function* covector({
  command,
  dryRun = false,
  cwd = process.cwd(),
}) {
  const config = yield configFile({ cwd });
  const changesPaths = yield changeFiles({
    cwd,
    changeFolder: config.changeFolder,
  });
  const changesVfiles = changeFilesToVfile({
    cwd,
    paths: changesPaths,
  });
  const assembledChanges = yield assemble({
    cwd,
    vfiles: changesVfiles,
    config,
  });

  if (command === "status" || !command) {
    if (changesVfiles.length === 0) {
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
    yield raceTime({ t: config.timeout });
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

    if (dryRun) {
      console.log("==== commands ready to run ===");
      console.log(commands);
    }

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

    if (command === "version" && !dryRun)
      yield changeFilesRemove({ cwd, paths: changesPaths });

    if (dryRun) {
      console.log("==== result ===");
      console.log(pkgCommandsRan);
    }

    return pkgCommandsRan;
  } else {
    yield raceTime({ t: config.timeout });
    const commands = yield mergeIntoConfig({
      assembledChanges,
      config,
      command,
      cwd,
      dryRun,
    });

    if (dryRun) {
      console.log("==== commands ready to run ===");
      console.log(commands);
    }

    if (commands.length === 0) {
      console.log(`No commands configured to run on [${command}].`);
      return `No commands configured to run on [${command}].`;
    }

    const commandsToRun = yield confirmCommandsToRun({ cwd, commands });

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
      commands: commandsToRun,
      commandPrefix: "pre",
      command,
      pkgCommandsRan,
      dryRun,
    });
    pkgCommandsRan = yield attemptCommands({
      cwd,
      commands: commandsToRun,
      command,
      pkgCommandsRan,
      dryRun,
    });
    pkgCommandsRan = yield attemptCommands({
      cwd,
      commands: commandsToRun,
      commandPrefix: "post",
      command,
      pkgCommandsRan,
      dryRun,
    });

    if (dryRun) {
      console.log("==== result ===");
      console.log(pkgCommandsRan);
    }

    return pkgCommandsRan;
  }
};
