import { attemptCommands } from "../src";
import { describe, it } from "../../../helpers/test-scope.ts";
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

describe("attemptCommand", () => {
  it("invokes a function", function* () {
    const stream = pinoTest.sink();
    const logger = pino(stream);
    const commandLogger = pino(stream);

    yield attemptCommands({
      logger,
      commands: [
        {
          ...base,
          pkg: "pkg-nickname",
          pkgFile: fillWithDefaults({ version: "0.5.6" }),
          command: async () => commandLogger.info("boop"),
        },
      ],
      command: "publish",
      cwd: "",
      dryRun: false,
    });

    yield pinoTest.consecutive(stream, [{ msg: "boop", level: 30 }]);
  });

  it("invokes an array of functions", function* () {
    const stream = pinoTest.sink();
    const logger = pino(stream);
    const commandLogger = pino(stream);

    yield attemptCommands({
      logger,
      commands: [
        {
          ...base,
          pkg: "pkg-nickname",
          manager: "none",
          command: [
            async () => commandLogger.info("boop"),
            async () => commandLogger.info("booop"),
            async () => commandLogger.info("boooop"),
            async () => commandLogger.info("booooop"),
          ],
        },
      ],
      command: "publish",
      cwd: "",
      dryRun: false,
    });

    yield pinoTest.consecutive(stream, [
      { msg: "boop", level: 30 },
      { msg: "booop", level: 30 },
      { msg: "boooop", level: 30 },
      { msg: "booooop", level: 30 },
    ]);
  });

  it("invokes a function using package values", function* () {
    const stream = pinoTest.sink();
    const logger = pino(stream);
    const commandLogger = pino(stream);

    yield attemptCommands({
      logger,
      commands: [
        {
          ...base,
          pkg: "pkg-nickname",
          pkgFile: fillWithDefaults({ version: "0.5.6" }),
          command: async (pkg: any) =>
            commandLogger.info(`boop ${pkg.pkg}@${pkg.pkgFile.version}`),
        },
      ],
      command: "publish",
      cwd: "",
      dryRun: false,
    });

    yield pinoTest.consecutive(stream, [
      { msg: "boop pkg-nickname@0.5.6", level: 30 },
    ]);
  });

  it("invokes an array of functions using package values", function* () {
    const stream = pinoTest.sink();
    const logger = pino(stream);
    const commandLogger = pino(stream);

    yield attemptCommands({
      logger,
      commands: [
        {
          ...base,
          pkg: "pkg-nickname",
          pkgFile: fillWithDefaults({ version: "0.5.6" }),
          manager: "none",
          command: [
            async (pkg: any) =>
              commandLogger.info(`boop ${pkg.pkg}@${pkg.pkgFile.version}`),
            async (pkg: any) =>
              commandLogger.info(`booop ${pkg.pkg}@${pkg.pkgFile.version}`),
            async (pkg: any) =>
              commandLogger.info(`boooop ${pkg.pkg}@${pkg.pkgFile.version}`),
            async (pkg: any) =>
              commandLogger.info(`booooop ${pkg.pkg}@${pkg.pkgFile.version}`),
          ],
        },
      ],
      command: "publish",
      cwd: "",
      dryRun: false,
    });

    yield pinoTest.consecutive(stream, [
      { msg: "boop pkg-nickname@0.5.6", level: 30 },
      { msg: "booop pkg-nickname@0.5.6", level: 30 },
      { msg: "boooop pkg-nickname@0.5.6", level: 30 },
      { msg: "booooop pkg-nickname@0.5.6", level: 30 },
    ]);
  });
});
