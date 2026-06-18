import { confirmCommandsToRun } from "../src/index.ts";
import { describe, it } from "../../../helpers/test-scope.ts";
import { expect } from "vitest";
import * as logTest from "../../../helpers/test-logger.ts";
// @ts-expect-error has no types
import fixtures from "fixturez";

import { logger } from "../../covector/src/logger.ts";
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

describe("confirmCommandsToRun", () => {
  describe("processExecute", () => {
    describe("npm view", () => {
      it("already published", function* () {
        const log = yield* logTest.useCapturedLogger();

        const commandsToRun = yield* confirmCommandsToRun({
          logger: logger.operations,
          commands: [
            {
              ...base,
              pkg: "effection",
              manager: "npm",
              pkgFile: fillWithDefaults({ version: "0.5.0" }),
              getPublishedVersion: "npm view effection@0.5.0 version --silent",
            },
          ],
          cwd: "",
          command: "publish",
        });

        yield* logTest.consecutive(log.all, [
          {
            msg: "Checking if effection@0.5.0 is already published with: npm view effection@0.5.0 version --silent",
            level: "info",
          },
          {
            msg: "0.5.0",
            level: "info",
          },
          {
            msg: "effection@0.5.0 is already published. Skipping.",
            level: "info",
          },
        ]);
        expect(commandsToRun).toEqual([]);
      });

      it("needs publish", function* () {
        const log = yield* logTest.useCapturedLogger();

        const commandsToRun = yield* confirmCommandsToRun({
          logger: logger.operations,
          commands: [
            {
              ...base,
              pkg: "effection",
              manager: "npm",
              pkgFile: fillWithDefaults({ version: "0.5.99" }),
              getPublishedVersion: "npm view effection@0.5.0 version --silent",
            },
          ],
          cwd: "",
          command: "publish",
        });

        yield* logTest.consecutive(log.all, [
          {
            msg: "Checking if effection@0.5.99 is already published with: npm view effection@0.5.0 version --silent",
            level: "info",
          },
          {
            msg: "0.5.0",
            level: "info",
          },
        ]);
        expect(commandsToRun).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ pkg: "effection" }),
          ]),
        );
      });
    });
  });

  describe("fetchCommand", () => {
    describe("fetch npm registry", () => {
      it("already published", function* () {
        const log = yield* logTest.useCapturedLogger();

        const commandsToRun = yield* confirmCommandsToRun({
          logger: logger.operations,
          commands: [
            {
              ...base,
              pkg: "effection",
              manager: "npm",
              pkgFile: fillWithDefaults({ version: "0.5.0" }),
              getPublishedVersion: {
                use: "fetch:check",
                options: {
                  url: "https://registry.npmjs.com/${ pkg.pkg }/${ pkg.pkgFile.version }",
                },
              },
            },
          ],
          cwd: "",
          command: "publish",
        });

        yield* logTest.consecutive(log.logs, [
          {
            msg: "Checking if effection@0.5.0 is already published with built-in fetch:check",
            level: "info",
          },
          {
            msg: "effection@0.5.0 is already published. Skipping.",
            level: "info",
          },
        ]);
        expect(commandsToRun).toEqual([]);
      });

      it("needs publish", function* () {
        const log = yield* logTest.useCapturedLogger();

        const commandsToRun = yield* confirmCommandsToRun({
          logger: logger.operations,
          commands: [
            {
              ...base,
              pkg: "effection",
              manager: "npm",
              pkgFile: fillWithDefaults({ version: "0.5.99" }),
              getPublishedVersion: {
                use: "fetch:check",
                options: {
                  url: "https://registry.npmjs.com/${ pkg.pkg }/${ pkg.pkgFile.version }",
                },
              },
            },
          ],
          cwd: "",
          command: "publish",
        });

        yield* logTest.consecutive(log.logs, [
          {
            msg: "Checking if effection@0.5.99 is already published with built-in fetch:check",
            level: "info",
          },
        ]);
        expect(commandsToRun).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ pkg: "effection" }),
          ]),
        );
      });
    });

    describe("fetch cargo registry", () => {
      it("already published", function* () {
        const log = yield* logTest.useCapturedLogger();

        const commandsToRun = yield* confirmCommandsToRun({
          logger: logger.operations,
          commands: [
            {
              ...base,
              pkg: "tauri",
              manager: "cargo",
              pkgFile: fillWithDefaults({ version: "0.11.0" }),
              getPublishedVersion: {
                use: "fetch:check",
                options: {
                  url: "https://crates.io/api/v1/crates/${ pkg.pkg }/${ pkg.pkgFile.version }",
                },
              },
            },
          ],
          cwd: "",
          command: "publish",
        });

        yield* logTest.consecutive(log.logs, [
          {
            msg: "Checking if tauri@0.11.0 is already published with built-in fetch:check",
            level: "info",
          },
          {
            msg: "tauri@0.11.0 is already published. Skipping.",
            level: "info",
          },
        ]);
        expect(commandsToRun).toEqual([]);
      });

      it("needs publish", function* () {
        const log = yield* logTest.useCapturedLogger();

        const commandsToRun = yield* confirmCommandsToRun({
          logger: logger.operations,
          commands: [
            {
              ...base,
              pkg: "tauri",
              manager: "cargo",
              pkgFile: fillWithDefaults({ version: "0.12.0" }),
              getPublishedVersion: {
                use: "fetch:check",
                options: {
                  url: "https://crates.io/api/v1/crates/${ pkg.pkg }/${ pkg.pkgFile.version }",
                },
              },
            },
          ],
          cwd: "",
          command: "publish",
        });

        yield* logTest.consecutive(log.logs, [
          {
            msg: "Checking if tauri@0.12.0 is already published with built-in fetch:check",
            level: "info",
          },
        ]);
        expect(commandsToRun).toEqual(
          expect.arrayContaining([expect.objectContaining({ pkg: "tauri" })]),
        );
      });
    });
  });
});
