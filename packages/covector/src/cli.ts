import yargs from "yargs";
const { init } = require("./init.js");

export function* cli(
  argv: readonly string[],
  covector: (arg0: { command: string; dryRun: boolean }) => any
) {
  const options = parseOptions(argv);
  if (options.command === "init")
    return yield init({ ...options, changeFolder: options.directory });
  return yield covector(options);
}

function parseOptions(
  argv: readonly string[]
): {
  command: string;
  dryRun: boolean;
  yes: boolean | undefined;
  directory?: string;
} {
  let rawOptions = yargs
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
          default: ".changes",
          hidden: true,
        });
    })
    .command(["status", "*"], "run status command")
    .command("config", "output current config")
    .command("version", "run version command")
    .command("publish", "run publish command")
    .options({
      "dry-run": {
        type: "boolean",
        default: false,
        describe:
          "run a command that shows the expected command without executing",
      },
    })
    .demandCommand(1)
    .help()
    .epilogue(
      "For more information on covector, see: https://www.github.com/jbolda/covector"
    )
    .parse(argv);

  return {
    command: rawOptions._[0],
    dryRun: rawOptions["dry-run"],
    yes: rawOptions.yes,
    directory: rawOptions.directory,
  };
}
