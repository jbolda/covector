import { spawn, withTimeout, Operation, MainError } from "effection";
import { exec, Process } from "@effection/process";
import stripAnsi from "strip-ansi";
import fs from "node:fs";
import path from "node:path";
import { assert } from "vitest";

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
      assert.include(received.msg, expected.err);
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
  responses: Responses = []
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
    const runCommand: Process = yield exec(command, { cwd });
    const elegantlyRespond = responses.length > 0;

    yield spawn(
      runCommand.stdout.forEach(function* (chunk) {
        stdoutBuffer = Buffer.concat([stdoutBuffer, chunk]);
        if (elegantlyRespond) {
          const lastMessage = chunk
            .toString("utf-8")
            .split("\n")
            .map((ansied) => stripAnsi(ansied).trim())
            .filter((message) => message.length > 0)
            .pop();

          if (debug) console.log(lastMessage);
          responded += tryResponse({ responses, runCommand, lastMessage });
        } else {
          runCommand.stdin.send(pressEnter);
        }
      })
    );

    yield spawn(
      runCommand.stderr.forEach((chunk) => {
        stderrBuffer = Buffer.concat([stderrBuffer, chunk]);
      })
    );

    let status = yield withTimeout(24900, runCommand.join());

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
  responses,
  runCommand,
  lastMessage,
}: {
  responses: Responses;
  runCommand: Process;
  lastMessage?: string;
}) => {
  for (let [question, answer] of responses) {
    if (lastMessage && lastMessage.match(question)) {
      if (answer === "pressEnter") {
        // console.log(`sending Enter to ${lastMessage}`);
        runCommand.stdin.send(pressEnter);
      } else {
        // console.log(`sending ${answer} to ${lastMessage}`);
        runCommand.stdin.send(answer + pressEnter);
      }
      return lastMessage.trim() + "\n";
    }
  }
  return "";
};
