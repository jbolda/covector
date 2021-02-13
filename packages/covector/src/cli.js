const yargs = require("yargs");
const { init } = require("./init.js");

module.exports.cli = function* (argv, covector) {
  const options = parseOptions(argv);
  if (options.command === "init")
    return yield init({ ...options, changeFolder: options.directory });
  return yield covector(options);
};

function parseOptions(argv) {
  let rawOptions = yargs({})
    .scriptName("covector")
    .command("init", "initialize covector in your repo", function (yargs) {
      return yargs
        .option("yes", {
          alias: "y",
          describe: "skip all questions using the default response for each",
          default: false,
        })
        .boolean("yes")
        .option("directory", {
          alias: "d",
          describe: "specify a custom change folder",
          hidden: true,
        });
    })
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

  return {
    command: rawOptions._[0],
    dryRun: rawOptions.dryRun,
    yes: rawOptions.yes,
    directory: rawOptions.directory,
  };
}
