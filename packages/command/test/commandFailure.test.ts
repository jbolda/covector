import { attemptCommands } from "../src";
import { captureError, describe, it } from "../../../helpers/test-scope.ts";
import { expect } from "vitest";
import pino from "pino";
import * as pinoTest from "pino-test";
import fixtures from "fixturez";
import { call } from "effection";
const f = fixtures(__dirname);

const base = {
  errorOnVersionRange: null,
  precommand: null,
  command: null,
  postcommand: null,
};

describe("attemptCommand fails", () => {
  it("fails a function", function* () {
    const stream = pinoTest.sink();
    const logger = pino(stream);

    const errored = yield* captureError(
      attemptCommands({
        logger,
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
      })
    );

    expect(errored.message).toBe(
      "Command failed with ENOENT: boop\nspawn boop ENOENT"
    );
  });

  it("retries a failed function", function* () {
    const stream = pinoTest.sink();
    const logger = pino(stream);

    const errored = yield* captureError(
      attemptCommands({
        logger,
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
      })
    );
    logger.info("completed");

    const errorMessage = "Command failed with ENOENT: boop\nspawn boop ENOENT";
    if (process.platform === "win32") {
      const errorLog =
        "'boop' is not recognized as an internal or external command,\r\n" +
        "operable program or batch file.";

      yield* call(() =>
        pinoTest.consecutive(
          stream,
          [
            { msg: "pkg-nickname []: boop", level: 30 },
            { msg: errorLog, level: 30 },
            { msg: errorMessage, err: { code: "ENOENT" }, level: 50 },
            { msg: "pkg-nickname []: boop", level: 30 },
            { msg: errorLog, level: 30 },
            { msg: errorMessage, err: { code: "ENOENT" }, level: 50 },
            { msg: "pkg-nickname []: boop", level: 30 },
            { msg: errorLog, level: 30 },
            // to confirm we are done with logs
            { msg: "completed", level: 30 },
          ],
          isShallowError
        )
      );
      expect(errored.message).toBe(errorMessage);
    } else {
      yield* call(() =>
        pinoTest.consecutive(
          stream,
          [
            { msg: "pkg-nickname []: boop", level: 30 },
            { msg: errorMessage, err: { code: "ENOENT" }, level: 50 },
            { msg: "pkg-nickname []: boop", level: 30 },
            { msg: errorMessage, err: { code: "ENOENT" }, level: 50 },
            { msg: "pkg-nickname []: boop", level: 30 },
            // to confirm we are done with logs
            { msg: "completed", level: 30 },
          ],
          isShallowError
        )
      );
      expect(errored.message).toBe(errorMessage);
    }
  });
});

function isShallowError(received, expected) {
  if (received.msg !== expected.msg) {
    throw new Error(
      `expected msg "${expected.msg}" doesn't match the received one "${received.msg}"`
    );
  }
  if (received.level !== expected.level) {
    throw new Error(
      `expected level ${expected.level} doesn't match the received one ${received.level}`
    );
  }
  if (received?.err?.code !== expected?.err?.code) {
    throw new Error(
      `expected err code ${expected?.err?.code} doesn't match the received one ${received?.err?.code}`
    );
  }
}
