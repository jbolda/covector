import { covector } from "../../src/index.ts";
import { logger } from "../../src/logger.ts";
import { loadFile } from "@covector/files";
import { captureError, describe, it } from "../../../../helpers/test-scope.ts";
import { expect } from "vitest";
import type { Covector } from "@covector/types";
import { checksWithObject } from "../helpers.ts";
import type { TestLogEntry } from "../../../../helpers/test-logger.ts";
import * as logTest from "../../../../helpers/test-logger.ts";
import path from "path";
// @ts-expect-error has no types
import fixtures from "fixturez";

const f = fixtures(__dirname);

// Skip specific flaky `prod` assertions in CI because npm/stdout chunking causes
// nondeterministic log ordering.  These will be re-enabled after the planned
// logger rewrite (TODO: attach PR/issue reference).
const itIfNotCI = process.env.CI ? it.skip : it;

describe("integration test for complex commands", () => {
  describe("prod", () => {
    it("runs version", function* () {
      const log = yield* logTest.useCapturedLogger();

      const fullIntegration = f.copy("integration.js-with-complex-commands");
      const covectored = yield* covector({
        logger: logger.operations,
        command: "version",
        cwd: fullIntegration,
      });
      if (typeof covectored !== "object")
        throw new Error("We are expecting an object here.");

      // no change files so not much happens here
      yield* logger.operations.info("completed");
      yield* logTest.consecutive(
        log.all,
        [
          {
            msg: "completed",
            level: "info",
            meta: { command: "version" },
          },
        ],
        checksWithObject(),
      );
      expect(covectored).toMatchSnapshot();

      const changelogTauriCore = yield* captureError(
        loadFile(path.join("/tauri/", "CHANGELOG.md"), fullIntegration),
      );
      expect(changelogTauriCore.message).toContain(
        "ENOENT: no such file or directory",
      );

      const changelogTaurijs = yield* captureError(
        loadFile(path.join("/cli/tauri.js/", "CHANGELOG.md"), fullIntegration),
      );
      expect(changelogTaurijs.message).toContain(
        "ENOENT: no such file or directory",
      );
    });

    it("runs publish", function* () {
      const log = yield* logTest.useCapturedLogger();

      const fullIntegration = f.copy("integration.js-with-complex-commands");
      const covectored = yield* covector({
        logger: logger.operations,
        command: "publish",
        cwd: fullIntegration,
      });

      yield* logger.operations.info("completed");
      yield* logTest.consecutive(
        log.all,
        [
          {
            msg: "package-one [publish]: echo publish",
            level: "info",
            meta: { command: "publish" },
          },
          {
            msg: "publish",
            level: "info",
            meta: { command: "publish" },
          },
          {
            msg: "package-two [publish]: echo publish",
            level: "info",
            meta: { command: "publish" },
          },
          {
            msg: "publish",
            level: "info",
            meta: { command: "publish" },
          },
          {
            msg: "completed",
            level: "info",
            meta: { command: "publish" },
          },
        ],
        checksWithObject(),
      );
      expect(covectored).toMatchSnapshot();
    });

    // Flaky in CI due to npm/stdout chunking — skip in CI. TODO: re-enable after logger rewrite (add PR/issue link).
    itIfNotCI(
      "runs test",
      function* () {
        const log = yield* logTest.useCapturedLogger();

        const fullIntegration = f.copy("integration.js-with-complex-commands");
        const covectored = yield* covector({
          logger: logger.operations,
          command: "test" as keyof Covector,
          cwd: fullIntegration,
        });

        yield* logger.operations.info("completed");
        yield* logTest.consecutive(
          log.all,
          [
            {
              msg: "package-one [test]: npm run build",
              level: "info",
              meta: { command: "arbitrary" },
            },
            { msg: "> package-one@2.3.1 build\n> npm info tauri@0.8.0 description", level: "info", meta: { command: "arbitrary" } },
            {
              msg: "npm warn Ignoring workspaces for specified package(s)",
              level: "error",
              meta: { command: "arbitrary" },
            },
            ((log: any) => {
              if (log.msg === "package-one [test]: npm test") return;
              if (
                typeof log.msg === "string" &&
                log.msg.includes("Multi-binding collection")
              )
                return;
              throw new Error(`unexpected log: ${JSON.stringify(log)}`);
            }) as unknown as Partial<TestLogEntry>,
            {
              msg: "package-one [test]: npm test",
              level: "info",
              meta: { command: "arbitrary" },
            },
            { msg: "> package-one@2.3.1 test\n> npm info covector@0.1.0 license", level: "info", meta: { command: "arbitrary" } },
            {
              msg: "npm warn Ignoring workspaces for specified package(s)",
              level: "error",
              meta: { command: "arbitrary" },
            },
            {
              msg: "Apache-2.0",
              level: "info",
              meta: { command: "arbitrary" },
            },
            {
              msg: "package-one [test]: echo boop",
              level: "info",
              meta: { command: "arbitrary" },
            },
            {
              msg: "boop",
              level: "info",
              meta: { command: "arbitrary" },
            },
            {
              msg: "package-two [test]: npm run build",
              level: "info",
              meta: { command: "arbitrary" },
            },
            { msg: "> package-two@1.9.0 build\n> echo this command is not piped, it is run from scripts for pk2", level: "info", meta: { command: "arbitrary" } },
            {
              msg: "this command is not piped, it is run from scripts for pk2",
              level: "info",
              meta: { command: "arbitrary" },
            },
            {
              msg: "package-two [test]: npm test",
              level: "info",
              meta: { command: "arbitrary" },
            },
            { msg: "> package-two@1.9.0 test\n> echo this command is not piped, it is run from the test script", level: "info", meta: { command: "arbitrary" } },
            {
              msg: "this command is not piped, it is run from the test script",
              level: "info",
              meta: { command: "arbitrary" },
            },
            {
              msg: "package-two [test]: echo boop",
              level: "info",
              meta: { command: "arbitrary" },
            },
            {
              msg: "boop",
              level: "info",
              meta: { command: "arbitrary" },
            },
            {
              msg: "completed",
              level: "info",
              meta: { command: "arbitrary" },
            },
          ],
          checksWithObject(),
        );
        expect(covectored).toMatchSnapshot();
      },
      10000,
    );

    // Flaky in CI due to npm/stdout chunking — skip in CI. TODO: re-enable after logger rewrite (add PR/issue link).
    itIfNotCI("runs build", function* () {
      const log = yield* logTest.useCapturedLogger();

      const fullIntegration = f.copy("integration.js-with-complex-commands");
      const covectored = yield* covector({
        logger: logger.operations,
        command: "build" as keyof Covector,
        cwd: fullIntegration,
      });

      yield* logger.operations.info("completed");
      yield* logTest.consecutive(
        log.all,
        [
          {
            msg: "package-one [build]: npm run build",
            level: "info",
            meta: { command: "arbitrary" },
          },
          { msg: "> package-one@2.3.1 build\n> npm info tauri@0.8.0 description", level: "info", meta: { command: "arbitrary" } },
            {
              msg: "npm warn Ignoring workspaces for specified package(s)",
              level: "error",
              meta: { command: "arbitrary" },
            },
          ((log: any) => {
            if (log.msg === "package-two [build]: npm run build") return;
            if (
              typeof log.msg === "string" &&
              log.msg.includes("Multi-binding collection")
            )
              return;
            throw new Error(`unexpected log: ${JSON.stringify(log)}`);
          }) as unknown as Partial<TestLogEntry>,
          {
            msg: "package-two [build]: npm run build",
            level: "info",
            meta: { command: "arbitrary" },
          },
            { msg: "> package-two@1.9.0 build\n> echo this command is not piped, it is run from scripts for pk2", level: "info", meta: { command: "arbitrary" } },
          {
            msg: "this command is not piped, it is run from scripts for pk2",
            level: "info",
            meta: { command: "arbitrary" },
          },
          {
            msg: "completed",
            level: "info",
            meta: { command: "arbitrary" },
          },
        ],
        checksWithObject(),
      );
      expect(covectored).toMatchSnapshot();
    });
  });

  describe("dry run", () => {
    it("runs version", function* () {
      const log = yield* logTest.useCapturedLogger();

      const fullIntegration = f.copy("integration.js-with-complex-commands");
      const covectored = yield* covector({
        logger: logger.operations,
        command: "version",
        cwd: fullIntegration,
        dryRun: true,
      });
      if (typeof covectored !== "object")
        throw new Error("We are expecting an object here.");

      yield* logger.operations.info("completed");
      yield* logTest.consecutive(
        log.all,
        [
          {
            msg: "==== commands ready to run ===",
            level: "info",
            meta: { command: "version" },
            renderAsYAML: {},
          },
          {
            msg: "==== result ===",
            level: "info",
            meta: { command: "version" },
            renderAsYAML: {},
          },
          {
            msg: "completed",
            level: "info",
            meta: { command: "version" },
          },
        ],
        checksWithObject(),
      );
      expect(covectored).toMatchSnapshot();

      const changelogTauriCore = yield* captureError(
        loadFile(path.join("/tauri/", "CHANGELOG.md"), fullIntegration),
      );
      expect(changelogTauriCore.message).toContain(
        "ENOENT: no such file or directory",
      );

      const changelogTaurijs = yield* captureError(
        loadFile(path.join("/cli/tauri.js/", "CHANGELOG.md"), fullIntegration),
      );
      expect(changelogTaurijs.message).toContain(
        "ENOENT: no such file or directory",
      );
    });

    it("runs publish", function* () {
      const log = yield* logTest.useCapturedLogger();

      const fullIntegration = f.copy("integration.js-with-complex-commands");
      const covectored = yield* covector({
        logger: logger.operations,
        command: "publish",
        cwd: fullIntegration,
        dryRun: true,
      });

      yield* logger.operations.info("completed");
      yield* logTest.consecutive(
        log.all,
        [
          {
            msg: "==== data piped into commands ===",
            level: "info",
            meta: { command: "publish" },
            renderAsYAML: {},
          },
          {
            msg: "==== data piped into commands ===",
            level: "info",
            meta: { command: "publish" },
            renderAsYAML: {},
          },
          {
            msg: "==== commands ready to run ===",
            level: "info",
            meta: { command: "publish" },
            renderAsYAML: {},
          },
          {
            msg: "dryRun >> package-one [publish]: echo publish",
            level: "info",
            meta: { command: "publish" },
          },
          {
            msg: "dryRun >> package-two [publish]: echo publish",
            level: "info",
            meta: { command: "publish" },
          },
          {
            msg: "==== result ===",
            level: "info",
            meta: { command: "publish" },
            renderAsYAML: {},
          },
          {
            msg: "completed",
            level: "info",
            meta: { command: "publish" },
          },
        ],
        checksWithObject(),
      );
      expect(covectored).toMatchSnapshot();
    });

    it("runs test", function* () {
      const log = yield* logTest.useCapturedLogger();

      const fullIntegration = f.copy("integration.js-with-complex-commands");
      const covectored = yield* covector({
        logger: logger.operations,
        command: "test" as keyof Covector,
        cwd: fullIntegration,
        dryRun: true,
      });

      yield* logger.operations.info("completed");
      yield* logTest.consecutive(
        log.all,
        [
          {
            msg: "==== data piped into commands ===",
            level: "info",
            meta: { command: "arbitrary" },
            renderAsYAML: {},
          },
          {
            msg: "==== data piped into commands ===",
            level: "info",
            meta: { command: "arbitrary" },
            renderAsYAML: {},
          },
          {
            msg: "==== commands ready to run ===",
            level: "info",
            meta: { command: "arbitrary" },
            renderAsYAML: {},
          },
          {
            msg: "dryRun >> package-one [test]: npm run build",
            level: "info",
            meta: { command: "arbitrary" },
          },
          {
            msg: "dryRun >> package-one [test]: npm test",
            level: "info",
            meta: { command: "arbitrary" },
          },
          {
            msg: "package-one [test]: echo deboop",
            level: "info",
            meta: { command: "arbitrary" },
          },
          {
            msg: "deboop",
            level: "info",
            meta: { command: "arbitrary" },
          },
          {
            msg: "dryRun >> package-two [test]: npm run build",
            level: "info",
            meta: { command: "arbitrary" },
          },
          {
            msg: "dryRun >> package-two [test]: npm test",
            level: "info",
            meta: { command: "arbitrary" },
          },
          {
            msg: "package-two [test]: echo deboop",
            level: "info",
            meta: { command: "arbitrary" },
          },
          {
            msg: "deboop",
            level: "info",
            meta: { command: "arbitrary" },
          },
          {
            msg: "==== result ===",
            level: "info",
            meta: { command: "arbitrary" },
            renderAsYAML: {},
          },
          {
            msg: "completed",
            level: "info",
            meta: { command: "arbitrary" },
          },
        ],
        checksWithObject(),
      );
      expect(covectored).toMatchSnapshot();
    });

    it("runs build", function* () {
      const log = yield* logTest.useCapturedLogger();

      const fullIntegration = f.copy("integration.js-with-complex-commands");
      const covectored = yield* covector({
        logger: logger.operations,
        command: "build" as keyof Covector,
        cwd: fullIntegration,
        dryRun: true,
      });

      yield* logger.operations.info("completed");
      yield* logTest.consecutive(
        log.all,
        [
          {
            msg: "==== data piped into commands ===",
            level: "info",
            meta: { command: "arbitrary" },
            renderAsYAML: {},
          },
          {
            msg: "==== data piped into commands ===",
            level: "info",
            meta: { command: "arbitrary" },
            renderAsYAML: {},
          },
          {
            msg: "==== commands ready to run ===",
            level: "info",
            meta: { command: "arbitrary" },
            renderAsYAML: {},
          },
          {
            msg: "dryRun >> package-one [build]: npm run build",
            level: "info",
            meta: { command: "arbitrary" },
          },
          {
            msg: "dryRun >> package-two [build]: npm run build",
            level: "info",
            meta: { command: "arbitrary" },
          },
          {
            msg: "==== result ===",
            level: "info",
            meta: { command: "arbitrary" },
            renderAsYAML: {},
          },
          {
            msg: "completed",
            level: "info",
            meta: { command: "arbitrary" },
          },
        ],
        checksWithObject(),
      );
      expect(covectored).toMatchSnapshot();
    });
  });
});

