import { spawn, withTimeout, Operation, MainError } from "effection";
import { exec, Process } from "@effection/process";
import stripAnsi from "strip-ansi";
import fs from "node:fs";
import path from "node:path";
import { assert } from "vitest";

export const loadContent = (cwd: string, pathToContent: string) => {
  return fs.readFileSync(path.join(cwd, pathToContent), { encoding: "utf8" });
};

const normalizeLineEndings = (s: string) => s?.replace(/\r\n/g, "\n");

export const checksWithObject =
  (keys = ["command"]) =>
  (received, expected) => {
    const receivedMsg = normalizeLineEndings(received.msg);
    const expectedMsg = normalizeLineEndings(expected.msg);
    if (receivedMsg !== expectedMsg || received.level !== expected.level) {
      assert.deepEqual(
        { ...received, msg: receivedMsg },
        { ...expected, msg: expectedMsg }
      );
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
    .relative(cwd, path.join(__dirname, "./../bin/covector.js"))
    .split(path.sep)
    .join("/")}" ${command}`;

type Responses = [q: string | RegExp, a: string][];

export function* runCommand(
  command: string,
  cwd: string,
  responses: Responses = [],
  timeout: number = 5000
): Operation<{
  stdout: string;
  stderr: string;
  status: { code: number };
  responded: string;
}> {
  let stdoutBuffer = Buffer.from("");
  let stderrBuffer = Buffer.from("");
  let stdout = "";
  let stderr = "";
  let responded = "";
  try {
    const debug = false;
    const commandExec: Process = yield exec(command, { cwd });
    const elegantlyRespond = responses.length > 0;
    let responseCount = 0;

    yield spawn(
      commandExec.stdout.forEach(function* (chunk) {
        stdoutBuffer = Buffer.concat([stdoutBuffer, chunk]);
        if (elegantlyRespond) {
          const lastMessage = stripAnsi(chunk.toString("utf-8")).trim();

          if (debug)
            console.dir({ /* stdout: stdoutBuffer.toString(), */ lastMessage });
          const response = tryResponse({
            responseCount,
            responses,
            commandExec,
            lastMessage,
          });
          if (response.length > 0) responseCount = responseCount + 1;

          responded += response;
        } else {
          commandExec.stdin.send(pressEnter);
        }
      })
    );

    yield spawn(
      commandExec.stderr.forEach((chunk) => {
        stderrBuffer = Buffer.concat([stderrBuffer, chunk]);
      })
    );

    let status = yield withTimeout(timeout, commandExec.join());

    stdout = stripAnsi(stdoutBuffer.toString("utf-8").trim());
    stderr = stripAnsi(stderrBuffer.toString("utf-8").trim());

    return { stdout, stderr, status, responded };
  } catch (error: any) {
    if (error && error?.name === "TimeoutError") {
      throw new MainError({
        message: `\nResponded:\n${responded}\n${error.message}`,
      });
    } else {
      throw error;
    }
  }
}

const pressEnter = String.fromCharCode(13);

const tryResponse = ({
  responseCount,
  responses,
  commandExec,
  lastMessage,
}: {
  responseCount: number;
  responses: Responses;
  commandExec: Process;
  lastMessage?: string;
}) => {
  if (responseCount >= responses.length) {
    return "";
  }
  const [question, answer] = responses[responseCount];
  if (lastMessage && lastMessage.match(question)) {
    if (answer === "pressEnter") {
      // console.log(`sending Enter to ${lastMessage}`);
      commandExec.stdin.send(pressEnter);
    } else {
      // console.log(`sending ${answer} to ${lastMessage}`);
      commandExec.stdin.send(answer + pressEnter);
    }
    return lastMessage.trim() + "\n";
  }
  return "";
};
