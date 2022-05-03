import { Operation, spawn } from "effection";
import { exec, Process } from "@effection/process";
import stripAnsi from "strip-ansi";

type Responses = [q: string, a: string][];

export function* runCommand(
  command: string,
  cwd: string,
  responses: Responses = []
): Generator<
  any,
  { stdout: string; stderr: string; status: { code: number } },
  any
> {
  const runCommand: Process = yield exec(command, { cwd });

  let stdout = "";
  let stderr = "";
  yield spawn(
    runCommand.stdout.forEach((chunk) => {
      stdout += stripAnsi(chunk.toString());
    })
  );
  yield spawn(
    runCommand.stderr.forEach((chunk) => {
      stderr += chunk;
    })
  );
  yield converse(responses, runCommand.stdin, runCommand.stdout);

  let status = yield runCommand.join();

  return { stdout, stderr, status };
}

const pressEnter = String.fromCharCode(13);
function* converse(responses: Responses, stdin: any, stdout: any) {
  // this should work, but it still seems to hang?
  //   for (let [question, answer] of responses) {
  //     yield stdout.lines().grep(question);
  //     if (answer === "pressEnter") {
  //       stdin.send(pressEnter);
  //     } else {
  //       stdin.send(answer);
  //       // seems that some responses maybe require input
  //       // and then pressing Enter to finish the input
  //       stdin.send(pressEnter);
  //     }
  //   }

  // until 👆 is working, going to just loop through all responses
  // on every line that appears to be a question and send that answer
  yield stdout.lines().forEach((chunk: string) => {
    // it seems to log out all questions at once sometimes?
    // other times it only does the first two questions?
    // console.log("======");
    // console.log(chunk.toString().startsWith("?"), chunk);
    // console.log("-----");
    // console.log(chunk.toString().trim().startsWith("?"), chunk.trim());
    // console.log("????????");
    // console.log(stripAnsi(chunk).startsWith("?"), stripAnsi(chunk));
    // seems with all the `pressEnter`, we get some questions
    //  that start with a new line
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
