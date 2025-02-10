import {
  execa,
  Options as ExecaOptions,
  type ResultPromise,
  type Result,
  type Options,
  type StdinOption,
  type StdoutStderrOption,
  type TemplateExpression,
  type Message,
  type VerboseObject,
  type ExecaMethod,
} from "execa";
import type { Logger } from "@covector/types";
import {
  spawn,
  call,
  type Operation,
  resource,
  type Stream,
  stream,
  each,
} from "effection";
import { split } from "shellwords";

export interface ExecaProcess extends Operation<Result<Options>> {
  /**
   * A stream of lines coming from both stdin and stdout. The stream
   * will terminate when stdout and stderr are closed which usually
   * corresponds to the process ending.
   */
  lines: Stream<string | Uint8Array<ArrayBufferLike>, void>;
}

export function x(
  cmd: string,
  options?: ExecaOptions,
  log?: false | string,
  logger?: Logger
): Operation<ExecaProcess> {
  return resource(function* (provide) {
    const child = commandWithPipes(cmd, { windowsHide: true, ...options });

    console.log({ child: child[Symbol.asyncIterator] });

    let output = call(() => child);

    let process = {
      *[Symbol.iterator]() {
        return yield* output;
      },
      lines: stream(child),
      // *kill(signal) {
      //   output.kill(signal);
      //   yield* output;
      // },
    };

    try {
      yield* provide(process);
    } finally {
      // yield* process.kill();
    }
  });
}

export function commandWithPipes(
  commandString: string,
  options: Partial<ExecaOptions> = {}
) {
  if (commandString.includes(" | ")) {
    const [primaryCommandString, ...pipedCommandStrings] =
      commandString.split(" | ");
    const [primaryCommand, ...primaryArgs] = split(primaryCommandString);
    let command = execa(primaryCommand, primaryArgs, options);

    for (const pipedCommandString of pipedCommandStrings) {
      const [pipedCommand, ...pipedArgs] = split(pipedCommandString);
      // @ts-expect-error types get weird with the pipe
      command = command.pipe(pipedCommand, pipedArgs, options);
    }
    return command;
  } else {
    const [command, ...args] = split(commandString);
    return execa(command, args, options);
  }
}

export function* sh(
  command: string,
  options: Partial<ExecaOptions> = {},
  log: false | string,
  logger: Logger
): Operation<{ stdout: string; stderr: string; out: string }> {
  let out = "";
  let stdout = "";
  let stderr = "";

  const child = yield* x(command, options);

  for (let line of yield* each(child.lines)) {
    out += line + "\n";
    if (log !== false) logger.info(line);
    yield* each.next();
  }

  return { stdout, stderr, out: out.trim() };
}
