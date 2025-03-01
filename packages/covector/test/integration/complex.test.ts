import { covector } from "../../src";
import { loadFile } from "@covector/files";
import { captureError, describe, it } from "../../../../helpers/test-scope.ts";
import { expect } from "vitest";
import { checksWithObject } from "../helpers.ts";
import pino from "pino";
import * as pinoTest from "pino-test";
import path from "path";
import * as fs from "fs";
import fixtures from "fixturez";
import { call } from "effection";
const f = fixtures(__dirname);

describe("integration test for complex commands", () => {
  describe("prod", () => {
    it("runs version", function* () {
      const stream = pinoTest.sink();
      const logger = pino(stream);
      const fullIntegration = f.copy("integration.js-with-complex-commands");
      const covectored = yield* covector({
        logger,
        command: "version",
        cwd: fullIntegration,
      });
      if (typeof covectored !== "object")
        throw new Error("We are expecting an object here.");

      // no change files so not much happens here
      logger.info("completed");
      yield* call(() =>
        pinoTest.consecutive(
          stream,
          [
            {
              msg: "completed",
              level: 30,
            },
          ],
          checksWithObject()
        )
      );
      expect(covectored).toMatchSnapshot();

      const changelogTauriCore = yield* captureError(
        loadFile(path.join("/tauri/", "CHANGELOG.md"), fullIntegration)
      );
      expect(changelogTauriCore.message).toContain(
        "ENOENT: no such file or directory"
      );

      const changelogTaurijs = yield* captureError(
        loadFile(path.join("/cli/tauri.js/", "CHANGELOG.md"), fullIntegration)
      );
      expect(changelogTaurijs.message).toContain(
        "ENOENT: no such file or directory"
      );
    });

    it("runs publish", function* () {
      const stream = pinoTest.sink();
      const logger = pino(stream);
      const fullIntegration = f.copy("integration.js-with-complex-commands");
      const covectored = yield* covector({
        logger,
        command: "publish",
        cwd: fullIntegration,
      });

      logger.info("completed");
      yield* call(() =>
        pinoTest.consecutive(
          stream,
          [
            {
              command: "publish",
              msg: "package-one [publish]: echo publish",
              level: 30,
            },
            {
              command: "publish",
              msg: "publish",
              level: 30,
            },
            {
              command: "publish",
              msg: "package-two [publish]: echo publish",
              level: 30,
            },
            {
              command: "publish",
              msg: "publish",
              level: 30,
            },
            {
              msg: "completed",
              level: 30,
            },
          ],
          checksWithObject()
        )
      );
      expect(covectored).toMatchSnapshot();
    });

    it("runs test", function* () {
      const stream = pinoTest.sink();
      const logger = pino(stream);
      const fullIntegration = f.copy("integration.js-with-complex-commands");
      const covectored = yield* covector({
        logger,
        command: "test",
        cwd: fullIntegration,
      });

      logger.info("completed");
      yield* call(() =>
        pinoTest.consecutive(
          stream,
          [
            {
              command: "arbitrary",
              msg: "package-one [test]: npm run build",
              level: 30,
            },
            {
              command: "arbitrary",
              msg: "",
              level: 30,
            },
            {
              command: "arbitrary",
              msg: "> package-one@2.3.1 build",
              level: 30,
            },
            {
              command: "arbitrary",
              msg: "> npm info tauri@0.8.0 description",
              level: 30,
            },
            {
              command: "arbitrary",
              msg: "",
              level: 30,
            },
            {
              command: "arbitrary",
              msg: "Multi-binding collection of libraries and templates for building Tauri apps",
              level: 30,
            },
            {
              command: "arbitrary",
              msg: "package-one [test]: npm test",
              level: 30,
            },
            {
              command: "arbitrary",
              msg: "",
              level: 30,
            },
            {
              command: "arbitrary",
              msg: "> package-one@2.3.1 test",
              level: 30,
            },
            {
              command: "arbitrary",
              msg: "> npm info covector@0.1.0 license",
              level: 30,
            },
            {
              command: "arbitrary",
              msg: "",
              level: 30,
            },
            {
              command: "arbitrary",
              msg: "Apache-2.0",
              level: 30,
            },
            {
              command: "arbitrary",
              msg: "package-one [test]: echo boop",
              level: 30,
            },
            {
              command: "arbitrary",
              msg: "boop",
              level: 30,
            },
            {
              command: "arbitrary",
              msg: "package-two [test]: npm run build",
              level: 30,
            },
            {
              command: "arbitrary",
              msg: "",
              level: 30,
            },
            {
              command: "arbitrary",
              msg: "> package-two@1.9.0 build",
              level: 30,
            },
            {
              command: "arbitrary",
              msg: "> echo this command is not piped, it is run from scripts for pk2",
              level: 30,
            },
            {
              command: "arbitrary",
              msg: "",
              level: 30,
            },
            {
              command: "arbitrary",
              msg: "this command is not piped, it is run from scripts for pk2",
              level: 30,
            },
            {
              command: "arbitrary",
              msg: "package-two [test]: npm test",
              level: 30,
            },
            {
              command: "arbitrary",
              msg: "",
              level: 30,
            },
            {
              command: "arbitrary",
              msg: "> package-two@1.9.0 test",
              level: 30,
            },
            {
              command: "arbitrary",
              msg: "> echo this command is not piped, it is run from the test script",
              level: 30,
            },
            {
              command: "arbitrary",
              msg: "",
              level: 30,
            },
            {
              command: "arbitrary",
              msg: "this command is not piped, it is run from the test script",
              level: 30,
            },
            {
              command: "arbitrary",
              msg: "package-two [test]: echo boop",
              level: 30,
            },
            {
              command: "arbitrary",
              msg: "boop",
              level: 30,
            },
            {
              msg: "completed",
              level: 30,
            },
          ],
          checksWithObject()
        )
      );
      expect(covectored).toMatchSnapshot();
    });

    it("runs build", function* () {
      const stream = pinoTest.sink();
      const logger = pino(stream);
      const fullIntegration = f.copy("integration.js-with-complex-commands");
      const covectored = yield* covector({
        logger,
        command: "build",
        cwd: fullIntegration,
      });

      logger.info("completed");
      yield* call(() =>
        pinoTest.consecutive(
          stream,
          [
            {
              command: "arbitrary",
              msg: "package-one [build]: npm run build",
              level: 30,
            },
            {
              command: "arbitrary",
              msg: "",
              level: 30,
            },
            {
              command: "arbitrary",
              msg: "> package-one@2.3.1 build",
              level: 30,
            },
            {
              command: "arbitrary",
              msg: "> npm info tauri@0.8.0 description",
              level: 30,
            },
            {
              command: "arbitrary",
              msg: "",
              level: 30,
            },
            {
              command: "arbitrary",
              msg: "Multi-binding collection of libraries and templates for building Tauri apps",
              level: 30,
            },
            {
              command: "arbitrary",
              msg: "package-two [build]: npm run build",
              level: 30,
            },
            {
              command: "arbitrary",
              msg: "",
              level: 30,
            },
            {
              command: "arbitrary",
              msg: "> package-two@1.9.0 build",
              level: 30,
            },
            {
              command: "arbitrary",
              msg: "> echo this command is not piped, it is run from scripts for pk2",
              level: 30,
            },
            {
              command: "arbitrary",
              msg: "",
              level: 30,
            },
            {
              command: "arbitrary",
              msg: "this command is not piped, it is run from scripts for pk2",
              level: 30,
            },
            {
              msg: "completed",
              level: 30,
            },
          ],
          checksWithObject()
        )
      );
      expect(covectored).toMatchSnapshot();
    });
  });

  describe("dry run", () => {
    it("runs version", function* () {
      const stream = pinoTest.sink();
      const logger = pino(stream);
      const fullIntegration = f.copy("integration.js-with-complex-commands");
      const covectored = yield* covector({
        logger,
        command: "version",
        cwd: fullIntegration,
        dryRun: true,
      });
      if (typeof covectored !== "object")
        throw new Error("We are expecting an object here.");

      logger.info("completed");
      yield* call(() =>
        pinoTest.consecutive(
          stream,
          [
            {
              command: "version",
              msg: "==== commands ready to run ===",
              level: 30,
              renderAsYAML: {},
            },
            {
              command: "version",
              msg: "==== result ===",
              level: 30,
              renderAsYAML: {},
            },
            {
              msg: "completed",
              level: 30,
            },
          ],
          checksWithObject()
        )
      );
      expect(covectored).toMatchSnapshot();

      const changelogTauriCore = yield* captureError(
        loadFile(path.join("/tauri/", "CHANGELOG.md"), fullIntegration)
      );
      expect(changelogTauriCore.message).toContain(
        "ENOENT: no such file or directory"
      );

      const changelogTaurijs = yield* captureError(
        loadFile(path.join("/cli/tauri.js/", "CHANGELOG.md"), fullIntegration)
      );
      expect(changelogTaurijs.message).toContain(
        "ENOENT: no such file or directory"
      );
    });

    it("runs publish", function* () {
      const stream = pinoTest.sink();
      const logger = pino(stream);
      const fullIntegration = f.copy("integration.js-with-complex-commands");
      const covectored = yield* covector({
        logger,
        command: "publish",
        cwd: fullIntegration,
        dryRun: true,
      });

      logger.info("completed");
      yield* call(() =>
        pinoTest.consecutive(
          stream,
          [
            {
              command: "publish",
              msg: "==== data piped into commands ===",
              level: 30,
              renderAsYAML: {},
            },
            {
              command: "publish",
              msg: "==== data piped into commands ===",
              level: 30,
              renderAsYAML: {},
            },
            {
              command: "publish",
              msg: "==== commands ready to run ===",
              level: 30,
              renderAsYAML: {},
            },
            {
              command: "publish",
              msg: "dryRun >> package-one [publish]: echo publish",
              level: 30,
            },
            {
              command: "publish",
              msg: "dryRun >> package-two [publish]: echo publish",
              level: 30,
            },
            {
              command: "publish",
              msg: "==== result ===",
              level: 30,
              renderAsYAML: {},
            },
            {
              msg: "completed",
              level: 30,
            },
          ],
          checksWithObject()
        )
      );
      expect(covectored).toMatchSnapshot();
    });

    it("runs test", function* () {
      const stream = pinoTest.sink();
      const logger = pino(stream);
      const fullIntegration = f.copy("integration.js-with-complex-commands");
      const covectored = yield* covector({
        logger,
        command: "test",
        cwd: fullIntegration,
        dryRun: true,
      });

      logger.info("completed");
      yield* call(() =>
        pinoTest.consecutive(
          stream,
          [
            {
              command: "arbitrary",
              msg: "==== data piped into commands ===",
              level: 30,
              renderAsYAML: {},
            },
            {
              command: "arbitrary",
              msg: "==== data piped into commands ===",
              level: 30,
              renderAsYAML: {},
            },
            {
              command: "arbitrary",
              msg: "==== commands ready to run ===",
              level: 30,
              renderAsYAML: {},
            },
            {
              command: "arbitrary",
              msg: "dryRun >> package-one [test]: npm run build",
              level: 30,
            },
            {
              command: "arbitrary",
              msg: "dryRun >> package-one [test]: npm test",
              level: 30,
            },
            {
              command: "arbitrary",
              msg: "package-one [test]: echo deboop",
              level: 30,
            },
            {
              command: "arbitrary",
              msg: "deboop",
              level: 30,
            },
            {
              command: "arbitrary",
              msg: "dryRun >> package-two [test]: npm run build",
              level: 30,
            },
            {
              command: "arbitrary",
              msg: "dryRun >> package-two [test]: npm test",
              level: 30,
            },
            {
              command: "arbitrary",
              msg: "package-two [test]: echo deboop",
              level: 30,
            },
            {
              command: "arbitrary",
              msg: "deboop",
              level: 30,
            },
            {
              command: "arbitrary",
              msg: "==== result ===",
              level: 30,
              renderAsYAML: {},
            },
            {
              msg: "completed",
              level: 30,
            },
          ],
          checksWithObject()
        )
      );
      expect(covectored).toMatchSnapshot();
    });

    it("runs build", function* () {
      const stream = pinoTest.sink();
      const logger = pino(stream);
      const fullIntegration = f.copy("integration.js-with-complex-commands");
      const covectored = yield* covector({
        logger,
        command: "build",
        cwd: fullIntegration,
        dryRun: true,
      });

      logger.info("completed");
      yield* call(() =>
        pinoTest.consecutive(
          stream,
          [
            {
              command: "arbitrary",
              msg: "==== data piped into commands ===",
              level: 30,
              renderAsYAML: {},
            },
            {
              command: "arbitrary",
              msg: "==== data piped into commands ===",
              level: 30,
              renderAsYAML: {},
            },
            {
              command: "arbitrary",
              msg: "==== commands ready to run ===",
              level: 30,
              renderAsYAML: {},
            },
            {
              command: "arbitrary",
              msg: "dryRun >> package-one [build]: npm run build",
              level: 30,
            },
            {
              command: "arbitrary",
              msg: "dryRun >> package-two [build]: npm run build",
              level: 30,
            },
            {
              command: "arbitrary",
              msg: "==== result ===",
              level: 30,
              renderAsYAML: {},
            },
            {
              msg: "completed",
              level: 30,
            },
          ],
          checksWithObject()
        )
      );
      expect(covectored).toMatchSnapshot();
    });
  });
});

