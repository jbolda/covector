import { attemptCommands } from "../src/index.js";
import { describe, it } from "../../../helpers/test-scope.ts";
import * as logTest from "../../../helpers/test-logger.ts";
// @ts-expect-error has no types
import fixtures from "fixturez";
import { sleep, useScope } from "effection";
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

describe("attemptCommand", () => {
  it("invokes a function", function* () {
    const log = yield* logTest.createCapturedLogger();
    yield* logger.around(log.around, { at: "min" });
    const scope = yield* useScope();

    yield* attemptCommands({
      logger: logger.operations,
      commands: [
        {
          ...base,
          pkg: "pkg-nickname",
          pkgFile: fillWithDefaults({ version: "0.5.6" }),
          command: async () =>
            scope.run(function* () {
              yield* logger.operations.info("boop");
              yield* sleep(1000);
            }),
        },
      ],
      command: "publish",
      cwd: "",
      dryRun: false,
    });

    yield* logTest.consecutive(log.sink.logs, [{ msg: "boop", level: "info" }]);
  });

  it("invokes an array of functions", function* () {
    const log = yield* logTest.createCapturedLogger();
    yield* logger.around(log.around, { at: "min" });
    const scope = yield* useScope();

    yield* attemptCommands({
      logger: logger.operations,
      commands: [
        {
          ...base,
          pkg: "pkg-nickname",
          manager: "none",
          command: [
            async () =>
              scope.run(function* () {
                yield* logger.operations.info("boop");
              }),
            async () =>
              scope.run(function* () {
                yield* logger.operations.info("booop");
              }),
            async () =>
              scope.run(function* () {
                yield* logger.operations.info("boooop");
              }),
            async () =>
              scope.run(function* () {
                yield* logger.operations.info("booooop");
              }),
          ],
        },
      ],
      command: "publish",
      cwd: "",
      dryRun: false,
    });

    yield* logTest.consecutive(log.sink.logs, [
        { msg: "boop", level: "info" },
        { msg: "booop", level: "info" },
        { msg: "boooop", level: "info" },
        { msg: "booooop", level: "info" },
      ]);
  });

  it("invokes a function using package values", function* () {
    const log = yield* logTest.createCapturedLogger();
    yield* logger.around(log.around, { at: "min" });
    const scope = yield* useScope();

    yield* attemptCommands({
      logger: logger.operations,
      commands: [
        {
          ...base,
          pkg: "pkg-nickname",
          pkgFile: fillWithDefaults({ version: "0.5.6" }),
          command: async (pkg: any) =>
            scope.run(function* () {
              yield* logger.operations.info(
                `boop ${pkg.pkg}@${pkg.pkgFile.version}`,
              );
            }),
        },
      ],
      command: "publish",
      cwd: "",
      dryRun: false,
    });

    yield* logTest.consecutive(log.sink.logs, [
        { msg: "boop pkg-nickname@0.5.6", level: "info" },
      ]);
  });

  it("invokes an array of functions using package values", function* () {
    const log = yield* logTest.createCapturedLogger();
    yield* logger.around(log.around, { at: "min" });
    const scope = yield* useScope();

    yield* attemptCommands({
      logger: logger.operations,
      commands: [
        {
          ...base,
          pkg: "pkg-nickname",
          pkgFile: fillWithDefaults({ version: "0.5.6" }),
          manager: "none",
          command: [
            async (pkg: any) =>
              scope.run(function* () {
                yield* logger.operations.info(
                  `boop ${pkg.pkg}@${pkg.pkgFile.version}`,
                );
              }),
            async (pkg: any) =>
              scope.run(function* () {
                yield* logger.operations.info(
                  `booop ${pkg.pkg}@${pkg.pkgFile.version}`,
                );
              }),
            async (pkg: any) =>
              scope.run(function* () {
                yield* logger.operations.info(
                  `boooop ${pkg.pkg}@${pkg.pkgFile.version}`,
                );
              }),
            async (pkg: any) =>
              scope.run(function* () {
                yield* logger.operations.info(
                  `booooop ${pkg.pkg}@${pkg.pkgFile.version}`,
                );
              }),
          ],
        },
      ],
      command: "publish",
      cwd: "",
      dryRun: false,
    });

    yield* logTest.consecutive(log.sink.logs, [
        { msg: "boop pkg-nickname@0.5.6", level: "info" },
        { msg: "booop pkg-nickname@0.5.6", level: "info" },
        { msg: "boooop pkg-nickname@0.5.6", level: "info" },
        { msg: "booooop pkg-nickname@0.5.6", level: "info" },
      ]);
  });
});
