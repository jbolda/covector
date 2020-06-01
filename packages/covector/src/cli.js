const yargs = require("yargs");

module.exports.cli = function* (argv, run) {
  const options = parseOptions(argv);
  return yield run(options);
};

function parseOptions(argv) {
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
