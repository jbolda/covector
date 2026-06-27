import { attemptCommands } from "../src/index.ts";
import { captureError, describe, it } from "@effectionx/vitest";
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

const fillWithDefaults = ({ version }: { version: string }) => {
  const [versionMajor, versionMinor, versionPatch] = version
    .split(".")
    .map((v) => parseInt(v));
  const name = "none";
  return {
    name,
    version,
    currentVersion: version,
    versionMajor,
    versionMinor,
    versionPatch,
    pkg: { name },
    deps: {},
  };
};

describe("fetchCommand", () => {
  describe("fetch npm registry", () => {
    it("success", function* () {
      const log = yield* logTest.useCapturedLogger();

      yield* attemptCommands({
        logger: logger.operations,
        commands: [
          {
            ...base,
            pkg: "effection",
            pkgFile: fillWithDefaults({ version: "0.5.0" }),
            command: [
              {
                use: "fetch:check",
                options: {
                  url: "https://registry.npmjs.com/${ pkg.pkg }/${ pkg.pkgFile.version }",
                },
              },
            ],
          },
        ],
        command: "publish",
        cwd: "",
        dryRun: false,
      });
      // it hangs with no logs
      yield* logger.operations.info("completed");

      yield* logTest.consecutive(log.all, [
        { msg: "completed", level: "info" },
      ]);
    });

    it("failure throws", function* () {
      const log = yield* logTest.useCapturedLogger();

      const errored = yield* captureError(
        attemptCommands({
          logger: logger.operations,
          commands: [
            {
              ...base,
              pkg: "effection",
              pkgFile: fillWithDefaults({ version: "0.5.32" }),
              command: [
                {
                  use: "fetch:check",
                  options: {
                    url: "https://registry.npmjs.com/${ pkg.pkg }/${ pkg.pkgFile.version }",
                  },
                },
              ],
            },
          ],
          command: "publish",
          cwd: "",
          dryRun: false,
        }),
      );

      expect(errored.message).toBe(
        'effection request to https://registry.npmjs.com/effection/0.5.32 returned code 404 Not Found: "version not found: 0.5.32"',
      );
    });

    it("failure retries then throws", function* () {
      const log = yield* logTest.useCapturedLogger();

      const errored = yield* captureError(
        attemptCommands({
          logger: logger.operations,
          commands: [
            {
              ...base,
              pkg: "effection",
              pkgFile: fillWithDefaults({ version: "0.5.32" }),
              command: [
                {
                  use: "fetch:check",
                  options: {
                    url: "https://registry.npmjs.com/${ pkg.pkg }/${ pkg.pkgFile.version }",
                  },
                  retries: [500, 500],
                },
              ],
            },
          ],
          command: "publish",
          cwd: "",
          dryRun: false,
        }),
      );

      const errorMessage =
        'effection request to https://registry.npmjs.com/effection/0.5.32 returned code 404 Not Found: "version not found: 0.5.32"';
      // first two attempts log error then retry
      yield* logTest.consecutive(
        log.all,
        [
          { msg: errorMessage, level: "error" },
          { msg: errorMessage, level: "error" },
        ],
        (actual, expected) => {
          expect((actual as { level: string }).level).toBe(expected.level);
          expect((actual as { msg: string }).msg).toContain(
            expected.msg as string,
          );
        },
      );
      // final attempt throws
      expect(errored.message).toEqual(errorMessage);
    });
  });

  describe("fetch cargo registry", () => {
    it("success", function* () {
      const log = yield* logTest.useCapturedLogger();

      yield* attemptCommands({
        logger: logger.operations,
        commands: [
          {
            ...base,
            pkg: "tauri",
            pkgFile: fillWithDefaults({ version: "0.11.0" }),
            command: [
              {
                use: "fetch:check",
                options: {
                  url: "https://crates.io/api/v1/crates/${ pkg.pkg }/${ pkg.pkgFile.version }",
                },
              },
            ],
          },
        ],
        command: "publish",
        cwd: "",
        dryRun: false,
      });
      // it hangs with no logs
      yield* logger.operations.info("completed");

      yield* logTest.consecutive(log.all, [
        { msg: "completed", level: "info" },
      ]);
    });

    it("failure throws", function* () {
      const log = yield* logTest.useCapturedLogger();

      const errored = yield* captureError(
        attemptCommands({
          logger: logger.operations,
          commands: [
            {
              ...base,
              pkg: "tauri",
              pkgFile: fillWithDefaults({ version: "0.12.0" }),
              command: [
                {
                  use: "fetch:check",
                  options: {
                    url: "https://crates.io/api/v1/crates/${ pkg.pkg }/${ pkg.pkgFile.version }",
                  },
                },
              ],
            },
          ],
          command: "publish",
          cwd: "",
          dryRun: false,
        }),
      );

      expect(errored.message).toEqual(
        `tauri request to https://crates.io/api/v1/crates/tauri/0.12.0 returned code 404 Not Found: {"errors":[{"detail":"crate \`tauri\` does not have a version \`0.12.0\`"}]}`,
      );
    });

    it("failure retries then throws", function* () {
      const log = yield* logTest.useCapturedLogger();

      const errored = yield* captureError(
        attemptCommands({
          logger: logger.operations,
          commands: [
            {
              ...base,
              pkg: "tauri",
              pkgFile: fillWithDefaults({ version: "0.12.0" }),
              command: [
                {
                  use: "fetch:check",
                  options: {
                    url: "https://crates.io/api/v1/crates/${ pkg.pkg }/${ pkg.pkgFile.version }",
                  },
                  retries: [500, 500],
                },
              ],
            },
          ],
          command: "publish",
          cwd: "",
          dryRun: false,
        }),
      );

      const errorMessage = `tauri request to https://crates.io/api/v1/crates/tauri/0.12.0 returned code 404 Not Found: {"errors":[{"detail":"crate \`tauri\` does not have a version \`0.12.0\`"}]}`;
      // first two attempts log error then retry
      yield* logTest.consecutive(
        log.all,
        [
          { msg: errorMessage, level: "error" },
          { msg: errorMessage, level: "error" },
        ],
        (actual, expected) => {
          expect((actual as { level: string }).level).toBe(expected.level);
          expect((actual as { msg: string }).msg).toContain(
            expected.msg as string,
          );
        },
      );
      // final attempt throws
      expect(errored.message).toEqual(errorMessage);
    });
  });
});
