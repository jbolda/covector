const { spawn, timeout } = require("effection");
const { ChildProcess } = require("@effection/node");
const { once, throwOnErrorEvent } = require("@effection/events");
const yargs = require("yargs");
const { configFile, changeFiles } = require("@covector/files");
const { assemble, mergeIntoConfig } = require("@covector/assemble");
const { apply } = require("@covector/apply");

function raceTime(
  t = 120000,
  msg = `timeout out waiting ${t / 1000}s for command`
) {
  return spawn(function* () {
    yield timeout(t);
    throw new Error(msg);
  });
}

module.exports.cli = function* (argv) {
  const cwd = process.cwd();
  const config = yield configFile({ cwd });
  const options = parseOptions(config, argv);
  const changesArray = yield changeFiles({ cwd });
  const assembledChanges = assemble(changesArray);

  if (options.command === "status") {
    if (changesArray.length === 0) {
      console.info("There are no changes.");
    } else {
      console.log("changes:");
      return Object.keys(assembledChanges.releases).forEach((release) => {
        console.log(`${release} => ${assembledChanges.releases[release].type}`);
        console.dir(assembledChanges.releases[release].changes);
      });
    }
  } else if (options.command === "config") {
    delete config.vfile;
    return console.dir(config);
  } else if (options.command === "version") {
    yield raceTime();
    const commands = mergeIntoConfig({
      assembledChanges,
      config,
      command: "version",
    });

    // TODO create the changelog
    return yield apply({ changeList: commands, config });
  } else if (options.command === "publish") {
    yield raceTime();
    const commands = mergeIntoConfig({
      assembledChanges,
      config,
      command: "publish",
    });
    // TODO create the changelog
    for (let pkg of commands) {
      console.log(`publishing ${pkg.pkg} with ${pkg.publish}`);
      let child = yield ChildProcess.spawn(pkg.publish, [], {
        cwd: pkg.path,
        shell: process.env.shell,
        stdio: "inherit",
        windowsHide: true,
      });

      yield throwOnErrorEvent(child);
      yield once(child, "exit");
    }
    return;
    return;
  }
};

function parseOptions(config, argv) {
  let rawOptions = yargs({})
    .scriptName("covector")
    .command("status", "run status command")
    .command("config", "output current config")
    .command("version", "run version command")
    .command("publish", "run publish command")
    .demandCommand(1)
    .help()
    .parse(argv);

  return { command: rawOptions._[0] };
}
