import { spawn } from "effection";
import { exec, Process } from "@effection/process";
import stripAnsi from "strip-ansi";

type Responses = [q: string, a: string][];

export function* runCommand(
  command: string,
  cwd: string,
  responses: Responses
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
      stdout += respondToQuestion({ chunk, runCommand }, responses);
    })
  );
  yield spawn(
    runCommand.stderr.forEach((chunk) => {
      stderr += chunk;
    })
  );

  let status = yield runCommand.join();

  return { stdout, stderr, status };
}

const respondToQuestion = (
  context: {
    chunk: Buffer;
    runCommand: Process;
  },
  responses: Responses
) => {
  let { chunk, runCommand } = context;
  const cleanChunk = stripAnsi(chunk.toString()).trim();
  const finalChunk = cleanChunk !== "" ? `${cleanChunk}\n` : cleanChunk;

  let question = "";
  let respond = false;
  const outLast = cleanChunk.split("\n").length - 1;
  const outSecondLast = cleanChunk.split("\n").length - 2;
  if (cleanChunk.split("\n")[outLast].startsWith("?")) {
    question = cleanChunk.split("\n")[outLast];
    respond = true;
  } else if (
    outSecondLast > 0 &&
    cleanChunk.split("\n")[outSecondLast].startsWith("?")
  ) {
    question = cleanChunk.split("\n")[outSecondLast];
    respond = true;
  }

  if (respond) {
    const response = decideResponse(responses, question);
    if (response) runCommand.stdin.send(response);
  }

  return finalChunk;
};

const pressEnter = String.fromCharCode(13);
const decideResponse = (responses: Responses, question: string) => {
  let respondWith: string | undefined;
  responses.forEach((response) => {
    const [q, a] = response;
    if (question.includes(q) && !respondWith) {
      if (a === "pressEnter") {
        respondWith = pressEnter;
      } else {
        respondWith = a;
      }
    }
  });
  return respondWith;
};
