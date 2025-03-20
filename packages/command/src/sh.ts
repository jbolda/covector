import { x as $x, type KillSignal, type Options, type Output } from "tinyexec";
import { tokenizeArgs } from "args-tokenizer";
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

export interface TinyProcess extends Operation<Output> {
  /**
   * A stream of lines coming from both stdin and stdout. The stream
   * will terminate when stdout and stderr are closed which usually
   * corresponds to the process ending.
   */
  lines: Stream<string, void>;

  /**
   * Send `signal` to this process
   * @paramu signal - the OS signal to send to the process
   */
  kill(signal?: KillSignal): Operation<void>;
}

export function x(
  cmd: string,
  options?: Partial<Options>
): Operation<TinyProcess> {
  return resource(function* (provide) {
    const aborter = new AbortController();
    const [command, ...args] = tokenizeArgs(cmd);
    const tinyexec = $x(command, args, {
      signal: aborter.signal,
      throwOnError: true,
      ...options,
    });

    try {
      let promise: Promise<Output> = tinyexec as unknown as Promise<Output>;

      let output = call(() => promise);

      let tinyproc: TinyProcess = {
        *[Symbol.iterator]() {
          return yield* output;
        },
        lines: stream(tinyexec),
        *kill(signal) {
          tinyexec.kill(signal);
          yield* output;
        },
      };

      yield* provide(tinyproc);
    } finally {
      // yield* tinyproc.kill();
    }
  });
}

export function* sh(
  command: string,
  options: Partial<Options["nodeOptions"]> = {},
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

  const child = yield* x(command, { nodeOptions: workingOptions });

  for (let line of yield* each(child.lines)) {
    out += line + "\n";
    if (log !== false) logger.info(line);
    yield* each.next();
  }

  return { stdout, stderr, out: out.trim() };
}
