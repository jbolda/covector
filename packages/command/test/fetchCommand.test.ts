import { attemptCommands } from "../src";
import { captureError, describe, it } from "../../../helpers/test-scope.ts";
import { assert, expect } from "vitest";
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

const fillWithDefaults = ({ version }: { version: string }) => {
  const [versionMajor, versionMinor, versionPatch] = version
    .split(".")
    .map((v) => parseInt(v));
  return {
    version,
    currentVersion: version,
    versionMajor,
    versionMinor,
    versionPatch,
    pkg: { name: "none" },
    deps: {},
  };
};

describe("fetchCommand", () => {
  describe("fetch npm registry", () => {
    it("success", function* () {
      const stream = pinoTest.sink();
      const logger = pino(stream);

      yield* attemptCommands({
        logger,
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
      logger.info("completed");

      yield* call(() =>
        pinoTest.consecutive(stream, [{ msg: "completed", level: 30 }])
      );
    });

    it("failure throws", function* () {
      const stream = pinoTest.sink();
      const logger = pino(stream);

      const errored = yield* captureError(
        attemptCommands({
          logger,
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
        })
      );

      expect(errored.message).toBe(
        'effection request to https://registry.npmjs.com/effection/0.5.32 returned code 404 Not Found: "version not found: 0.5.32"'
      );
    });

    it("failure retries then throws", function* () {
      const stream = pinoTest.sink();
      const logger = pino(stream);

      const errored = yield* captureError(
        attemptCommands({
          logger,
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
        })
      );

      const errorMessage =
        'effection request to https://registry.npmjs.com/effection/0.5.32 returned code 404 Not Found: "version not found: 0.5.32"';
      // first two attempts log error then retry
      yield* call(() =>
        pinoTest.consecutive(
          stream,
          [
            { msg: errorMessage, level: 50 },
            // { msg: errorMessage, level: 50 },
          ],
          (actual, expected) => {
            expect(actual).toMatchObject(expected as object);
          }
        )
      );
      // final attempt throws
      expect(errored.message).toEqual(errorMessage);
    });
  });

  describe("fetch cargo registry", () => {
    it("success", function* () {
      const stream = pinoTest.sink();
      const logger = pino(stream);

      yield* attemptCommands({
        logger,
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
      logger.info("completed");

      yield* call(() =>
        pinoTest.consecutive(stream, [{ msg: "completed", level: 30 }])
      );
    });

    it("failure throws", function* () {
      const stream = pinoTest.sink();
      const logger = pino(stream);

      const errored = yield* captureError(
        attemptCommands({
          logger,
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
        })
      );

      expect(errored.message).toEqual(
        `tauri request to https://crates.io/api/v1/crates/tauri/0.12.0 returned code 404 Not Found: {"errors":[{"detail":"crate \`tauri\` does not have a version \`0.12.0\`"}]}`
      );
    });

    it("failure retries then throws", function* () {
      const stream = pinoTest.sink();
      const logger = pino(stream);

      const errored = yield* captureError(
        attemptCommands({
          logger,
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
        })
      );

      const errorMessage = `tauri request to https://crates.io/api/v1/crates/tauri/0.12.0 returned code 404 Not Found: {"errors":[{"detail":"crate \`tauri\` does not have a version \`0.12.0\`"}]}`;
      // first two attempts log error then retry
      yield* call(() =>
        pinoTest.consecutive(
          stream,
          [
            { msg: errorMessage, level: 50 },
            { msg: errorMessage, level: 50 },
          ],
          (actual, expected) => {
            expect(actual).toMatchObject(expected as object);
          }
        )
      );
      // final attempt throws
      expect(errored.message).toEqual(errorMessage);
    });
  });
});
