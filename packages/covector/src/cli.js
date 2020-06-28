const yargs = require("yargs");

module.exports.cli = function* (argv, covector) {
  const options = parseOptions(argv);
  return yield covector(options);
};

function parseOptions(argv) {
  let rawOptions = yargs({})
    .scriptName("covector")
    .command(["status", "*"], "run status command")
    .command("config", "output current config")
    .command("version", "run version command")
    .command("publish", "run publish command")
    .option("dry-run", {
      describe:
        "run a command that shows the expected command without executing",
    })
    .demandCommand(1)
    .help()
    .epilogue(
      "For more information on covector, see: https://www.github.com/jbolda/covector"
    )
    .parse(argv);

  return { command: rawOptions._[0], dryRun: rawOptions.dryRun };
}
