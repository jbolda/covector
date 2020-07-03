import yargs from "yargs";

export function* cli(argv: readonly string[], covector: (arg0: { command: string; dryRun: boolean; }) => any) {
  const options = parseOptions(argv);
  return yield covector(options);
};

function parseOptions(argv: readonly string[]): { command: string, dryRun: boolean } {
  let rawOptions = yargs
    .scriptName("covector")
    .command(["status", "*"], "run status command")
    .command("config", "output current config")
    .command("version", "run version command")
    .command("publish", "run publish command")
    .options({
      "dry-run": {
        type: 'boolean',
        default: false,
        describe:
          "run a command that shows the expected command without executing",
      }
    })
    .demandCommand(1)
    .help()
    .epilogue(
      "For more information on covector, see: https://www.github.com/jbolda/covector"
    )
    .parse(argv);

  return { command: rawOptions._[0], dryRun: rawOptions["dry-run"] };
}
