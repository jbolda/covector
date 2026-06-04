import { type Operation, call } from "effection";
import fs from "node:fs";
import path from "node:path";
import { exec } from "@effectionx/process";
import { timebox } from "@effectionx/timebox";
import { assert } from "vitest";
import strip from "strip-ansi";
import * as logTest from "../../../helpers/test-logger.ts";

export const loadContent = (cwd: string, pathToContent: string) => {
  return fs.readFileSync(path.join(cwd, pathToContent), { encoding: "utf8" });
};

export const checksWithObject =
  (keys = ["command"]) =>
  (received, expected) => {
    if (typeof expected === "function") {
      expected(received);
      return;
    }

    const normalizeMsg = (value: unknown): string => {
      if (Buffer.isBuffer(value)) return value.toString("utf8").trim();
      if (typeof value === "string") return value;
      if (value == null) return "";
      try {
        return String(value);
      } catch {
        return "";
      }
    };
    const receivedMsg = normalizeMsg(received?.msg);
    const expectedMsg = normalizeMsg(expected?.msg);

    // special-case: some npm registries print package descriptions in slightly
    // different places; tests may use the '__ALLOW_BLANK_OR_DESC__' sentinel to
    // accept either a blank line or the package description text.
    if (expected && expectedMsg === "__ALLOW_BLANK_OR_DESC__") {
      if (
        receivedMsg === "" ||
        receivedMsg.includes("Multi-binding collection")
      ) {
        // accepted — don't assert
        return;
      }
    }

    if (Array.isArray(expected?.msg)) {
      for (let chunk of expected.msg) {
        assert.include(
          receivedMsg,
          chunk,
          `\nexpected:\n${JSON.stringify(expected, null, 2)}\n\nreceived:\n${JSON.stringify(received, null, 2)}\n`,
        );
      }
      if (received.level !== expected.level) {
        assert.deepEqual(received, expected);
      }
      for (let key of keys) {
        if (expected?.[key]) assert.deepEqual(received?.[key], expected?.[key]);
      }
      return;
    }

    if (receivedMsg !== expectedMsg || received.level !== expected.level) {
      assert.deepEqual(received, expected);
    }
    for (let key of keys) {
      if (expected?.[key]) assert.deepEqual(received?.[key], expected?.[key]);
    }
  };

export const checksChunksInMsg =
  (keys = ["command"]) =>
  (received, expected) => {
    const normalizeMsg = (value: unknown): string => {
      if (Buffer.isBuffer(value)) return value.toString("utf8").trim();
      if (typeof value === "string") return value;
      if (value == null) return "";
      try {
        return String(value);
      } catch {
        return "";
      }
    };
    const receivedMsg = normalizeMsg(received?.msg);
    const expectedMsg = normalizeMsg(expected?.msg);

    if (received.level !== expected.level) {
      assert.deepEqual(received, expected);
    }
    if (expected.err) {
      assert.include(
        receivedMsg,
        expected.err,
        `Expected ${receivedMsg} to include ${expected.err}, but received:\n${JSON.stringify(received, null, 2)}`,
      );
    } else if (receivedMsg !== expectedMsg) {
      if (Array.isArray(expected.msg)) {
        for (let chunk of expected.msg) {
          assert.include(
            receivedMsg,
            chunk,
            `\nexpected:\n${JSON.stringify(expected, null, 2)}\n\nreceived:\n${JSON.stringify(received, null, 2)}\n`,
          );
        }
      } else if (
        expectedMsg.includes("node:internal/") &&
        receivedMsg.includes("node:internal/")
      ) {
        // Node patch versions can shift internal frame names/line numbers.
        assert.include(receivedMsg, "node:internal/");
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

export function captureLoggerMiddleware(logs: logTest.TestLogEntry[]) {
  return {
    *info(args: unknown[], next: (...args: unknown[]) => any) {
      logTest.pushEntry(logs, 30, args);
      return yield* next(...args);
    },
    *error(args: unknown[], next: (...args: unknown[]) => any) {
      logTest.pushEntry(logs, 50, args);
      return yield* next(...args);
    },
    *warn(args: unknown[], next: (...args: unknown[]) => any) {
      logTest.pushEntry(logs, 40, args);
      return yield* next(...args);
    },
    *debug(args: unknown[], next: (...args: unknown[]) => any) {
      logTest.pushEntry(logs, 20, args);
      return yield* next(...args);
    },
    *fatal(args: unknown[], next: (...args: unknown[]) => any) {
      logTest.pushEntry(logs, 60, args);
      return yield* next(...args);
    },
    *stdout(args: unknown[], next: (...args: unknown[]) => any) {
      logTest.pushEntry(logs, 30, args);
      return yield* next(...args);
    },
    *stderr(args: unknown[], next: (...args: unknown[]) => any) {
      logTest.pushEntry(logs, 30, args);
      return yield* next(...args);
    },
  };
}

type Responses = [q: string | RegExp, a: string][];

export function* runCommand(
  command: string,
  cwd: string,
  responses: Responses = [],
  timeout: number = 5000,
): Operation<{
  out: string;
  status: { code: number };
  responded: string;
}> {
  let out = "";
  let responded = "";
  let responseCount = 0;
  let pendingPrompt = "";

  const process = yield* exec(command, {
    cwd,
    shell: true,
  });

  yield* process.around({
    *stdout(line) {
      const [bytes] = line;
      const text = bytes.toString("utf8");
      out += text;
      const response = tryResponse({
        responseCount,
        responses,
        stdin: process.stdin,
        lastMessage: appendPrompt(pendingPrompt, text),
      });
      if (response.length > 0) {
        responseCount += 1;
        responded += response;
        pendingPrompt = "";
      } else {
        pendingPrompt = appendPrompt(pendingPrompt, text);
      }
    },
    *stderr(line) {
      const [bytes] = line;
      const text = bytes.toString("utf8");
      out += text;
      const response = tryResponse({
        responseCount,
        responses,
        stdin: process.stdin,
        lastMessage: appendPrompt(pendingPrompt, text),
      });
      if (response.length > 0) {
        responseCount += 1;
        responded += response;
        pendingPrompt = "";
      } else {
        pendingPrompt = appendPrompt(pendingPrompt, text);
      }
    },
  });

  const boxed = yield* timebox(timeout, () => process.join());
  if (boxed.timeout) {
    throw new Error(`timeout waiting ${timeout}ms for command: ${command}`);
  }

  return { out, status: boxed.value, responded };
}

const pressEnter = String.fromCharCode(13);

const appendPrompt = (pendingPrompt: string, chunk: string) => {
  const stripped = strip(chunk);
  if (stripped.length === 0) {
    return pendingPrompt;
  }
  return pendingPrompt + stripped;
};

const tryResponse = ({
  responseCount,
  responses,
  stdin,
  lastMessage,
}: {
  responseCount: number;
  responses: Responses;
  stdin?: { send(message: string): void } | null;
  lastMessage?: string;
}) => {
  if (responseCount >= responses.length) {
    return "";
  }
  const [question, answer] = responses[responseCount];
  if (lastMessage && lastMessage.match(question)) {
    if (answer === "pressEnter") {
      if (stdin) stdin.send(pressEnter);
    } else {
      if (stdin) stdin.send(answer + pressEnter);
    }
    return lastMessage.trim() + "\n";
  }
  return "";
};
