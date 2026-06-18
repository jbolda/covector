import { covector } from "../../src/index.js";
import { logger as covectorLogger } from "../../src/logger.ts";
import { loadFile } from "@covector/files";
import { TomlDocument } from "@covector/toml";
import { captureError, describe, it } from "../../../../helpers/test-scope.ts";
import { expect } from "vitest";
import * as logTest from "../../../../helpers/test-logger.ts";
import { checksChunksInMsg, checksWithObject } from "../helpers.ts";
import path from "path";
import type { Covector } from "@covector/types";
// @ts-expect-error has not types
import fixtures from "fixturez";
const f = fixtures(__dirname);

import { injectPublishFunctions } from "../../../action/src/utils.js";
import { run } from "effection";

expect.addSnapshotSerializer({
  test: (value) => value instanceof TomlDocument,
  print: (_) => `TomlDocument {}`,
});

describe("integration test in production mode", () => {
  describe("handles config", () => {
    it("passes correct config for js and rust", function* () {
      const logs = yield* logTest.useCapturedLogger();

      const logger = covectorLogger.operations;
      const fullIntegration = f.copy("integration.js-and-rust-with-changes");
      const covectored = yield* covector({
        logger,
        command: "status",
        cwd: fullIntegration,
      });

      // to confirm we have reached the end of the logs
      yield* logger.info("completed");
      yield* logTest.consecutive(
          logs.all,
          [
            {
              msg: "changes:",
              level: "info",
              meta: { command: "status" },
              // TODO check yaml
            },
            {
              msg: "tauri => minor",
              level: "info",
              meta: { command: "status" },
            },
            {
              msg: "tauri-updater => patch",
              level: "info",
              meta: { command: "status" },
            },
            {
              msg: "bumping tauri with minor",
              level: "info",
              meta: { command: "status" },
            },
            {
              msg: "bumping tauri-updater with patch",
              level: "info",
              meta: { command: "status" },
            },
            {
              msg: "bumping tauri.js with patch",
              level: "info",
              meta: { command: "status" },
            },
            {
              msg: "tauri.js planned to be bumped from 0.6.2 to 0.6.3",
              level: "info",
              meta: { command: "status" },
            },
            {
              msg: "tauri planned to be bumped from 0.5.2 to 0.6.0",
              level: "info",
              meta: { command: "status" },
            },
            {
              msg: "tauri-updater planned to be bumped from 0.4.2 to 0.4.3",
              level: "info",
              meta: { command: "status" },
            },
            {
              msg: "completed",
              level: "info",
              meta: { command: "status" },
            },
          ],
          checksWithObject(),
        );
      expect(covectored).toMatchSnapshot();
    });

    it("allows modifying the config", function* () {
      const sink = yield* logTest.useCapturedLogger();

      const logger = covectorLogger.operations;
      const fullIntegration = f.copy("integration.js-and-rust-with-changes");
      const modifyConfig = async (pullConfig: any) => {
        const config = await pullConfig;
        return Object.keys(config.pkgManagers).reduce(
          (finalConfig, pkgManager) => {
            finalConfig.pkgManagers[pkgManager] = Object.keys(
              config.pkgManagers[pkgManager],
            ).reduce((pm, p) => {
              if (p.startsWith("publish")) {
                const functionInject = async () =>
                  run(function* () {
                    // yield* covectorLogger.around(captureLoggerMiddleware(logs));
                    yield* logger.warn("deboop");
                  });
                pm[p] = Array.isArray(pm[p])
                  ? pm[p].concat(functionInject)
                  : [pm[p], functionInject];
              } else if (p.startsWith("pre")) {
                const functionInject = async () =>
                  run(function* () {
                    // yield* covectorLogger.around(captureLoggerMiddleware(logs));
                    yield* logger.warn("begin with only boops");
                  });
                pm[p] = [functionInject];
              } else if (p.startsWith("post")) {
                const functionInject = async () =>
                  run(function* () {
                    // yield* covectorLogger.around(captureLoggerMiddleware(logs));
                    yield* logger.warn("ends with overwrites using boops");
                  });
                pm[p] = functionInject;
              }
              return pm;
            }, config.pkgManagers[pkgManager]);

            return finalConfig;
          },
          config,
        );
      };

      const covectored = yield* covector({
        logger,
        command: "publish",
        cwd: fullIntegration,
        modifyConfig,
      });

      // to confirm we have reached the end of the logs
      yield* logger.info("completed");
      yield* logTest.consecutive(
          sink.all,
          [
            {
              msg: "CHANGELOG.md not found",
              level: "error",
              meta: { command: "publish" },
            },
            {
              msg: "CHANGELOG.md not found",
              level: "error",
              meta: { command: "publish" },
            },
            {
              msg: "CHANGELOG.md not found",
              level: "error",
              meta: { command: "publish" },
            },
            {
              msg: "CHANGELOG.md not found",
              level: "error",
              meta: { command: "publish" },
            },
            {
              msg: "CHANGELOG.md not found",
              level: "error",
              meta: { command: "publish" },
            },
            {
              msg: "CHANGELOG.md not found",
              level: "error",
              meta: { command: "publish" },
            },
            {
              msg: "Checking if tauri-bundler@0.6.0 is already published with: node -e \"console.log('0.5.2')\"",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "0.5.2",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "Checking if tauri@0.5.2 is already published with: node -e \"console.log('0.5.2')\"",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "0.5.2",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "tauri@0.5.2 is already published. Skipping.",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "Checking if tauri-api@0.5.1 is already published with: node -e \"console.log('0.5.2')\"",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "0.5.2",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "Checking if tauri-utils@0.5.0 is already published with: node -e \"console.log('0.5.2')\"",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "0.5.2",
              level: "info",
              meta: { command: "publish" },
            },
            {
              // this is an injected log from modifying the config
              msg: "begin with only boops",
              level: "warn",
              meta: { command: "publish" },
            },
            {
              // this is an injected log from modifying the config
              msg: "begin with only boops",
              level: "warn",
              meta: { command: "publish" },
            },
            {
              // this is an injected log from modifying the config
              msg: "begin with only boops",
              level: "warn",
              meta: { command: "publish" },
            },
            {
              msg: "tauri.js [publish]: node -e \"console.log('publishing tauri.js')\"",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "publishing tauri.js",
              level: "info",
              meta: { command: "publish" },
            },
            {
              // this is an injected log from modifying the config
              msg: "deboop",
              level: "warn",
              meta: { command: "publish" },
            },
            {
              msg: "tauri-bundler [publish]: node -e \"console.log('publishing tauri-bundler')\"",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "publishing tauri-bundler",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "tauri-bundler [publish]: node -e \"console.log('running in ./cli/tauri-bundler')\"",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "running in ./cli/tauri-bundler",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "tauri-bundler [publish run from the cwd]: ls",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "cli\ntauri\ntauri-api\ntauri-updater\ntauri-utils",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "tauri-bundler [publish]: ls",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "Cargo.toml",
              level: "info",
              meta: { command: "publish" },
            },
            {
              // this is an injected log from modifying the config
              msg: "deboop",
              level: "warn",
              meta: { command: "publish" },
            },
            {
              msg: "tauri-api [publish]: node -e \"console.log('publishing tauri-api')\"",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "publishing tauri-api",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "tauri-api [publish]: node -e \"console.log('running in ./tauri-api')\"",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "running in ./tauri-api",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "tauri-api [publish run from the cwd]: ls",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "cli\ntauri\ntauri-api\ntauri-updater\ntauri-utils",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "tauri-api [publish]: ls",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "Cargo.toml",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "deboop",
              level: "warn",
              meta: { command: "publish" },
            },
            {
              msg: "tauri-utils [publish]: node -e \"console.log('publishing tauri-utils')\"",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "publishing tauri-utils",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "tauri-utils [publish]: node -e \"console.log('running in ./tauri-utils')\"",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "running in ./tauri-utils",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "tauri-utils [publish run from the cwd]: ls",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "cli\ntauri\ntauri-api\ntauri-updater\ntauri-utils",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "tauri-utils [publish]: ls",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "Cargo.toml",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "deboop",
              level: "warn",
              meta: { command: "publish" },
            },
            {
              msg: "ends with overwrites using boops",
              level: "warn",
              meta: { command: "publish" },
            },
            {
              msg: "ends with overwrites using boops",
              level: "warn",
              meta: { command: "publish" },
            },
            {
              msg: "ends with overwrites using boops",
              level: "warn",
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

    it("uses the action config modification", function* () {
      const sink = yield* logTest.useCapturedLogger();

      const logger = covectorLogger.operations;
      const fullIntegration = f.copy("integration.js-and-rust-with-changes");

      const covectored = yield* covector({
        logger,
        command: "publish",
        cwd: fullIntegration,
        modifyConfig: injectPublishFunctions([
          async (pkg: any) =>
            run(function* () {
              // yield* covectorLogger.around(captureLoggerMiddleware(logs));
              yield* logger.warn(
                `push log into publish for ${pkg.pkg}-v${pkg.pkgFile.version}`,
              );
            }),
          async () =>
            run(function* () {
              // yield* covectorLogger.around(captureLoggerMiddleware(logs));
              yield* logger.warn(`push another log`);
            }),
        ]),
      });

      // to confirm we have reached the end of the logs
      yield* logger.info("completed");
      yield* logTest.consecutive(
          sink.all,
          [
            {
              msg: "CHANGELOG.md not found",
              level: "error",
              meta: { command: "publish" },
            },
            {
              msg: "CHANGELOG.md not found",
              level: "error",
              meta: { command: "publish" },
            },
            {
              msg: "CHANGELOG.md not found",
              level: "error",
              meta: { command: "publish" },
            },
            {
              msg: "CHANGELOG.md not found",
              level: "error",
              meta: { command: "publish" },
            },
            {
              msg: "CHANGELOG.md not found",
              level: "error",
              meta: { command: "publish" },
            },
            {
              msg: "CHANGELOG.md not found",
              level: "error",
              meta: { command: "publish" },
            },
            {
              msg: "Checking if tauri-bundler@0.6.0 is already published with: node -e \"console.log('0.5.2')\"",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "0.5.2",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "Checking if tauri@0.5.2 is already published with: node -e \"console.log('0.5.2')\"",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "0.5.2",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "tauri@0.5.2 is already published. Skipping.",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "Checking if tauri-api@0.5.1 is already published with: node -e \"console.log('0.5.2')\"",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "0.5.2",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "Checking if tauri-utils@0.5.0 is already published with: node -e \"console.log('0.5.2')\"",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "0.5.2",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "tauri-bundler [prepublish]: node -e \"console.log('premode for tauri-bundler')\"",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "premode for tauri-bundler",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "tauri-api [prepublish]: node -e \"console.log('premode for tauri-api')\"",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "premode for tauri-api",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "tauri-utils [prepublish]: node -e \"console.log('premode for tauri-utils')\"",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "premode for tauri-utils",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "tauri.js [publish]: node -e \"console.log('publishing tauri.js')\"",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "publishing tauri.js",
              level: "info",
              meta: { command: "publish" },
            },
            {
              // this is an injected log from modifying the config
              msg: "push log into publish for tauri.js-v0.6.2",
              level: "warn",
              meta: { command: "publish" },
            },
            {
              // this is an injected log from modifying the config
              msg: "push another log",
              level: "warn",
              meta: { command: "publish" },
            },
            {
              msg: "tauri-bundler [publish]: node -e \"console.log('publishing tauri-bundler')\"",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "publishing tauri-bundler",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "tauri-bundler [publish]: node -e \"console.log('running in ./cli/tauri-bundler')\"",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "running in ./cli/tauri-bundler",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "tauri-bundler [publish run from the cwd]: ls",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "cli\ntauri\ntauri-api\ntauri-updater\ntauri-utils",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "tauri-bundler [publish]: ls",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "Cargo.toml",
              level: "info",
              meta: { command: "publish" },
            },
            {
              // this is an injected log from modifying the config
              msg: "push log into publish for tauri-bundler-v0.6.0",
              level: "warn",
              meta: { command: "publish" },
            },
            {
              // this is an injected log from modifying the config
              msg: "push another log",
              level: "warn",
              meta: { command: "publish" },
            },
            {
              msg: "tauri-api [publish]: node -e \"console.log('publishing tauri-api')\"",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "publishing tauri-api",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "tauri-api [publish]: node -e \"console.log('running in ./tauri-api')\"",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "running in ./tauri-api",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "tauri-api [publish run from the cwd]: ls",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "cli\ntauri\ntauri-api\ntauri-updater\ntauri-utils",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "tauri-api [publish]: ls",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "Cargo.toml",
              level: "info",
              meta: { command: "publish" },
            },
            {
              // this is an injected log from modifying the config
              msg: "push log into publish for tauri-api-v0.5.1",
              level: "warn",
              meta: { command: "publish" },
            },
            {
              // this is an injected log from modifying the config
              msg: "push another log",
              level: "warn",
              meta: { command: "publish" },
            },
            {
              msg: "tauri-utils [publish]: node -e \"console.log('publishing tauri-utils')\"",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "publishing tauri-utils",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "tauri-utils [publish]: node -e \"console.log('running in ./tauri-utils')\"",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "running in ./tauri-utils",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "tauri-utils [publish run from the cwd]: ls",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "cli\ntauri\ntauri-api\ntauri-updater\ntauri-utils",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "tauri-utils [publish]: ls",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "Cargo.toml",
              level: "info",
              meta: { command: "publish" },
            },
            {
              // this is an injected log from modifying the config
              msg: "push log into publish for tauri-utils-v0.5.0",
              level: "warn",
              meta: { command: "publish" },
            },
            {
              // this is an injected log from modifying the config
              msg: "push another log",
              level: "warn",
              meta: { command: "publish" },
            },
            {
              msg: "tauri-bundler [postpublish]: node -e \"console.log('postmode for tauri-bundler')\"",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "postmode for tauri-bundler",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "tauri-api [postpublish]: node -e \"console.log('postmode for tauri-api')\"",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "postmode for tauri-api",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "tauri-utils [postpublish]: node -e \"console.log('postmode for tauri-utils')\"",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "postmode for tauri-utils",
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
  });

  describe("version", () => {
    it("runs version for js and rust", function* () {
      const sink = yield* logTest.useCapturedLogger();

      const logger = covectorLogger.operations;
      const fullIntegration = f.copy("integration.js-and-rust-with-changes");
      const covectored = yield* covector({
        logger,
        command: "version",
        cwd: fullIntegration,
      });
      if (typeof covectored !== "object")
        throw new Error("We are expecting an object here.");

      // to confirm we have reached the end of the logs
      yield* logger.info("completed");
      yield* logTest.consecutive(
          sink.all,
          [
            {
              msg: "bumping tauri with minor",
              level: "info",
              meta: { command: "version" },
            },
            {
              msg: "bumping tauri-updater with patch",
              level: "info",
              meta: { command: "version" },
            },
            {
              msg: "bumping tauri.js with patch",
              level: "info",
              meta: { command: "version" },
            },
            {
              msg: "Could not load the CHANGELOG.md. Creating one.",
              level: "info",
              meta: { command: "version" },
            },
            {
              msg: "Could not load the CHANGELOG.md. Creating one.",
              level: "info",
              meta: { command: "version" },
            },
            {
              msg: "Could not load the CHANGELOG.md. Creating one.",
              level: "info",
              meta: { command: "version" },
            },
            {
              msg: ".changes/first-change.md was deleted",
              level: "info",
              meta: { command: "version" },
            },
            {
              msg: ".changes/second-change.md was deleted",
              level: "info",
              meta: { command: "version" },
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

      const changelogTauriCore = yield* loadFile(
        path.join("/tauri/", "CHANGELOG.md"),
        fullIntegration,
      );
      expect(changelogTauriCore.content).toBe(
        "# Changelog\n\n" +
          "## \\[0.6.0]\n\n" +
          "- Summary about the changes in tauri\n",
      );

      const changelogTaurijs = yield* loadFile(
        path.join("/cli/tauri.js/", "CHANGELOG.md"),
        fullIntegration,
      );
      expect(changelogTaurijs.content).toBe(
        "# Changelog\n\n" +
          "## \\[0.6.3]\n\n" +
          "### Dependencies\n\n" +
          "- Upgraded to `tauri@0.6.0`\n",
      );
    });

    it("runs version for dart / flutter single", function* () {
      const sink = yield* logTest.useCapturedLogger();

      const logger = covectorLogger.operations;
      const fullIntegration = f.copy("integration.dart-flutter-single");
      const covectored = yield* covector({
        logger,
        command: "version",
        cwd: fullIntegration,
      });
      if (typeof covectored !== "object")
        throw new Error("We are expecting an object here.");

      // to confirm we have reached the end of the logs
      yield* logger.info("completed");
      yield* logTest.consecutive(
          sink.all,
          [
            {
              msg: "bumping test_app with minor",
              level: "info",
              meta: { command: "version" },
            },
            {
              msg: "Could not load the CHANGELOG.md. Creating one.",
              level: "info",
              meta: { command: "version" },
            },
            {
              msg: ".changes/first-change.md was deleted",
              level: "info",
              meta: { command: "version" },
            },
            {
              msg: ".changes/second-change.md was deleted",
              level: "info",
              meta: { command: "version" },
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

      const changelog = yield* loadFile("CHANGELOG.md", fullIntegration);
      expect(changelog.content).toBe(
        "# Changelog\n\n" +
          "## \\[0.4.0]\n\n" +
          "- Summary about the changes in test_app\n" +
          "- Summary about the changes again(!) in test_app\n",
      );

      const versionFile = yield* loadFile("pubspec.yaml", fullIntegration);
      expect(versionFile.content).toEqual(
        expect.stringContaining("version: 0.4.0\n"),
      );
    });

    it("runs version for dart / flutter multi", function* () {
      const sink = yield* logTest.useCapturedLogger();

      const logger = covectorLogger.operations;
      const fullIntegration = f.copy("integration.dart-flutter-multi");
      const covectored = yield* covector({
        logger,
        command: "version",
        cwd: fullIntegration,
      });
      if (typeof covectored !== "object")
        throw new Error("We are expecting an object here.");

      // to confirm we have reached the end of the logs
      yield* logger.info("completed");
      yield* logTest.consecutive(
          sink.all,
          [
            {
              msg: "bumping test_app_two with minor",
              level: "info",
              meta: { command: "version" },
            },
            {
              msg: "bumping test_app_three with patch",
              level: "info",
              meta: { command: "version" },
            },
            {
              msg: "bumping test_app_one with patch",
              level: "info",
              meta: { command: "version" },
            },
            {
              msg: "Could not load the CHANGELOG.md. Creating one.",
              level: "info",
              meta: { command: "version" },
            },
            {
              msg: "Could not load the CHANGELOG.md. Creating one.",
              level: "info",
              meta: { command: "version" },
            },
            {
              msg: "Could not load the CHANGELOG.md. Creating one.",
              level: "info",
              meta: { command: "version" },
            },
            {
              msg: ".changes/first-change.md was deleted",
              level: "info",
              meta: { command: "version" },
            },
            {
              msg: ".changes/second-change.md was deleted",
              level: "info",
              meta: { command: "version" },
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

      const changelog = yield* loadFile(
        path.join("dart", "CHANGELOG.md"),
        fullIntegration,
      );
      expect(changelog.content).toBe(
        "# Changelog\n\n" +
          "## \\[0.3.2]\n\n" +
          "### Dependencies\n\n" +
          "- Upgraded to `test_app_two@0.2.0`\n" +
          "- Upgraded to `test_app_three@3.8.98`\n",
      );

      const versionFile = yield* loadFile(
        path.join("dart", "pubspec.yaml"),
        fullIntegration,
      );
      expect(versionFile.content).toEqual(
        expect.stringContaining("version: 0.3.2\n"),
      );
    });

    it("runs version for general file", function* () {
      const sink = yield* logTest.useCapturedLogger();

      const logger = covectorLogger.operations;
      const fullIntegration = f.copy("integration.general-file");
      const covectored = yield* covector({
        logger,
        command: "version",
        cwd: fullIntegration,
      });
      if (typeof covectored !== "object")
        throw new Error("We are expecting an object here.");

      // to confirm we have reached the end of the logs
      yield* logger.info("completed");
      yield* logTest.consecutive(
          sink.all,
          [
            {
              msg: "bumping general-pkg with minor",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "Could not load the CHANGELOG.md. Creating one.",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: ".changes/first-change.md was deleted",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: ".changes/second-change.md was deleted",
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

      const changelog = yield* loadFile("CHANGELOG.md", fullIntegration);
      expect(changelog.content).toBe(
        "# Changelog\n\n" +
          "## \\[6.2.0]\n\n" +
          "- Summary about the changes in general-pkg\n" +
          "- A general summary about the generally changes in general-pkg generally\n",
      );

      const versionFile = yield* loadFile("VERSION", fullIntegration);
      expect(versionFile.content).toBe("6.2.0");
    });
  });

  describe("publish", () => {
    it("runs publish for js and rust", function* () {
      const sink = yield* logTest.useCapturedLogger();

      const logger = covectorLogger.operations;
      const fullIntegration = f.copy("integration.js-and-rust-with-changes");
      const covectored = yield* covector({
        logger,
        command: "publish",
        cwd: fullIntegration,
      });

      // to confirm we have reached the end of the logs
      yield* logger.info("completed");
      yield* logTest.consecutive(
          sink.all,
          [
            {
              msg: "CHANGELOG.md not found",
              level: "error",
              meta: { command: "publish" },
            },
            {
              msg: "CHANGELOG.md not found",
              level: "error",
              meta: { command: "publish" },
            },
            {
              msg: "CHANGELOG.md not found",
              level: "error",
              meta: { command: "publish" },
            },
            {
              msg: "CHANGELOG.md not found",
              level: "error",
              meta: { command: "publish" },
            },
            {
              msg: "CHANGELOG.md not found",
              level: "error",
              meta: { command: "publish" },
            },
            {
              msg: "CHANGELOG.md not found",
              level: "error",
              meta: { command: "publish" },
            },
            {
              msg: "Checking if tauri-bundler@0.6.0 is already published with: node -e \"console.log('0.5.2')\"",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "0.5.2",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "Checking if tauri@0.5.2 is already published with: node -e \"console.log('0.5.2')\"",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "0.5.2",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "tauri@0.5.2 is already published. Skipping.",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "Checking if tauri-api@0.5.1 is already published with: node -e \"console.log('0.5.2')\"",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "0.5.2",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "Checking if tauri-utils@0.5.0 is already published with: node -e \"console.log('0.5.2')\"",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "0.5.2",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "tauri-bundler [prepublish]: node -e \"console.log('premode for tauri-bundler')\"",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "premode for tauri-bundler",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "tauri-api [prepublish]: node -e \"console.log('premode for tauri-api')\"",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "premode for tauri-api",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "tauri-utils [prepublish]: node -e \"console.log('premode for tauri-utils')\"",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "premode for tauri-utils",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "tauri.js [publish]: node -e \"console.log('publishing tauri.js')\"",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "publishing tauri.js",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "tauri-bundler [publish]: node -e \"console.log('publishing tauri-bundler')\"",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "publishing tauri-bundler",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "tauri-bundler [publish]: node -e \"console.log('running in ./cli/tauri-bundler')\"",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "running in ./cli/tauri-bundler",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "tauri-bundler [publish run from the cwd]: ls",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "cli\ntauri\ntauri-api\ntauri-updater\ntauri-utils",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "tauri-bundler [publish]: ls",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "Cargo.toml",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "tauri-api [publish]: node -e \"console.log('publishing tauri-api')\"",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "publishing tauri-api",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "tauri-api [publish]: node -e \"console.log('running in ./tauri-api')\"",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "running in ./tauri-api",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "tauri-api [publish run from the cwd]: ls",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "cli\ntauri\ntauri-api\ntauri-updater\ntauri-utils",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "tauri-api [publish]: ls",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "Cargo.toml",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "tauri-utils [publish]: node -e \"console.log('publishing tauri-utils')\"",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "publishing tauri-utils",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "tauri-utils [publish]: node -e \"console.log('running in ./tauri-utils')\"",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "running in ./tauri-utils",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "tauri-utils [publish run from the cwd]: ls",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "cli\ntauri\ntauri-api\ntauri-updater\ntauri-utils",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "tauri-utils [publish]: ls",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "Cargo.toml",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "tauri-bundler [postpublish]: node -e \"console.log('postmode for tauri-bundler')\"",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "postmode for tauri-bundler",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "tauri-api [postpublish]: node -e \"console.log('postmode for tauri-api')\"",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "postmode for tauri-api",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "tauri-utils [postpublish]: node -e \"console.log('postmode for tauri-utils')\"",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "postmode for tauri-utils",
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

    it("runs publish for dart / flutter", function* () {
      const sink = yield* logTest.useCapturedLogger();

      const logger = covectorLogger.operations;
      const fullIntegration = f.copy("integration.dart-flutter-single");
      const covectored = yield* covector({
        logger,
        command: "publish",
        cwd: fullIntegration,
      });

      // to confirm we have reached the end of the logs
      yield* logger.info("completed");
      yield* logTest.consecutive(
          sink.all,
          [
            {
              msg: "CHANGELOG.md not found",
              level: "error",
              meta: { command: "publish" },
            },
            {
              msg: "test_app [publish]: node -e \"console.log('publishing')\"",
              level: "info",
              meta: { command: "publish" },
            },
            {
              msg: "publishing",
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

    it("runs publish for general file", function* () {
      const sink = yield* logTest.useCapturedLogger();

      const logger = covectorLogger.operations;
      const fullIntegration = f.copy("integration.general-file");
      const covectored = yield* covector({
        logger,
        command: "publish",
        cwd: fullIntegration,
      });

      // to confirm we have reached the end of the logs
      yield* logger.info("completed");
      yield* logTest.consecutive(
          sink.all,
          [
            {
              msg: "CHANGELOG.md not found",
              level: "error",
              meta: { command: "version" },
            },
            {
              msg: "general-pkg [publish]: node -e \"console.log('publishing')\"",
              level: "info",
              meta: { command: "version" },
            },
            {
              msg: "publishing",
              level: "info",
              meta: { command: "version" },
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
    });
  });

  describe("failures", () => {
    it("fails status for non-existant package", function* () {
      yield* logTest.useCapturedLogger();

      const logger = covectorLogger.operations;
      const fullIntegration = f.copy("integration.js-with-change-file-error");
      const covectored = yield* captureError(
        covector({
          logger,
          command: "status",
          cwd: fullIntegration,
        }),
      );
      expect(covectored.message).toBe(
        "react listed in .changes/change-file-pkg-non-exists.md does not exist in the .changes/config.json",
      );
    });

    it("fails with error", function* () {
      const sink = yield* logTest.useCapturedLogger();

      const logger = covectorLogger.operations;
      const fullIntegration = f.copy("integration.js-with-publish-error");
      const covectored = yield* captureError(
        covector({
          logger,
          command: "publish",
          cwd: fullIntegration,
        }),
      );
      expect(
        covectored.message.includes("non-zero status (1)") ||
          covectored.message.includes("code: 1"),
      ).toBeTruthy();

      yield* logTest.consecutive(
          sink.all,
          [
            {
              msg: "CHANGELOG.md not found",
              level: "error",
              meta: { command: "test" },
            },
            {
              msg: "tauri.js [publish]: node -e \"throw new Error('boom')\" --no-extra-info-on-fatal-exception",
              level: "info",
              meta: { command: "test" },
            },
            // TODO check boom with command in error
            // {
            //   command: "publish",
            //   err: "Error: boom",
            //   level: "error",
            // },
            // it actually here and the logs (especially on linux) aren't output
            //  consistently enough to check the remaining
          ],
          checksChunksInMsg(),
        );
    }, 10_000);

    it("fails, tries and fails two more times with error", function* () {
      const sink = yield* logTest.useCapturedLogger();

      const logger = covectorLogger.operations;
      const fullIntegration = f.copy(
        "integration.js-with-retrying-publish-error",
      );
      const covectored = yield* captureError(
        covector({
          logger,
          command: "publish",
          cwd: fullIntegration,
        }),
      );

      yield* logTest.consecutive(
          sink.all,
          [
            {
              msg: "CHANGELOG.md not found",
              level: "error",
              meta: { command: "build" },
            },
            {
              msg: "tauri.js [publish]: node -e \"throw new Error('boom')\" --no-extra-info-on-fatal-exception",
              level: "info",
              meta: { command: "build" },
            },
            {
              level: "error",
              meta: { command: "build" },
              msg: [
                "[eval]:1",
                "throw new Error('boom')",
                "Error: boom",
                "node:internal/",
              ] as unknown as string,
            },
            {
              msg: [
                "code: 1",
                "$ node -e throw new Error('boom') --no-extra-info-on-fatal-exception",
              ] as unknown as string,
              level: "error",
              meta: { command: "build" },
            },
            {
              msg: "tauri.js [publish]: node -e \"throw new Error('boom')\" --no-extra-info-on-fatal-exception",
              level: "info",
              meta: { command: "build" },
            },
            {
              level: "error",
              meta: { command: "build" },
              msg: [
                "[eval]:1",
                "throw new Error('boom')",
                "Error: boom",
                "node:internal/",
              ] as unknown as string,
            },
            {
              msg: [
                "code: 1",
                "$ node -e throw new Error('boom') --no-extra-info-on-fatal-exception",
              ] as unknown as string,
              level: "error",
              meta: { command: "build" },
            },
            {
              msg: "tauri.js [publish]: node -e \"throw new Error('boom')\" --no-extra-info-on-fatal-exception",
              level: "info",
              meta: { command: "build" },
            },
            // TODO check boom with command in error
            // {
            //   command: "publish",
            //   err: "Error: boom",
            //   level: "error",
            //   errorNumber: 3,
            // },
            // it actually throws after the third error it hits
            //  and the logs (especially on linux) aren't output
            //  consistently enough to check the remaining
          ],
          checksChunksInMsg(),
        );
      expect(
        covectored.message.includes("non-zero status (1)") ||
          covectored.message.includes("code: 1"),
      ).toBeTruthy();
    });

    it("fails version with errorOnVersionRange", function* () {
      const sink = yield* logTest.useCapturedLogger();

      const logger = covectorLogger.operations;
      const fullIntegration = f.copy("integration.js-and-rust-with-changes");
      const modifyConfig = async (pullConfig: any) => {
        const config = await pullConfig;
        let modified = { ...config };
        modified.pkgManagers.rust.errorOnVersionRange = ">= 0.0.1";
        modified.pkgManagers.javascript.errorOnVersionRange = ">= 0.0.1";
        return modified;
      };
      const covectored = yield* captureError(
        covector({
          logger,
          command: "version",
          cwd: fullIntegration,
          modifyConfig,
        }),
      );
      expect(covectored.message).toBe(
        "tauri will be bumped to 0.6.0. This satisfies the range >= 0.0.1 which the configuration disallows. Please adjust your bump to accommodate the range or otherwise adjust the allowed range in `errorOnVersionRange`.",
      );
    });

    it("fails status with errorOnVersionRange", function* () {
      const sink = yield* logTest.useCapturedLogger();

      const logger = covectorLogger.operations;
      const fullIntegration = f.copy("integration.js-and-rust-with-changes");
      const modifyConfig = async (pullConfig: any) => {
        const config = await pullConfig;
        let modified = { ...config };
        modified.pkgManagers.rust.errorOnVersionRange = ">= 0.0.1";
        modified.pkgManagers.javascript.errorOnVersionRange = ">= 0.0.1";
        return modified;
      };
      const covectored = yield* captureError(
        covector({
          logger,
          command: "status",
          cwd: fullIntegration,
          modifyConfig,
        }),
      );
      expect(covectored.message).toBe(
        "tauri will be bumped to 0.6.0. This satisfies the range >= 0.0.1 which the configuration disallows. Please adjust your bump to accommodate the range or otherwise adjust the allowed range in `errorOnVersionRange`.",
      );
    });
  });

  it("runs test for js and rust", function* () {
    const sink = yield* logTest.useCapturedLogger();

    const logger = covectorLogger.operations;
    const fullIntegration = f.copy("integration.js-and-rust-with-changes");
    const covectored = yield* covector({
      logger,
      command: "test" as keyof Covector,
      cwd: fullIntegration,
    });
 
    // to confirm we have reached the end of the logs
    yield* logger.info("completed");
    yield* logTest.consecutive(
        sink.all,
        [
          // throws errors because a test run
          //  expects a changelog
          {
            msg: "CHANGELOG.md not found",
            level: "error",
            meta: { command: "build" },
          },
          {
            msg: "CHANGELOG.md not found",
            level: "error",
            meta: { command: "build" },
          },
          {
            msg: "CHANGELOG.md not found",
            level: "error",
            meta: { command: "build" },
          },
          {
            msg: "CHANGELOG.md not found",
            level: "error",
            meta: { command: "build" },
          },
          {
            msg: "CHANGELOG.md not found",
            level: "error",
            meta: { command: "build" },
          },
          {
            msg: "CHANGELOG.md not found",
            level: "error",
            meta: { command: "build" },
          },
          {
            msg: "No commands configured to run on [test].",
            level: "info",
            meta: { command: "build" },
          },
          {
            msg: "completed",
            level: "info",
            meta: { command: "build" },
          },
        ],
        checksWithObject(),
      );
    expect(covectored).toMatchSnapshot();
  });

  it("runs build for js and rust", function* () {
    const sink = yield* logTest.useCapturedLogger();

    const logger = covectorLogger.operations;
    const fullIntegration = f.copy("integration.js-and-rust-with-changes");
    const covectored = yield* covector({
      logger,
      command: "build" as keyof Covector,
      cwd: fullIntegration,
    });
 
    // to confirm we have reached the end of the logs
    yield* logger.info("completed");
    yield* logTest.consecutive(
        sink.all,
        [
          // throws errors because a publish
          //  expects a changelog
          {
            msg: "CHANGELOG.md not found",
            level: "error",
            meta: { command: "build" },
          },
          {
            msg: "CHANGELOG.md not found",
            level: "error",
            meta: { command: "build" },
          },
          {
            msg: "CHANGELOG.md not found",
            level: "error",
            meta: { command: "build" },
          },
          {
            msg: "CHANGELOG.md not found",
            level: "error",
            meta: { command: "build" },
          },
          {
            msg: "CHANGELOG.md not found",
            level: "error",
            meta: { command: "build" },
          },
          {
            msg: "CHANGELOG.md not found",
            level: "error",
            meta: { command: "build" },
          },
          {
            msg: "tauri-bundler [build]: node -e \"console.log('the files in the tauri-bundler folder are')\"",
            level: "info",
            meta: { command: "build" },
          },
          {
            msg: "the files in the tauri-bundler folder are",
            level: "info",
            meta: { command: "build" },
          },
          {
            msg: "tauri-bundler [build]: ls",
            level: "info",
            meta: { command: "build" },
          },
          {
            msg: "Cargo.toml",
            level: "info",
            meta: { command: "build" },
          },
          {
            msg: "tauri [build]: node -e \"console.log('the files in the tauri folder are')\"",
            level: "info",
            meta: { command: "build" },
          },
          {
            msg: "the files in the tauri folder are",
            level: "info",
            meta: { command: "build" },
          },
          {
            msg: "tauri [build]: ls",
            level: "info",
            meta: { command: "build" },
          },
          {
            msg: "Cargo.toml",
            level: "info",
            meta: { command: "build" },
          },
          {
            msg: "tauri-api [build]: node -e \"console.log('the files in the tauri-api folder are')\"",
            level: "info",
            meta: { command: "build" },
          },
          {
            msg: "the files in the tauri-api folder are",
            level: "info",
            meta: { command: "build" },
          },
          {
            msg: "tauri-api [build]: ls",
            level: "info",
            meta: { command: "build" },
          },
          {
            msg: "Cargo.toml",
            level: "info",
            meta: { command: "build" },
          },
          {
            msg: "tauri-utils [build]: node -e \"console.log('the files in the tauri-utils folder are')\"",
            level: "info",
            meta: { command: "build" },
          },
          {
            msg: "the files in the tauri-utils folder are",
            level: "info",
            meta: { command: "build" },
          },
          {
            msg: "tauri-utils [build]: ls",
            level: "info",
            meta: { command: "build" },
          },
          {
            msg: "Cargo.toml",
            level: "info",
            meta: { command: "build" },
          },
          {
            msg: "tauri-updater [build]: node -e \"console.log('the files in the tauri-updater folder are')\"",
            level: "info",
            meta: { command: "build" },
          },
          {
            msg: "the files in the tauri-updater folder are",
            level: "info",
            meta: { command: "build" },
          },
          {
            msg: "tauri-updater [build]: ls",
            level: "info",
            meta: { command: "build" },
          },
          {
            msg: "Cargo.toml",
            level: "info",
            meta: { command: "build" },
          },
          {
            msg: "completed",
            level: "info",
            meta: { command: "build" },
          },
        ],
        checksWithObject(),
      );
    expect(covectored).toMatchSnapshot();
  });
});
