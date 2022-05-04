import { Operation, spawn, createStream } from "effection";
import { exec, Process } from "@effection/process";
import stripAnsi from "strip-ansi";

type Responses = [q: string, a: string][];

export function* runCommand(
  command: string,
  cwd: string,
  responses: Responses | string = []
): Generator<
  any,
  { stdout: string; stderr: string; status: { code: number } },
  any
> {
  const runCommand: Process = yield exec(command, { cwd });
  const elegantlyRespond = !(typeof responses === "string");

  let stdout = "";
  let stderr = "";
  yield spawn(
    runCommand.stdout.forEach((chunk) => {
      const stripped = stripAnsi(chunk.toString()).trim();
      stdout += stripped.length > 0 ? stripped + `\n` : "";
      if (!elegantlyRespond) runCommand.stdin.send(pressEnter);
    })
  );
  yield spawn(
    runCommand.stderr.forEach((chunk) => {
      const stripped = stripAnsi(chunk.toString()).trim();
      stderr += stripped.length > 0 ? stripped + `\n` : "";
    })
  );

  if (elegantlyRespond)
    yield converse(responses, runCommand.stdin, runCommand.stdout);

  let status = yield runCommand.join();

  return { stdout, stderr, status };
}

const pressEnter = String.fromCharCode(13);
function* converse(
  responses: Responses,
  stdin: any,
  stdout: any
): Generator<any> {
  // this should work, but it still seems to hang?
  // for (let [question, answer] of responses) {
  //   yield stdout
  //     .lines()
  //     .map(stripAnsi)
  //     .filter((l: string) => l.startsWith("?"))
  //     .grep(question);
  //   if (answer === "pressEnter") {
  //     stdin.send(pressEnter);
  //   } else {
  //     stdin.send(answer);
  //     // seems that some responses maybe require input
  //     // and then pressing Enter to finish the input
  //     stdin.send(pressEnter);
  //   }
  // }
  // until 👆 is working, going to just loop through all responses
  // on every line that appears to be a question and send that answer
  yield stdout.lines().forEach((chunk: string) => {
    if (stripAnsi(chunk).startsWith("?")) {
      for (let [question, answer] of responses) {
        if (stripAnsi(chunk).includes(question)) {
          if (answer === "pressEnter") {
            stdin.send(pressEnter);
          } else {
            stdin.send(answer);
            // seems that some responses maybe require input
            // and then pressing Enter to finish the input
            stdin.send(pressEnter);
          }
        }
      }
    }
  });
}
