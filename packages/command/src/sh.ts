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
    const [command, ...args] = split(cmd);
    const child = execa(command, args, { windowsHide: true, ...options });

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

export function* sh(
  command: string,
  options: Partial<ExecaOptions> = {},
  log: false | string,
  logger: Logger
): Operation<{ stdout: string; stderr: string; out: string }> {
  let out = "";
  let stdout = "";
  let stderr = "";

  const workingOptions = { ...options };
  if (command.includes(" | ") && !options?.shell) {
    workingOptions.shell = true;
    logger.warn(`"|" detected in command, setting shell to true: ${command}`);
  }

  const child = yield* x(command, workingOptions);

  for (let line of yield* each(child.lines)) {
    out += line + "\n";
    if (log !== false) logger.info(line);
    yield* each.next();
  }

  return { stdout, stderr, out: out.trim() };
}
