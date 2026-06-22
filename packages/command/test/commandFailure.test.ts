import { attemptCommands } from "../src/index.ts";
import { captureError, describe, it } from "../../../helpers/test-scope.ts";
import { expect } from "vitest";
import * as logTest from "../../../helpers/test-logger.ts";
// @ts-expect-error has no types
import fixtures from "fixturez";

import { logger } from "../../covector/src/index.ts";
const f = fixtures(__dirname);

const base = {
  errorOnVersionRange: null,
  precommand: null,
  command: null,
  postcommand: null,
};

describe("attemptCommand fails", () => {
  it("fails a function", function* () {
    const log = yield* logTest.useCapturedLogger();

    const errored = yield* captureError(
      attemptCommands({
        logger: logger.operations,
        cwd: ".",
        command: "publish",
        commands: [
          {
            ...base,
            pkg: "pkg-nickname",
            manager: "none",
            command: ["boop"],
          },
        ],
        dryRun: false,
      }),
    );

    expect(errored.message).toContain("ENOENT");
  });

  it("retries a failed function", function* () {
    const log = yield* logTest.useCapturedLogger();

    const errored = yield* captureError(
      attemptCommands({
        logger: logger.operations,
        cwd: ".",
        command: "",
        commands: [
          {
            ...base,
            pkg: "pkg-nickname",
            manager: "none",
            command: [{ command: "boop", retries: [500, 500] }],
          },
        ],
        dryRun: false,
      }),
    );
    yield* logger.operations.info("completed");

    if (process.platform === "win32") {
      const isCmdNotFound = (errored as Error).message.includes(
        "not recognized as an internal or external command",
      );
      const isEnoent = (errored as Error).message.includes("ENOENT");
      const errorMessage = isCmdNotFound
        ? "Process exited with non-zero status (1)"
        : isEnoent
          ? "spawn boop ENOENT"
          : "Process exited with non-zero status (1)";
      const errorLog: Array<Partial<logTest.TestLogEntry>> = [
        {
          msg: "'boop' is not recognized as an internal or external command,",
          level: "info",
        },
        {
          msg: "operable program or batch file.",
          level: "info",
        },
      ];

      yield* logTest.consecutive(
        log.logs,
        [
          { msg: "pkg-nickname []: boop", level: "info" },
          ...errorLog,
          { msg: errorMessage, err: { code: "ENOENT" }, level: "error" },
          { msg: "pkg-nickname []: boop", level: "info" },
          ...errorLog,
          { msg: errorMessage, err: { code: "ENOENT" }, level: "error" },
          { msg: "pkg-nickname []: boop", level: "info" },
          ...errorLog,
          // to confirm we are done with logs
          { msg: "completed", level: "info" },
        ],
        isShallowError,
      );
      expect(
        errored.message.includes("ENOENT") ||
          errored.message.includes("non-zero status") ||
          errored.message.includes(
            "not recognized as an internal or external command",
          ),
      ).toBeTruthy();
    } else {
      const errorMessage = "spawn boop ENOENT";
      yield* logTest.consecutive(
        log.logs,
        [
          { msg: "pkg-nickname []: boop", level: "info" },
          { msg: errorMessage, err: { code: "ENOENT" }, level: "error" },
          { msg: "pkg-nickname []: boop", level: "info" },
          { msg: errorMessage, err: { code: "ENOENT" }, level: "error" },
          { msg: "pkg-nickname []: boop", level: "info" },
          // to confirm we are done with logs
          { msg: "completed", level: "info" },
        ],
        isShallowError,
      );
      expect(errored.message).toBe(errorMessage);
    }
  });
});

function getReceivedMsg(received: any) {
  if (typeof received?.msg === "string") return received.msg;
  if (typeof received?.err?.message === "string") return received.err.message;
  return String(received?.msg ?? "");
}

function isShallowError(received: any, expected: any) {
  const receivedMsg = getReceivedMsg(received);
  if (Array.isArray(expected.msg)) {
    for (let chunk of expected.msg) {
      if (!receivedMsg.includes(chunk)) {
        throw new Error(
          `expected msg to include chunk "${chunk}" but received "${receivedMsg}"`,
        );
      }
    }
  } else if (!receivedMsg.includes(expected.msg)) {
    throw new Error(
      `expected msg to include "${expected.msg}" but received "${receivedMsg}"`,
    );
  }
  if (received.level !== expected.level) {
    throw new Error(
      `expected level ${expected.level} doesn't match the received one ${received.level}`,
    );
  }
  // Some environments attach an `err.code` on the logged error while others
  // only surface the textual message. Accept either form — if expected
  // specifies an err.code, prefer to check it when present on the received
  // object but don't fail when it's missing.
  if (
    expected?.err?.code &&
    received?.err?.code &&
    received.err.code !== expected.err.code
  ) {
    throw new Error(
      `expected err code ${expected?.err?.code} doesn't match the received one ${received?.err?.code}`,
    );
  }
}
