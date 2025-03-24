import { type Operation, each } from "effection";
import fs from "node:fs";
import path from "node:path";
import { assert } from "vitest";
import { x, type TinyProcess } from "@covector/command";
import strip from "strip-ansi";

export const loadContent = (cwd: string, pathToContent: string) => {
  return fs.readFileSync(path.join(cwd, pathToContent), { encoding: "utf8" });
};

export const checksWithObject =
  (keys = ["command"]) =>
  (received, expected) => {
    if (received.msg !== expected.msg || received.level !== expected.level) {
      assert.deepEqual(received, expected);
    }
    for (let key of keys) {
      if (expected?.[key]) assert.deepEqual(received?.[key], expected?.[key]);
    }
  };

export const checksChunksInMsg =
  (keys = ["command"]) =>
  (received, expected) => {
    if (received.level !== expected.level) {
      assert.deepEqual(received, expected);
    }
    if (expected.err) {
      assert.include(
        received.msg,
        expected.err,
        `Expected ${received.msg} to include ${expected.err}, but received:\n${JSON.stringify(received, null, 2)}`
      );
    } else if (received.msg !== expected.msg) {
      if (Array.isArray(expected.msg)) {
        for (let chunk of expected.msg) {
          assert.include(
            received.msg,
            chunk,
            `\nexpected:\n${JSON.stringify(expected, null, 2)}\n\nreceived:\n${JSON.stringify(received, null, 2)}\n`
          );
        }
      } else {
        assert.deepEqual(received, expected);
      }
    }
    for (let key of keys) {
      if (expected?.[key]) assert.deepEqual(received?.[key], expected?.[key]);
    }
  };

// some fanciness to get the path resolved for Windows
// without going through the absolute dir which causes issues
// with command line compat and complicates things further
export const command = (command: string, cwd: string) =>
  `node "${path
    .relative(cwd, path.join(__dirname, "./../bin/covector.mjs"))
    .split(path.sep)
    .join("/")}" ${command}`;

type Responses = [q: string | RegExp, a: string][];

export function* runCommand(
  command: string,
  cwd: string,
  responses: Responses = [],
  timeout: number = 5000
): Operation<{
  out: string;
  status: { code: number };
  responded: string;
}> {
  let out = "";
  let responded = "";

  const debug = false;
  const child = yield* x(command, { nodeOptions: { cwd } });
  const elegantlyRespond = responses.length > 0;
  let responseCount = 0;

  for (let line of yield* each(child.lines)) {
    out += line + "\n";

    const lastMessage = strip(line);
    if (debug)
      console.dir({ /* stdout: stdoutBuffer.toString(), */ lastMessage });
    if (elegantlyRespond) {
      const response = tryResponse({
        responseCount,
        responses,
        child,
        lastMessage,
      });
      if (response.length > 0) responseCount = responseCount + 1;

      responded += response;
    } else {
      if (child?.process?.stdin) child?.process?.stdin.write(pressEnter);
    }
    yield* each.next();
  }

  let status = { code: 0 };

  return { out, status, responded };
}

const pressEnter = String.fromCharCode(13);

const tryResponse = ({
  responseCount,
  responses,
  child,
  lastMessage,
}: {
  responseCount: number;
  responses: Responses;
  child: TinyProcess;
  lastMessage?: string;
}) => {
  if (responseCount >= responses.length) {
    return "";
  }
  const [question, answer] = responses[responseCount];
  if (lastMessage && lastMessage.match(question)) {
    if (answer === "pressEnter") {
      // console.log(`sending Enter to ${lastMessage}`);
      if (child?.process?.stdin) child.process.stdin.write(pressEnter);
    } else {
      // console.log(`sending ${answer} to ${lastMessage}`);
      if (child?.process?.stdin) child.process.stdin.write(answer + pressEnter);
    }
    return lastMessage.trim() + "\n";
  }
  return "";
};
