import { confirmCommandsToRun } from "../src";
import { describe, it } from "../../../helpers/test-scope.ts";
import { expect } from "vitest";
import pino from "pino";
import * as pinoTest from "pino-test";
import fixtures from "fixturez";
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

describe("confirmCommandsToRun", () => {
  describe("processExecute", () => {
    describe("npm view", () => {
      it("already published", function* () {
        const stream = pinoTest.sink();
        const logger = pino(stream);

        const commandsToRun = yield confirmCommandsToRun({
          logger,
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

        yield pinoTest.consecutive(stream, [
          {
            msg: "Checking if effection@0.5.0 is already published with: npm view effection@0.5.0 version --silent",
            level: 30,
          },
          {
            msg: "0.5.0",
            level: 30,
          },
          {
            msg: "effection@0.5.0 is already published. Skipping.",
            level: 30,
          },
        ]);
        expect(commandsToRun).toEqual([]);
      });

      it("needs publish", function* () {
        const stream = pinoTest.sink();
        const logger = pino(stream);

        const commandsToRun = yield confirmCommandsToRun({
          logger,
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

        yield pinoTest.consecutive(stream, [
          {
            msg: "Checking if effection@0.5.99 is already published with: npm view effection@0.5.0 version --silent",
            level: 30,
          },
          {
            msg: "0.5.0",
            level: 30,
          },
        ]);
        expect(commandsToRun).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ pkg: "effection" }),
          ])
        );
      });
    });

    if (process.platform !== "win32") {
      describe("cargo through curl", () => {
        it("already published", function* () {
          const stream = pinoTest.sink();
          const logger = pino(stream);

          const commandsToRun = yield confirmCommandsToRun({
            logger,
            commands: [
              {
                ...base,
                pkg: "tauri",
                manager: "cargo",
                pkgFile: fillWithDefaults({ version: "0.11.0" }),
                getPublishedVersion:
                  'curl -sH "User-Agent: covector-ci-test" https://crates.io/api/v1/crates/tauri/0.11.0 | if grep -q errors; then echo not found; else echo 0.11.0; fi;',
              },
            ],
            cwd: "",
            command: "publish",
          });

          yield pinoTest.consecutive(stream, [
            {
              msg: 'Checking if tauri@0.11.0 is already published with: curl -sH "User-Agent: covector-ci-test" https://crates.io/api/v1/crates/tauri/0.11.0 | if grep -q errors; then echo not found; else echo 0.11.0; fi;',
              level: 30,
            },
            {
              msg: "0.11.0",
              level: 30,
            },
            {
              msg: "tauri@0.11.0 is already published. Skipping.",
              level: 30,
            },
          ]);
          expect(commandsToRun).toEqual([]);
        });

        it("needs publish", function* () {
          const stream = pinoTest.sink();
          const logger = pino(stream);

          const commandsToRun = yield confirmCommandsToRun({
            logger,
            commands: [
              {
                ...base,
                pkg: "tauri",
                manager: "cargo",
                pkgFile: fillWithDefaults({ version: "0.12.0" }),
                getPublishedVersion:
                  'curl -sH "User-Agent: covector-ci-test" https://crates.io/api/v1/crates/tauri/0.12.0 | if grep -q errors; then echo not found; else echo 0.12.0; fi;',
              },
            ],
            cwd: "",
            command: "publish",
          });

          yield pinoTest.consecutive(stream, [
            {
              msg: 'Checking if tauri@0.12.0 is already published with: curl -sH "User-Agent: covector-ci-test" https://crates.io/api/v1/crates/tauri/0.12.0 | if grep -q errors; then echo not found; else echo 0.12.0; fi;',
              level: 30,
            },
            {
              msg: "not found",
              level: 30,
            },
          ]);
          expect(commandsToRun).toEqual(
            expect.arrayContaining([expect.objectContaining({ pkg: "tauri" })])
          );
        });
      });
    }
  });

  describe("fetchCommand", () => {
    describe("fetch npm registry", () => {
      it("already published", function* () {
        const stream = pinoTest.sink();
        const logger = pino(stream);

        const commandsToRun = yield confirmCommandsToRun({
          logger,
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

        yield pinoTest.consecutive(stream, [
          {
            msg: "Checking if effection@0.5.0 is already published with built-in fetch:check",
            level: 30,
          },
          {
            msg: "effection@0.5.0 is already published. Skipping.",
            level: 30,
          },
        ]);
        expect(commandsToRun).toEqual([]);
      });

      it("needs publish", function* () {
        const stream = pinoTest.sink();
        const logger = pino(stream);

        const commandsToRun = yield confirmCommandsToRun({
          logger,
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

        yield pinoTest.consecutive(stream, [
          {
            msg: "Checking if effection@0.5.99 is already published with built-in fetch:check",
            level: 30,
          },
        ]);
        expect(commandsToRun).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ pkg: "effection" }),
          ])
        );
      });
    });

    describe("fetch cargo registry", () => {
      it("already published", function* () {
        const stream = pinoTest.sink();
        const logger = pino(stream);

        const commandsToRun = yield confirmCommandsToRun({
          logger,
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

        yield pinoTest.consecutive(stream, [
          {
            msg: "Checking if tauri@0.11.0 is already published with built-in fetch:check",
            level: 30,
          },
          {
            msg: "tauri@0.11.0 is already published. Skipping.",
            level: 30,
          },
        ]);
        expect(commandsToRun).toEqual([]);
      });

      it("needs publish", function* () {
        const stream = pinoTest.sink();
        const logger = pino(stream);

        const commandsToRun = yield confirmCommandsToRun({
          logger,
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

        yield pinoTest.consecutive(stream, [
          {
            msg: "Checking if tauri@0.12.0 is already published with built-in fetch:check",
            level: 30,
          },
        ]);
        expect(commandsToRun).toEqual(
          expect.arrayContaining([expect.objectContaining({ pkg: "tauri" })])
        );
      });
    });
  });
});
