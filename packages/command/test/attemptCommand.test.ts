import { attemptCommands } from "../src";
import { describe, it } from "../../../helpers/test-scope.ts";
import * as logTest from "../../../helpers/test-logger.ts";
import fixtures from "fixturez";
import { call, run } from "effection";
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

describe("attemptCommand", () => {
  it("invokes a function", function* () {
    const logs = logTest.sink();
    const logger = logTest.createCapturedLogger(logs);
    const commandLogger = logTest.createCapturedLogger(logs);

    yield* attemptCommands({
      logger,
      commands: [
        {
          ...base,
          pkg: "pkg-nickname",
          pkgFile: fillWithDefaults({ version: "0.5.6" }),
          command: async () =>
            run(function* () {
              yield* commandLogger.info("boop");
            }),
        },
      ],
      command: "publish",
      cwd: "",
      dryRun: false,
    });

    yield* call(() =>
      logTest.consecutive(logs, [{ msg: "boop", level: 30 }]),
    );
  });

  it("invokes an array of functions", function* () {
    const logs = logTest.sink();
    const logger = logTest.createCapturedLogger(logs);
    const commandLogger = logTest.createCapturedLogger(logs);

    yield* attemptCommands({
      logger,
      commands: [
        {
          ...base,
          pkg: "pkg-nickname",
          manager: "none",
          command: [
            async () =>
              run(function* () {
                yield* commandLogger.info("boop");
              }),
            async () =>
              run(function* () {
                yield* commandLogger.info("booop");
              }),
            async () =>
              run(function* () {
                yield* commandLogger.info("boooop");
              }),
            async () =>
              run(function* () {
                yield* commandLogger.info("booooop");
              }),
          ],
        },
      ],
      command: "publish",
      cwd: "",
      dryRun: false,
    });

    yield* call(() =>
      logTest.consecutive(logs, [
        { msg: "boop", level: 30 },
        { msg: "booop", level: 30 },
        { msg: "boooop", level: 30 },
        { msg: "booooop", level: 30 },
      ]),
    );
  });

  it("invokes a function using package values", function* () {
    const logs = logTest.sink();
    const logger = logTest.createCapturedLogger(logs);
    const commandLogger = logTest.createCapturedLogger(logs);

    yield* attemptCommands({
      logger,
      commands: [
        {
          ...base,
          pkg: "pkg-nickname",
          pkgFile: fillWithDefaults({ version: "0.5.6" }),
          command: async (pkg: any) =>
            run(function* () {
              yield* commandLogger.info(
                `boop ${pkg.pkg}@${pkg.pkgFile.version}`,
              );
            }),
        },
      ],
      command: "publish",
      cwd: "",
      dryRun: false,
    });

    yield* call(() =>
      logTest.consecutive(logs, [
        { msg: "boop pkg-nickname@0.5.6", level: 30 },
      ]),
    );
  });

  it("invokes an array of functions using package values", function* () {
    const logs = logTest.sink();
    const logger = logTest.createCapturedLogger(logs);
    const commandLogger = logTest.createCapturedLogger(logs);

    yield* attemptCommands({
      logger,
      commands: [
        {
          ...base,
          pkg: "pkg-nickname",
          pkgFile: fillWithDefaults({ version: "0.5.6" }),
          manager: "none",
          command: [
            async (pkg: any) =>
              run(function* () {
                yield* commandLogger.info(
                  `boop ${pkg.pkg}@${pkg.pkgFile.version}`,
                );
              }),
            async (pkg: any) =>
              run(function* () {
                yield* commandLogger.info(
                  `booop ${pkg.pkg}@${pkg.pkgFile.version}`,
                );
              }),
            async (pkg: any) =>
              run(function* () {
                yield* commandLogger.info(
                  `boooop ${pkg.pkg}@${pkg.pkgFile.version}`,
                );
              }),
            async (pkg: any) =>
              run(function* () {
                yield* commandLogger.info(
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

    yield* call(() =>
      logTest.consecutive(logs, [
        { msg: "boop pkg-nickname@0.5.6", level: 30 },
        { msg: "booop pkg-nickname@0.5.6", level: 30 },
        { msg: "boooop pkg-nickname@0.5.6", level: 30 },
        { msg: "booooop pkg-nickname@0.5.6", level: 30 },
      ]),
    );
  });
});
