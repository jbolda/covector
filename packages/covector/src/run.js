const { spawn, timeout } = require("effection");
const { main, ChildProcess } = require("@effection/node");
const { once, throwOnErrorEvent } = require("@effection/events");
const { configFile, changeFiles } = require("@covector/files");
const { assemble, mergeIntoConfig } = require("@covector/assemble");
const { apply } = require("@covector/apply");

module.exports.main = async ({ command }) =>
  await main(function* start() {
    yield run({ command });
  });

function* run({ command }) {
  const cwd = process.cwd();
  const config = yield configFile({ cwd });
  const changesArray = yield changeFiles({ cwd });
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
      return `There are ${assembledChanges.releases.length} changes.`;
    }
  } else if (command === "config") {
    delete config.vfile;
    return console.dir(config);
  } else if (command === "version") {
    yield raceTime();
    const commands = mergeIntoConfig({
      assembledChanges,
      config,
      command: "version",
    });

    // TODO create the changelog
    return yield apply({ changeList: commands, config });
  } else if (command === "publish") {
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
  }
}

module.exports.run = run;

function raceTime(
  t = 120000,
  msg = `timeout out waiting ${t / 1000}s for command`
) {
  return spawn(function* () {
    yield timeout(t);
    throw new Error(msg);
  });
}
