const { fork, spawn, timeout } = require("effection");
const yargs = require("yargs");
const { configFile, changeFiles } = require("@covector/files");
const { assemble } = require("@covector/assemble");
const spawnCommand = require("spawndamnit");

const raceTime = (t = 10000, msg = `timeout out waiting 10s for command`) =>
  spawn(function* () {
    yield timeout(t);
    throw new Error(msg);
  });

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
    // run mergeConfig with values via template function
    // create the changelog

    yield raceTime();
    let child = spawnCommand("ls");
    child.on("stdout", (data) => console.log(data.toString()));
    child.on("stderr", (data) => console.error(data.toString()));
    const forked = fork(child);
    return;
  } else if (options.command === "publish") {
    // run mergeConfig with values via template function
    // create the changelog

    yield raceTime();
    let child = spawnCommand("ls");
    child.on("stdout", (data) => console.log(data.toString()));
    child.on("stderr", (data) => console.error(data.toString()));
    const forked = fork(child);
    return;
  }

  return;
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
