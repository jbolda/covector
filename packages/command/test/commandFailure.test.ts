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
      logTest.isShallowError,
    );
    expect(
      errored.message.includes("ENOENT") ||
        errored.message.includes("non-zero status"),
    ).toBeTruthy();
  });
});
