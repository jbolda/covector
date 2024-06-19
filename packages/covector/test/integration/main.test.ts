import { covector } from "../../src";
import { CovectorVersion } from "@covector/types";
import { loadFile } from "@covector/files";
import { TomlDocument } from "@covector/toml";
import { captureError, describe, it } from "../../../../helpers/test-scope.ts";
import { expect } from "vitest";
import pino from "pino";
import * as pinoTest from "pino-test";
import { checksChunksInMsg, checksWithObject } from "../helpers.ts";
import path from "path";
import fixtures from "fixturez";
const f = fixtures(__dirname);
import { injectPublishFunctions } from "../../../action/src/utils";

expect.addSnapshotSerializer({
  test: (value) => value instanceof TomlDocument,
  print: (_) => `TomlDocument {}`,
});

describe("integration test in production mode", () => {
  describe("handles config", () => {
    it("passes correct config for js and rust", function* () {
      const stream = pinoTest.sink();
      const logger = pino(stream);
      const fullIntegration = f.copy("integration.js-and-rust-with-changes");
      const covectored = yield covector({
        logger,
        command: "status",
        cwd: fullIntegration,
      });

      // to confirm we have reached the end of the logs
      logger.info("completed");
      yield pinoTest.consecutive(
        stream,
        [
          {
            command: "status",
            msg: "changes:",
            level: 30,
            // TODO check yaml
          },
          {
            command: "status",
            msg: "tauri => minor",
            level: 30,
          },
          {
            command: "status",
            msg: "tauri-updater => patch",
            level: 30,
          },
          {
            command: "status",
            msg: "bumping tauri with minor",
            level: 30,
          },
          {
            command: "status",
            msg: "bumping tauri-updater with patch",
            level: 30,
          },
          {
            command: "status",
            msg: "bumping tauri.js with patch",
            level: 30,
          },
          {
            command: "status",
            msg: "tauri.js planned to be bumped from 0.6.2 to 0.6.3",
            level: 30,
          },
          {
            command: "status",
            msg: "tauri planned to be bumped from 0.5.2 to 0.6.0",
            level: 30,
          },
          {
            command: "status",
            msg: "tauri-updater planned to be bumped from 0.4.2 to 0.4.3",
            level: 30,
          },
          {
            msg: "completed",
            level: 30,
          },
        ],
        checksWithObject()
      );
      expect(covectored).toMatchSnapshot();
    });

    it("allows modifying the config", function* () {
      const stream = pinoTest.sink();
      const logger = pino(stream);
      const fullIntegration = f.copy("integration.js-and-rust-with-changes");
      const modifyConfig = async (pullConfig: any) => {
        const config = await pullConfig;
        return Object.keys(config.pkgManagers).reduce(
          (finalConfig, pkgManager) => {
            finalConfig.pkgManagers[pkgManager] = Object.keys(
              config.pkgManagers[pkgManager]
            ).reduce((pm, p) => {
              if (p.startsWith("publish")) {
                const functionInject = async () => logger.warn("deboop");
                pm[p] = Array.isArray(pm[p])
                  ? pm[p].concat(functionInject)
                  : [pm[p], functionInject];
              } else if (p.startsWith("pre")) {
                const functionInject = async () =>
                  logger.warn("begin with only boops");
                pm[p] = [functionInject];
              } else if (p.startsWith("post")) {
                const functionInject = async () =>
                  logger.warn("ends with overwrites using boops");
                pm[p] = functionInject;
              }
              return pm;
            }, config.pkgManagers[pkgManager]);

            return finalConfig;
          },
          config
        );
      };

      const covectored = yield covector({
        logger,
        command: "publish",
        cwd: fullIntegration,
        modifyConfig,
      });

      // to confirm we have reached the end of the logs
      logger.info("completed");
      yield pinoTest.consecutive(
        stream,
        [
          {
            command: "publish",
            msg: "Checking if tauri-bundler@0.6.0 is already published with: echo 0.5.2",
            level: 30,
          },
          {
            command: "publish",
            msg: "0.5.2",
            level: 30,
          },
          {
            command: "publish",
            msg: "Checking if tauri@0.5.2 is already published with: echo 0.5.2",
            level: 30,
          },
          {
            command: "publish",
            msg: "0.5.2",
            level: 30,
          },
          {
            command: "publish",
            msg: "tauri@0.5.2 is already published. Skipping.",
            level: 30,
          },
          {
            command: "publish",
            msg: "Checking if tauri-api@0.5.1 is already published with: echo 0.5.2",
            level: 30,
          },
          {
            command: "publish",
            msg: "0.5.2",
            level: 30,
          },
          {
            command: "publish",
            msg: "Checking if tauri-utils@0.5.0 is already published with: echo 0.5.2",
            level: 30,
          },
          {
            command: "publish",
            msg: "0.5.2",
            level: 30,
          },
          {
            // this is an injected log from modifying the config
            msg: "begin with only boops",
            level: 40,
          },
          {
            // this is an injected log from modifying the config
            msg: "begin with only boops",
            level: 40,
          },
          {
            // this is an injected log from modifying the config
            msg: "begin with only boops",
            level: 40,
          },
          {
            command: "publish",
            msg: "tauri.js [publish]: echo publishing tauri.js would happen here",
            level: 30,
          },
          {
            command: "publish",
            msg: "publishing tauri.js would happen here",
            level: 30,
          },
          {
            // this is an injected log from modifying the config
            msg: "deboop",
            level: 40,
          },
          {
            command: "publish",
            msg: "tauri-bundler [publish]: echo publishing tauri-bundler would happen here",
            level: 30,
          },
          {
            command: "publish",
            msg: "publishing tauri-bundler would happen here",
            level: 30,
          },
          {
            command: "publish",
            msg: "tauri-bundler [publish]: echo running in ./cli/tauri-bundler",
            level: 30,
          },
          {
            command: "publish",
            msg: "running in ./cli/tauri-bundler",
            level: 30,
          },
          {
            command: "publish",
            msg: "tauri-bundler [publish run from the cwd]: ls",
            level: 30,
          },
          {
            command: "publish",
            msg:
              "cli\n" +
              "tauri\n" +
              "tauri-api\n" +
              "tauri-updater\n" +
              "tauri-utils",
            level: 30,
          },
          {
            command: "publish",
            msg: "tauri-bundler [publish]: ls",
            level: 30,
          },
          {
            command: "publish",
            msg: "Cargo.toml",
            level: 30,
          },
          {
            // this is an injected log from modifying the config
            msg: "deboop",
            level: 40,
          },
          {
            command: "publish",
            msg: "tauri-api [publish]: echo publishing tauri-api would happen here",
            level: 30,
          },
          {
            command: "publish",
            msg: "publishing tauri-api would happen here",
            level: 30,
          },
          {
            command: "publish",
            msg: "tauri-api [publish]: echo running in ./tauri-api",
            level: 30,
          },
          {
            command: "publish",
            msg: "running in ./tauri-api",
            level: 30,
          },
          {
            command: "publish",
            msg: "tauri-api [publish run from the cwd]: ls",
            level: 30,
          },
          {
            command: "publish",
            msg:
              "cli\n" +
              "tauri\n" +
              "tauri-api\n" +
              "tauri-updater\n" +
              "tauri-utils",
            level: 30,
          },
          {
            command: "publish",
            msg: "tauri-api [publish]: ls",
            level: 30,
          },
          {
            command: "publish",
            msg: "Cargo.toml",
            level: 30,
          },
          {
            msg: "deboop",
            level: 40,
          },
          {
            command: "publish",
            msg: "tauri-utils [publish]: echo publishing tauri-utils would happen here",
            level: 30,
          },
          {
            command: "publish",
            msg: "publishing tauri-utils would happen here",
            level: 30,
          },
          {
            command: "publish",
            msg: "tauri-utils [publish]: echo running in ./tauri-utils",
            level: 30,
          },
          {
            command: "publish",
            msg: "running in ./tauri-utils",
            level: 30,
          },
          {
            command: "publish",
            msg: "tauri-utils [publish run from the cwd]: ls",
            level: 30,
          },
          {
            command: "publish",
            msg:
              "cli\n" +
              "tauri\n" +
              "tauri-api\n" +
              "tauri-updater\n" +
              "tauri-utils",
            level: 30,
          },
          {
            command: "publish",
            msg: "tauri-utils [publish]: ls",
            level: 30,
          },
          {
            command: "publish",
            msg: "Cargo.toml",
            level: 30,
          },
          {
            msg: "deboop",
            level: 40,
          },
          {
            msg: "ends with overwrites using boops",
            level: 40,
          },
          {
            msg: "ends with overwrites using boops",
            level: 40,
          },
          {
            msg: "ends with overwrites using boops",
            level: 40,
          },
          {
            msg: "completed",
            level: 30,
          },
        ],
        checksWithObject()
      );
      expect(covectored).toMatchSnapshot();
    });

    it("uses the action config modification", function* () {
      const stream = pinoTest.sink();
      const logger = pino(stream);
      const fullIntegration = f.copy("integration.js-and-rust-with-changes");

      const covectored = yield covector({
        logger,
        command: "publish",
        cwd: fullIntegration,
        modifyConfig: injectPublishFunctions([
          async (pkg: any) =>
            logger.warn(
              `push log into publish for ${pkg.pkg}-v${pkg.pkgFile.version}`
            ),
          async () => logger.warn(`push another log`),
        ]),
      });

      // to confirm we have reached the end of the logs
      logger.info("completed");
      yield pinoTest.consecutive(
        stream,
        [
          {
            command: "publish",
            msg: "Checking if tauri-bundler@0.6.0 is already published with: echo 0.5.2",
            level: 30,
          },
          {
            command: "publish",
            msg: "0.5.2",
            level: 30,
          },
          {
            command: "publish",
            msg: "Checking if tauri@0.5.2 is already published with: echo 0.5.2",
            level: 30,
          },
          {
            command: "publish",
            msg: "0.5.2",
            level: 30,
          },
          {
            command: "publish",
            msg: "tauri@0.5.2 is already published. Skipping.",
            level: 30,
          },
          {
            command: "publish",
            msg: "Checking if tauri-api@0.5.1 is already published with: echo 0.5.2",
            level: 30,
          },
          {
            command: "publish",
            msg: "0.5.2",
            level: 30,
          },
          {
            command: "publish",
            msg: "Checking if tauri-utils@0.5.0 is already published with: echo 0.5.2",
            level: 30,
          },
          {
            command: "publish",
            msg: "0.5.2",
            level: 30,
          },
          {
            command: "publish",
            msg: "tauri-bundler [prepublish]: echo premode for tauri-bundler",
            level: 30,
          },
          {
            command: "publish",
            msg: "premode for tauri-bundler",
            level: 30,
          },
          {
            command: "publish",
            msg: "tauri-api [prepublish]: echo premode for tauri-api",
            level: 30,
          },
          {
            command: "publish",
            msg: "premode for tauri-api",
            level: 30,
          },
          {
            command: "publish",
            msg: "tauri-utils [prepublish]: echo premode for tauri-utils",
            level: 30,
          },
          {
            command: "publish",
            msg: "premode for tauri-utils",
            level: 30,
          },
          {
            command: "publish",
            msg: "tauri.js [publish]: echo publishing tauri.js would happen here",
            level: 30,
          },
          {
            command: "publish",
            msg: "publishing tauri.js would happen here",
            level: 30,
          },
          {
            // this is an injected log from modifying the config
            msg: "push log into publish for tauri.js-v0.6.2",
            level: 40,
          },
          {
            // this is an injected log from modifying the config
            msg: "push another log",
            level: 40,
          },
          {
            command: "publish",
            msg: "tauri-bundler [publish]: echo publishing tauri-bundler would happen here",
            level: 30,
          },
          {
            command: "publish",
            msg: "publishing tauri-bundler would happen here",
            level: 30,
          },
          {
            command: "publish",
            msg: "tauri-bundler [publish]: echo running in ./cli/tauri-bundler",
            level: 30,
          },
          {
            command: "publish",
            msg: "running in ./cli/tauri-bundler",
            level: 30,
          },
          {
            command: "publish",
            msg: "tauri-bundler [publish run from the cwd]: ls",
            level: 30,
          },
          {
            command: "publish",
            msg:
              "cli\n" +
              "tauri\n" +
              "tauri-api\n" +
              "tauri-updater\n" +
              "tauri-utils",
            level: 30,
          },
          {
            command: "publish",
            msg: "tauri-bundler [publish]: ls",
            level: 30,
          },
          {
            command: "publish",
            msg: "Cargo.toml",
            level: 30,
          },
          {
            // this is an injected log from modifying the config
            msg: "push log into publish for tauri-bundler-v0.6.0",
            level: 40,
          },
          {
            // this is an injected log from modifying the config
            msg: "push another log",
            level: 40,
          },
          {
            command: "publish",
            msg: "tauri-api [publish]: echo publishing tauri-api would happen here",
            level: 30,
          },
          {
            command: "publish",
            msg: "publishing tauri-api would happen here",
            level: 30,
          },
          {
            command: "publish",
            msg: "tauri-api [publish]: echo running in ./tauri-api",
            level: 30,
          },
          {
            command: "publish",
            msg: "running in ./tauri-api",
            level: 30,
          },
          {
            command: "publish",
            msg: "tauri-api [publish run from the cwd]: ls",
            level: 30,
          },
          {
            command: "publish",
            msg:
              "cli\n" +
              "tauri\n" +
              "tauri-api\n" +
              "tauri-updater\n" +
              "tauri-utils",
            level: 30,
          },
          {
            command: "publish",
            msg: "tauri-api [publish]: ls",
            level: 30,
          },
          {
            command: "publish",
            msg: "Cargo.toml",
            level: 30,
          },
          {
            // this is an injected log from modifying the config
            msg: "push log into publish for tauri-api-v0.5.1",
            level: 40,
          },
          {
            // this is an injected log from modifying the config
            msg: "push another log",
            level: 40,
          },
          {
            command: "publish",
            msg: "tauri-utils [publish]: echo publishing tauri-utils would happen here",
            level: 30,
          },
          {
            command: "publish",
            msg: "publishing tauri-utils would happen here",
            level: 30,
          },
          {
            command: "publish",
            msg: "tauri-utils [publish]: echo running in ./tauri-utils",
            level: 30,
          },
          {
            command: "publish",
            msg: "running in ./tauri-utils",
            level: 30,
          },
          {
            command: "publish",
            msg: "tauri-utils [publish run from the cwd]: ls",
            level: 30,
          },
          {
            command: "publish",
            msg:
              "cli\n" +
              "tauri\n" +
              "tauri-api\n" +
              "tauri-updater\n" +
              "tauri-utils",
            level: 30,
          },
          {
            command: "publish",
            msg: "tauri-utils [publish]: ls",
            level: 30,
          },
          {
            command: "publish",
            msg: "Cargo.toml",
            level: 30,
          },
          {
            // this is an injected log from modifying the config
            msg: "push log into publish for tauri-utils-v0.5.0",
            level: 40,
          },
          {
            // this is an injected log from modifying the config
            msg: "push another log",
            level: 40,
          },
          {
            command: "publish",
            msg: "tauri-bundler [postpublish]: echo postmode for tauri-bundler",
            level: 30,
          },
          {
            command: "publish",
            msg: "postmode for tauri-bundler",
            level: 30,
          },
          {
            command: "publish",
            msg: "tauri-api [postpublish]: echo postmode for tauri-api",
            level: 30,
          },
          {
            command: "publish",
            msg: "postmode for tauri-api",
            level: 30,
          },
          {
            command: "publish",
            msg: "tauri-utils [postpublish]: echo postmode for tauri-utils",
            level: 30,
          },
          {
            command: "publish",
            msg: "postmode for tauri-utils",
            level: 30,
          },
          {
            msg: "completed",
            level: 30,
          },
        ],
        checksWithObject()
      );
      expect(covectored).toMatchSnapshot();
    });
  });

  describe("version", () => {
    it("runs version for js and rust", function* () {
      const stream = pinoTest.sink();
      const logger = pino(stream);
      const fullIntegration = f.copy("integration.js-and-rust-with-changes");
      const covectored = (yield covector({
        logger,
        command: "version",
        cwd: fullIntegration,
      })) as CovectorVersion;
      if (typeof covectored !== "object")
        throw new Error("We are expecting an object here.");

      // to confirm we have reached the end of the logs
      logger.info("completed");
      yield pinoTest.consecutive(
        stream,
        [
          {
            command: "version",
            msg: "bumping tauri with minor",
            level: 30,
          },
          {
            command: "version",
            msg: "bumping tauri-updater with patch",
            level: 30,
          },
          {
            command: "version",
            msg: "bumping tauri.js with patch",
            level: 30,
          },
          {
            command: "version",
            msg: "Could not load the CHANGELOG.md. Creating one.",
            level: 30,
          },
          {
            command: "version",
            msg: "Could not load the CHANGELOG.md. Creating one.",
            level: 30,
          },
          {
            command: "version",
            msg: "Could not load the CHANGELOG.md. Creating one.",
            level: 30,
          },
          {
            command: "version",
            msg: ".changes/first-change.md was deleted",
            level: 30,
          },
          {
            command: "version",
            msg: ".changes/second-change.md was deleted",
            level: 30,
          },
          {
            msg: "completed",
            level: 30,
          },
        ],
        checksWithObject()
      );
      expect(covectored).toMatchSnapshot();

      const changelogTauriCore = yield loadFile(
        path.join("/tauri/", "CHANGELOG.md"),
        fullIntegration
      );
      expect(changelogTauriCore.content).toBe(
        "# Changelog\n\n" +
          "## \\[0.6.0]\n\n" +
          "- Summary about the changes in tauri\n"
      );

      const changelogTaurijs = yield loadFile(
        path.join("/cli/tauri.js/", "CHANGELOG.md"),
        fullIntegration
      );
      expect(changelogTaurijs.content).toBe(
        "# Changelog\n\n" +
          "## \\[0.6.3]\n\n" +
          "### Dependencies\n\n" +
          "- Upgraded to `tauri@0.6.0`\n"
      );
    });

    it("runs version for dart / flutter single", function* () {
      const stream = pinoTest.sink();
      const logger = pino(stream);
      const fullIntegration = f.copy("integration.dart-flutter-single");
      const covectored = (yield covector({
        logger,
        command: "version",
        cwd: fullIntegration,
      })) as CovectorVersion;
      if (typeof covectored !== "object")
        throw new Error("We are expecting an object here.");

      // to confirm we have reached the end of the logs
      logger.info("completed");
      yield pinoTest.consecutive(
        stream,
        [
          {
            command: "version",
            msg: "bumping test_app with minor",
            level: 30,
          },
          {
            command: "version",
            msg: "Could not load the CHANGELOG.md. Creating one.",
            level: 30,
          },
          {
            command: "version",
            msg: ".changes/first-change.md was deleted",
            level: 30,
          },
          {
            command: "version",
            msg: ".changes/second-change.md was deleted",
            level: 30,
          },
          {
            msg: "completed",
            level: 30,
          },
        ],
        checksWithObject()
      );

      expect(covectored).toMatchSnapshot();

      const changelog = yield loadFile("CHANGELOG.md", fullIntegration);
      expect(changelog.content).toBe(
        "# Changelog\n\n" +
          "## \\[0.4.0]\n\n" +
          "- Summary about the changes in test_app\n" +
          "- Summary about the changes again(!) in test_app\n"
      );

      const versionFile = yield loadFile("pubspec.yaml", fullIntegration);
      expect(versionFile.content).toEqual(
        expect.stringContaining("version: 0.4.0\n")
      );
    });

    it("runs version for dart / flutter multi", function* () {
      const stream = pinoTest.sink();
      const logger = pino(stream);
      const fullIntegration = f.copy("integration.dart-flutter-multi");
      const covectored = (yield covector({
        logger,
        command: "version",
        cwd: fullIntegration,
      })) as CovectorVersion;
      if (typeof covectored !== "object")
        throw new Error("We are expecting an object here.");

      // to confirm we have reached the end of the logs
      logger.info("completed");
      yield pinoTest.consecutive(
        stream,
        [
          {
            command: "version",
            msg: "bumping test_app_two with minor",
            level: 30,
          },
          {
            command: "version",
            msg: "bumping test_app_three with patch",
            level: 30,
          },
          {
            command: "version",
            msg: "bumping test_app_one with patch",
            level: 30,
          },
          {
            command: "version",
            msg: "Could not load the CHANGELOG.md. Creating one.",
            level: 30,
          },
          {
            command: "version",
            msg: "Could not load the CHANGELOG.md. Creating one.",
            level: 30,
          },
          {
            command: "version",
            msg: "Could not load the CHANGELOG.md. Creating one.",
            level: 30,
          },
          {
            command: "version",
            msg: ".changes/first-change.md was deleted",
            level: 30,
          },
          {
            command: "version",
            msg: ".changes/second-change.md was deleted",
            level: 30,
          },
          {
            msg: "completed",
            level: 30,
          },
        ],
        checksWithObject()
      );
      expect(covectored).toMatchSnapshot();

      const changelog = yield loadFile(
        path.join("dart", "CHANGELOG.md"),
        fullIntegration
      );
      expect(changelog.content).toBe(
        "# Changelog\n\n" +
          "## \\[0.3.2]\n\n" +
          "### Dependencies\n\n" +
          "- Upgraded to `test_app_two@0.2.0`\n" +
          "- Upgraded to `test_app_three@3.8.98`\n"
      );

      const versionFile = yield loadFile(
        path.join("dart", "pubspec.yaml"),
        fullIntegration
      );
      expect(versionFile.content).toEqual(
        expect.stringContaining("version: 0.3.2\n")
      );
    });

    it("runs version for general file", function* () {
      const stream = pinoTest.sink();
      const logger = pino(stream);
      const fullIntegration = f.copy("integration.general-file");
      const covectored = (yield covector({
        logger,
        command: "version",
        cwd: fullIntegration,
      })) as CovectorVersion;
      if (typeof covectored !== "object")
        throw new Error("We are expecting an object here.");

      // to confirm we have reached the end of the logs
      logger.info("completed");
      yield pinoTest.consecutive(
        stream,
        [
          {
            command: "version",
            msg: "bumping general-pkg with minor",
            level: 30,
          },
          {
            command: "version",
            msg: "Could not load the CHANGELOG.md. Creating one.",
            level: 30,
          },
          {
            command: "version",
            msg: ".changes/first-change.md was deleted",
            level: 30,
          },
          {
            command: "version",
            msg: ".changes/second-change.md was deleted",
            level: 30,
          },
          {
            msg: "completed",
            level: 30,
          },
        ],
        checksWithObject()
      );
      expect(covectored).toMatchSnapshot();

      const changelog = yield loadFile("CHANGELOG.md", fullIntegration);
      expect(changelog.content).toBe(
        "# Changelog\n\n" +
          "## \\[6.2.0]\n\n" +
          "- Summary about the changes in general-pkg\n" +
          "- A general summary about the generally changes in general-pkg generally\n"
      );

      const versionFile = yield loadFile("VERSION", fullIntegration);
      expect(versionFile.content).toBe("6.2.0");
    });
  });

  describe("publish", () => {
    it("runs publish for js and rust", function* () {
      const stream = pinoTest.sink();
      const logger = pino(stream);
      const fullIntegration = f.copy("integration.js-and-rust-with-changes");
      const covectored = yield covector({
        logger,
        command: "publish",
        cwd: fullIntegration,
      });

      // to confirm we have reached the end of the logs
      logger.info("completed");
      yield pinoTest.consecutive(
        stream,
        [
          {
            command: "publish",
            msg: "Checking if tauri-bundler@0.6.0 is already published with: echo 0.5.2",
            level: 30,
          },
          {
            command: "publish",
            msg: "0.5.2",
            level: 30,
          },
          {
            command: "publish",
            msg: "Checking if tauri@0.5.2 is already published with: echo 0.5.2",
            level: 30,
          },
          {
            command: "publish",
            msg: "0.5.2",
            level: 30,
          },
          {
            command: "publish",
            msg: "tauri@0.5.2 is already published. Skipping.",
            level: 30,
          },
          {
            command: "publish",
            msg: "Checking if tauri-api@0.5.1 is already published with: echo 0.5.2",
            level: 30,
          },
          {
            command: "publish",
            msg: "0.5.2",
            level: 30,
          },
          {
            command: "publish",
            msg: "Checking if tauri-utils@0.5.0 is already published with: echo 0.5.2",
            level: 30,
          },
          {
            command: "publish",
            msg: "0.5.2",
            level: 30,
          },
          {
            command: "publish",
            msg: "tauri-bundler [prepublish]: echo premode for tauri-bundler",
            level: 30,
          },
          {
            command: "publish",
            msg: "premode for tauri-bundler",
            level: 30,
          },
          {
            command: "publish",
            msg: "tauri-api [prepublish]: echo premode for tauri-api",
            level: 30,
          },
          {
            command: "publish",
            msg: "premode for tauri-api",
            level: 30,
          },
          {
            command: "publish",
            msg: "tauri-utils [prepublish]: echo premode for tauri-utils",
            level: 30,
          },
          {
            command: "publish",
            msg: "premode for tauri-utils",
            level: 30,
          },
          {
            command: "publish",
            msg: "tauri.js [publish]: echo publishing tauri.js would happen here",
            level: 30,
          },
          {
            command: "publish",
            msg: "publishing tauri.js would happen here",
            level: 30,
          },
          {
            command: "publish",
            msg: "tauri-bundler [publish]: echo publishing tauri-bundler would happen here",
            level: 30,
          },
          {
            command: "publish",
            msg: "publishing tauri-bundler would happen here",
            level: 30,
          },
          {
            command: "publish",
            msg: "tauri-bundler [publish]: echo running in ./cli/tauri-bundler",
            level: 30,
          },
          {
            command: "publish",
            msg: "running in ./cli/tauri-bundler",
            level: 30,
          },
          {
            command: "publish",
            msg: "tauri-bundler [publish run from the cwd]: ls",
            level: 30,
          },
          {
            command: "publish",
            msg:
              "cli\n" +
              "tauri\n" +
              "tauri-api\n" +
              "tauri-updater\n" +
              "tauri-utils",
            level: 30,
          },
          {
            command: "publish",
            msg: "tauri-bundler [publish]: ls",
            level: 30,
          },
          {
            command: "publish",
            msg: "Cargo.toml",
            level: 30,
          },
          {
            command: "publish",
            msg: "tauri-api [publish]: echo publishing tauri-api would happen here",
            level: 30,
          },
          {
            command: "publish",
            msg: "publishing tauri-api would happen here",
            level: 30,
          },
          {
            command: "publish",
            msg: "tauri-api [publish]: echo running in ./tauri-api",
            level: 30,
          },
          {
            command: "publish",
            msg: "running in ./tauri-api",
            level: 30,
          },
          {
            command: "publish",
            msg: "tauri-api [publish run from the cwd]: ls",
            level: 30,
          },
          {
            command: "publish",
            msg:
              "cli\n" +
              "tauri\n" +
              "tauri-api\n" +
              "tauri-updater\n" +
              "tauri-utils",
            level: 30,
          },
          {
            command: "publish",
            msg: "tauri-api [publish]: ls",
            level: 30,
          },
          {
            command: "publish",
            msg: "Cargo.toml",
            level: 30,
          },
          {
            command: "publish",
            msg: "tauri-utils [publish]: echo publishing tauri-utils would happen here",
            level: 30,
          },
          {
            command: "publish",
            msg: "publishing tauri-utils would happen here",
            level: 30,
          },
          {
            command: "publish",
            msg: "tauri-utils [publish]: echo running in ./tauri-utils",
            level: 30,
          },
          {
            command: "publish",
            msg: "running in ./tauri-utils",
            level: 30,
          },
          {
            command: "publish",
            msg: "tauri-utils [publish run from the cwd]: ls",
            level: 30,
          },
          {
            command: "publish",
            msg:
              "cli\n" +
              "tauri\n" +
              "tauri-api\n" +
              "tauri-updater\n" +
              "tauri-utils",
            level: 30,
          },
          {
            command: "publish",
            msg: "tauri-utils [publish]: ls",
            level: 30,
          },
          {
            command: "publish",
            msg: "Cargo.toml",
            level: 30,
          },
          {
            command: "publish",
            msg: "tauri-bundler [postpublish]: echo postmode for tauri-bundler",
            level: 30,
          },
          {
            command: "publish",
            msg: "postmode for tauri-bundler",
            level: 30,
          },
          {
            command: "publish",
            msg: "tauri-api [postpublish]: echo postmode for tauri-api",
            level: 30,
          },
          {
            command: "publish",
            msg: "postmode for tauri-api",
            level: 30,
          },
          {
            command: "publish",
            msg: "tauri-utils [postpublish]: echo postmode for tauri-utils",
            level: 30,
          },
          {
            command: "publish",
            msg: "postmode for tauri-utils",
            level: 30,
          },
          {
            msg: "completed",
            level: 30,
          },
        ],
        checksWithObject()
      );
      expect(covectored).toMatchSnapshot();
    });

    it("runs publish for dart / flutter", function* () {
      const stream = pinoTest.sink();
      const logger = pino(stream);
      const fullIntegration = f.copy("integration.dart-flutter-single");
      const covectored = yield covector({
        logger,
        command: "publish",
        cwd: fullIntegration,
      });

      // to confirm we have reached the end of the logs
      logger.info("completed");
      yield pinoTest.consecutive(
        stream,
        [
          {
            command: "publish",
            msg: "test_app [publish]: echo publishing",
            level: 30,
          },
          {
            command: "publish",
            msg: "publishing",
            level: 30,
          },
          {
            msg: "completed",
            level: 30,
          },
        ],
        checksWithObject()
      );
      expect(covectored).toMatchSnapshot();
    });

    it("runs publish for general file", function* () {
      const stream = pinoTest.sink();
      const logger = pino(stream);
      const fullIntegration = f.copy("integration.general-file");
      const covectored = yield covector({
        logger,
        command: "publish",
        cwd: fullIntegration,
      });

      // to confirm we have reached the end of the logs
      logger.info("completed");
      yield pinoTest.consecutive(
        stream,
        [
          {
            command: "publish",
            msg: "general-pkg [publish]: echo publishing",
            level: 30,
          },
          {
            command: "publish",
            msg: "publishing",
            level: 30,
          },
          {
            msg: "completed",
            level: 30,
          },
        ],
        checksWithObject()
      );
      expect(covectored).toMatchSnapshot();
    });
  });

  describe("failures", () => {
    it("fails status for non-existant package", function* () {
      const stream = pinoTest.sink();
      const logger = pino(stream);
      const fullIntegration = f.copy("integration.js-with-change-file-error");
      const covectored = yield captureError(
        covector({
          logger,
          command: "status",
          cwd: fullIntegration,
        })
      );
      expect(covectored.message).toBe(
        "react listed in .changes/change-file-pkg-non-exists.md does not exist in the .changes/config.json"
      );
    });

    it("fails with error", function* () {
      const stream = pinoTest.sink();
      const logger = pino(stream);
      const fullIntegration = f.copy("integration.js-with-publish-error");
      const covectored = yield captureError(
        covector({
          logger,
          command: "publish",
          cwd: fullIntegration,
        })
      );

      logger.info("completed");
      yield pinoTest.consecutive(
        stream,
        [
          {
            command: "publish",
            msg: "tauri.js [publish]: node -e \"throw new Error('boom')\"",
            level: 30,
          },
          {
            command: "publish",
            err: "Error: boom",
            level: 50,
          },
          {
            msg: "completed",
            level: 30,
          },
        ],
        checksChunksInMsg()
      );
      expect(covectored.message).toContain("code: 1");
    });

    it("fails, tries and fails two more times with error", function* () {
      const stream = pinoTest.sink();
      const logger = pino(stream);
      const fullIntegration = f.copy(
        "integration.js-with-retrying-publish-error"
      );
      const covectored = yield captureError(
        covector({
          logger,
          command: "publish",
          cwd: fullIntegration,
        })
      );

      logger.info("completed");
      yield pinoTest.consecutive(
        stream,
        [
          {
            command: "publish",
            msg: "tauri.js [publish]: node -e \"throw new Error('boom')\"",
            level: 30,
          },
          {
            command: "publish",
            err: "Error: boom",
            level: 50,
          },
          {
            command: "publish",
            err: "code: 1",
            level: 50,
          },
          {
            command: "publish",
            msg: "tauri.js [publish]: node -e \"throw new Error('boom')\"",
            level: 30,
          },
          {
            command: "publish",
            err: "Error: boom",
            level: 50,
          },
          {
            command: "publish",
            err: "code: 1",
            level: 50,
          },
          {
            command: "publish",
            msg: "tauri.js [publish]: node -e \"throw new Error('boom')\"",
            level: 30,
          },
          {
            command: "publish",
            err: "Error: boom",
            level: 50,
          },
          // it actually throws after the third error it hits
          {
            msg: "completed",
            level: 30,
          },
        ],
        checksChunksInMsg()
      );
      expect(covectored.message).toContain("code: 1");
    });

    it("fails version with errorOnVersionRange", function* () {
      const stream = pinoTest.sink();
      const logger = pino(stream);
      const fullIntegration = f.copy("integration.js-and-rust-with-changes");
      const modifyConfig = async (pullConfig: any) => {
        const config = await pullConfig;
        let modified = { ...config };
        modified.pkgManagers.rust.errorOnVersionRange = ">= 0.0.1";
        modified.pkgManagers.javascript.errorOnVersionRange = ">= 0.0.1";
        return modified;
      };
      const covectored = yield captureError(
        covector({
          logger,
          command: "version",
          cwd: fullIntegration,
          modifyConfig,
        })
      );
      expect(covectored.message).toBe(
        "tauri will be bumped to 0.6.0. This satisfies the range >= 0.0.1 which the configuration disallows. Please adjust your bump to accommodate the range or otherwise adjust the allowed range in `errorOnVersionRange`."
      );
      expect(covectored).toMatchSnapshot();
    });

    it("fails status with errorOnVersionRange", function* () {
      const stream = pinoTest.sink();
      const logger = pino(stream);
      const fullIntegration = f.copy("integration.js-and-rust-with-changes");
      const modifyConfig = async (pullConfig: any) => {
        const config = await pullConfig;
        let modified = { ...config };
        modified.pkgManagers.rust.errorOnVersionRange = ">= 0.0.1";
        modified.pkgManagers.javascript.errorOnVersionRange = ">= 0.0.1";
        return modified;
      };
      const covectored = yield captureError(
        covector({
          logger,
          command: "status",
          cwd: fullIntegration,
          modifyConfig,
        })
      );
      expect(covectored.message).toBe(
        "tauri.js will be bumped to 0.6.3. This satisfies the range >= 0.0.1 which the configuration disallows. Please adjust your bump to accommodate the range or otherwise adjust the allowed range in `errorOnVersionRange`."
      );
      expect(covectored).toMatchSnapshot();
    });
  });

  it("runs test for js and rust", function* () {
    const stream = pinoTest.sink();
    const logger = pino(stream);
    const fullIntegration = f.copy("integration.js-and-rust-with-changes");
    const covectored = yield covector({
      logger,
      command: "test",
      cwd: fullIntegration,
    });

    // to confirm we have reached the end of the logs
    logger.info("completed");
    yield pinoTest.consecutive(
      stream,
      [
        {
          command: "arbitrary",
          msg: "No commands configured to run on [test].",
          level: 30,
        },
        {
          msg: "completed",
          level: 30,
        },
      ],
      checksWithObject()
    );
    expect(covectored).toMatchSnapshot();
  });

  it("runs build for js and rust", function* () {
    const stream = pinoTest.sink();
    const logger = pino(stream);
    const fullIntegration = f.copy("integration.js-and-rust-with-changes");
    const covectored = yield covector({
      logger,
      command: "build",
      cwd: fullIntegration,
    });

    // to confirm we have reached the end of the logs
    logger.info("completed");
    yield pinoTest.consecutive(
      stream,
      [
        {
          command: "arbitrary",
          msg: "tauri-bundler [build]: echo the files in the tauri-bundler folder are",
          level: 30,
        },
        {
          command: "arbitrary",
          msg: "the files in the tauri-bundler folder are",
          level: 30,
        },
        {
          command: "arbitrary",
          msg: "tauri-bundler [build]: ls",
          level: 30,
        },
        {
          command: "arbitrary",
          msg: "Cargo.toml",
          level: 30,
        },
        {
          command: "arbitrary",
          msg: "tauri [build]: echo the files in the tauri folder are",
          level: 30,
        },
        {
          command: "arbitrary",
          msg: "the files in the tauri folder are",
          level: 30,
        },
        {
          command: "arbitrary",
          msg: "tauri [build]: ls",
          level: 30,
        },
        {
          command: "arbitrary",
          msg: "Cargo.toml",
          level: 30,
        },
        {
          command: "arbitrary",
          msg: "tauri-api [build]: echo the files in the tauri-api folder are",
          level: 30,
        },
        {
          command: "arbitrary",
          msg: "the files in the tauri-api folder are",
          level: 30,
        },
        {
          command: "arbitrary",
          msg: "tauri-api [build]: ls",
          level: 30,
        },
        {
          command: "arbitrary",
          msg: "Cargo.toml",
          level: 30,
        },
        {
          command: "arbitrary",
          msg: "tauri-utils [build]: echo the files in the tauri-utils folder are",
          level: 30,
        },
        {
          command: "arbitrary",
          msg: "the files in the tauri-utils folder are",
          level: 30,
        },
        {
          command: "arbitrary",
          msg: "tauri-utils [build]: ls",
          level: 30,
        },
        {
          command: "arbitrary",
          msg: "Cargo.toml",
          level: 30,
        },
        {
          command: "arbitrary",
          msg: "tauri-updater [build]: echo the files in the tauri-updater folder are",
          level: 30,
        },
        {
          command: "arbitrary",
          msg: "the files in the tauri-updater folder are",
          level: 30,
        },
        {
          command: "arbitrary",
          msg: "tauri-updater [build]: ls",
          level: 30,
        },
        {
          command: "arbitrary",
          msg: "Cargo.toml",
          level: 30,
        },
        {
          msg: "completed",
          level: 30,
        },
      ],
      checksWithObject()
    );
    expect(covectored).toMatchSnapshot();
  });
});