describe("integration test to invoke sub commands", () => {
  it("runs publish-primary in prod mode", function* () {
    const stream = pinoTest.sink();
    const logger = pino(stream);
    const fullIntegration = f.copy("integration.js-with-subcommands");
    const covectored = yield* covector({
      logger,
      command: "publish-primary",
      cwd: fullIntegration,
    });

    logger.info("completed");
    yield* call(() =>
      pinoTest.consecutive(
        stream,
        [
          {
            command: "arbitrary",
            msg: "CHANGELOG.md not found",
            level: 50,
          },
          {
            command: "arbitrary",
            msg: "CHANGELOG.md not found",
            level: 50,
          },
          {
            command: "arbitrary",
            msg: "package-one [publish-primary]: echo publish",
            level: 30,
          },
          {
            command: "arbitrary",
            msg: "publish",
            level: 30,
          },
          {
            command: "arbitrary",
            msg: "package-two [publish-primary]: echo publish",
            level: 30,
          },
          {
            command: "arbitrary",
            msg: "publish",
            level: 30,
          },
          {
            msg: "completed",
            level: 30,
          },
        ],
        checksWithObject()
      )
    );
    expect(covectored).toMatchSnapshot();
  });

  it("runs publishSecondary in prod mode", function* () {
    const stream = pinoTest.sink();
    const logger = pino(stream);
    const fullIntegration = f.copy("integration.js-with-subcommands");
    const covectored = yield* covector({
      logger,
      command: "publishSecondary",
      cwd: fullIntegration,
    });

    logger.info("completed");
    yield* call(() =>
      pinoTest.consecutive(
        stream,
        [
          {
            command: "arbitrary",
            msg: "CHANGELOG.md not found",
            level: 50,
          },
          {
            command: "arbitrary",
            msg: "CHANGELOG.md not found",
            level: 50,
          },
          {
            command: "arbitrary",
            msg: "package-one [publishSecondary]: echo publish",
            level: 30,
          },
          {
            command: "arbitrary",
            msg: "publish",
            level: 30,
          },
          {
            command: "arbitrary",
            msg: "package-two [publishSecondary]: echo publish",
            level: 30,
          },
          {
            command: "arbitrary",
            msg: "publish",
            level: 30,
          },
          {
            msg: "completed",
            level: 30,
          },
        ],
        checksWithObject()
      )
    );
    expect(covectored).toMatchSnapshot();
  });
});
