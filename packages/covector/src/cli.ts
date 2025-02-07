import yargs from "yargs";
import { covector } from "./run";
import { pino } from "pino";
import logStream from "./logger";

export function* cli(argv: readonly string[]): Generator<any, any, any> {
  const { command, directory, yes, dryRun, cwd } = parseOptions(argv);
  const stream = logStream();
  const logger = pino(stream);
  return yield* covector({
    logger,
    command,
    changeFolder: directory,
    yes,
    dryRun,
    cwd,
  });
}

function parseOptions(argv: readonly string[]): {
  command: string;
  dryRun: boolean;
  yes?: boolean;
  directory?: string;
  cwd: string;
} {
  const rawOptions = yargs(hideBin(process.argv))
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
    .options({
      cwd: {
        type: "string",
        default: ".",
        describe: "context in which to run",
      },
    })
    .demandCommand(1)
    .help()
    .epilogue(
      "For more information on covector, see: https://www.github.com/jbolda/covector"
    )
    .parseSync();

  return {
    command: String(rawOptions._[0]),
    cwd: rawOptions.cwd,
    dryRun: rawOptions.dryRun,
    yes: rawOptions.yes as boolean | undefined,
    directory: rawOptions.directory as string | undefined,
  };
}
function hideBin(argv: string[]): string | readonly string[] | undefined {
  throw new Error("Function not implemented.");
}