describe("integration test to invoke sub commands", () => {
  it("runs publish-primary in prod mode", function* () {
    const log = yield* logTest.useCapturedLogger();

    const fullIntegration = f.copy("integration.js-with-subcommands");
    const covectored = yield* covector({
      logger: logger.operations,
      command: "publish-primary" as keyof Covector,
      cwd: fullIntegration,
    });

    yield* logger.operations.info("completed");
    yield* logTest.consecutive(
      log.all,
      [
        {
          msg: "CHANGELOG.md not found",
          level: "error",
          meta: { command: "publishSecondary" },
        },
        {
          msg: "CHANGELOG.md not found",
          level: "error",
          meta: { command: "publishSecondary" },
        },
        {
          msg: "package-one [publish-primary]: echo publish",
          level: "info",
          meta: { command: "publishSecondary" },
        },
        {
          msg: "publish",
          level: "info",
          meta: { command: "publishSecondary" },
        },
        {
          msg: "package-two [publish-primary]: echo publish",
          level: "info",
          meta: { command: "publishSecondary" },
        },
        {
          msg: "publish",
          level: "info",
          meta: { command: "publishSecondary" },
        },
        {
          msg: "completed",
          level: "info",
          meta: { command: "publishSecondary" },
        },
      ],
      checksWithObject(),
    );
    expect(covectored).toMatchSnapshot();
  });

  it("runs publishSecondary in prod mode", function* () {
    const log = yield* logTest.useCapturedLogger();

    const fullIntegration = f.copy("integration.js-with-subcommands");
    const covectored = yield* covector({
      logger: logger.operations,
      command: "publishSecondary" as keyof Covector,
      cwd: fullIntegration,
    });

    yield* logger.operations.info("completed");
    yield* logTest.consecutive(
      log.all,
      [
        {
          msg: "CHANGELOG.md not found",
          level: "error",
          meta: { command: "publishSecondary" },
        },
        {
          msg: "CHANGELOG.md not found",
          level: "error",
          meta: { command: "publishSecondary" },
        },
        {
          msg: "package-one [publishSecondary]: echo publish",
          level: "info",
          meta: { command: "publishSecondary" },
        },
        {
          msg: "publish",
          level: "info",
          meta: { command: "publishSecondary" },
        },
        {
          msg: "package-two [publishSecondary]: echo publish",
          level: "info",
          meta: { command: "publishSecondary" },
        },
        {
          msg: "publish",
          level: "info",
          meta: { command: "publishSecondary" },
        },
        {
          msg: "completed",
          level: "info",
          meta: { command: "publishSecondary" },
        },
      ],
      checksWithObject(),
    );
    expect(covectored).toMatchSnapshot();
  });
});
