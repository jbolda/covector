import { covector } from "../../src/index.js";
import { logger as covectorLogger, logger } from "../../src/logger.ts";
import { TomlDocument } from "@covector/toml";
import { loadFile } from "@covector/files";
import { captureError, describe, it } from "../../../../helpers/test-scope.ts";
import { expect } from "vitest";
import type { Covector } from "@covector/types";
import { checksWithObject } from "../helpers.ts";
import * as logTest from "../../../../helpers/test-logger.ts";
import path from "path";
// @ts-expect-error has no types
import fixtures from "fixturez";


const f = fixtures(__dirname);


expect.addSnapshotSerializer({
  test: (value) => value instanceof TomlDocument,
  print: (_) => `TomlDocument {}`,
});

describe("integration test in --dry-run mode", () => {
  it("passes correct config for js and rust", function* () {
    const log = yield* logTest.createCapturedLogger()
yield* logger.around(log.around, {at: 'min'})

    const fullIntegration = f.copy("integration.js-and-rust-with-changes");
    const covectored = yield* covector({
      logger: logger.operations,
      command: "status",
      cwd: fullIntegration,
      dryRun: true,
    });

    // to confirm we have reached the end of the logs
    yield* logger.operations.info("completed");
    yield* logTest.consecutive(
        log.sink.all,
        [
          {
            msg: "changes:",
            level: "info",
            meta: { command: "status" },
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
            msg: "==== data piped into commands ===",
            level: "info",
            meta: { command: "status" },
            // TODO check render
          },
          {
            msg: "==== data piped into commands ===",
            level: "info",
            meta: { command: "status" },
            // TODO check render
          },
          {
            msg: "==== data piped into commands ===",
            level: "info",
            meta: { command: "status" },
            // TODO check render
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
        checksWithObject()
      );
    expect(covectored).toMatchSnapshot();
  });

  it("runs version for js and rust", function* () {
    const log = yield* logTest.createCapturedLogger();
yield* logger.around(log.around, {at: 'min'})

    const fullIntegration = f.copy("integration.js-and-rust-with-changes");
    const covectored = yield* covector({
      logger: logger.operations,
      command: "version",
      cwd: fullIntegration,
      dryRun: true,
    });

    // to confirm we have reached the end of the logs
    yield* logger.operations.info("completed");
    yield* logTest.consecutive(
        log.sink.all,
        [
          {
            msg: "==== data piped into commands ===",
            level: "info",
            meta: { command: "version" },
            renderAsYAML: {},
          },
          {
            msg: "==== data piped into commands ===",
            level: "info",
            meta: { command: "version" },
            renderAsYAML: {},
          },
          {
            msg: "==== data piped into commands ===",
            level: "info",
            meta: { command: "version" },
            renderAsYAML: {},
          },
          {
            msg: "==== commands ready to run ===",
            level: "info",
            meta: { command: "version" },
            renderAsYAML: {},
          },
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
            msg: "tauri.js planned to be bumped from 0.6.2 to 0.6.3",
            level: "info",
            meta: { command: "version" },
          },
          {
            msg: "tauri planned to be bumped from 0.5.2 to 0.6.0",
            level: "info",
            meta: { command: "version" },
          },
          {
            msg: "tauri-updater planned to be bumped from 0.4.2 to 0.4.3",
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
        checksWithObject()
      );

    if (typeof covectored !== "object")
      throw new Error("We are expecting an object here.");
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

  it("runs publish for js and rust", function* () {
    const log = yield* logTest.createCapturedLogger();
    yield* logger.around(log.around, {at: 'min'})

    const fullIntegration = f.copy("integration.js-and-rust-with-changes");
    const covectored = yield* covector({
      logger: logger.operations,
      command: "publish",
      cwd: fullIntegration,
      dryRun: true,
    });

    // to confirm we have reached the end of the logs
    yield* logger.operations.info("completed");
    yield* logTest.consecutive(
        log.sink.all,
        [
          // throws errors because a publish
          //  expects a changelog
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
            msg: "dryRun >> tauri-bundler [prepublish]: node -e \"console.log('premode for tauri-bundler')\"",
            level: "info",
            meta: { command: "publish" },
          },
          {
            msg: "dryRun >> tauri-api [prepublish]: node -e \"console.log('premode for tauri-api')\"",
            level: "info",
            meta: { command: "publish" },
          },
          {
            msg: "dryRun >> tauri-utils [prepublish]: node -e \"console.log('premode for tauri-utils')\"",
            level: "info",
            meta: { command: "publish" },
          },
          {
            msg: "dryRun >> tauri.js [publish]: node -e \"console.log('publishing tauri.js')\"",
            level: "info",
            meta: { command: "publish" },
          },
          {
            msg: "dryRun >> tauri-bundler [publish]: node -e \"console.log('publishing tauri-bundler')\"",
            level: "info",
            meta: { command: "publish" },
          },
          {
            msg: "dryRun >> tauri-bundler [publish]: node -e \"console.log('running in ./cli/tauri-bundler')\"",
            level: "info",
            meta: { command: "publish" },
          },
          {
            msg: "dryRun >> tauri-bundler [publish run from the cwd]: ls",
            level: "info",
            meta: { command: "publish" },
          },
          {
            msg: "dryRun >> tauri-bundler [publish]: ls",
            level: "info",
            meta: { command: "publish" },
          },
          {
            msg: "dryRun >> tauri-api [publish]: node -e \"console.log('publishing tauri-api')\"",
            level: "info",
            meta: { command: "publish" },
          },
          {
            msg: "dryRun >> tauri-api [publish]: node -e \"console.log('running in ./tauri-api')\"",
            level: "info",
            meta: { command: "publish" },
          },
          {
            msg: "dryRun >> tauri-api [publish run from the cwd]: ls",
            level: "info",
            meta: { command: "publish" },
          },
          {
            msg: "dryRun >> tauri-api [publish]: ls",
            level: "info",
            meta: { command: "publish" },
          },
          {
            msg: "dryRun >> tauri-utils [publish]: node -e \"console.log('publishing tauri-utils')\"",
            level: "info",
            meta: { command: "publish" },
          },
          {
            msg: "dryRun >> tauri-utils [publish]: node -e \"console.log('running in ./tauri-utils')\"",
            level: "info",
            meta: { command: "publish" },
          },
          {
            msg: "dryRun >> tauri-utils [publish run from the cwd]: ls",
            level: "info",
            meta: { command: "publish" },
          },
          {
            msg: "dryRun >> tauri-utils [publish]: ls",
            level: "info",
            meta: { command: "publish" },
          },
          {
            msg: "dryRun >> tauri-bundler [postpublish]: node -e \"console.log('postmode for tauri-bundler')\"",
            level: "info",
            meta: { command: "publish" },
          },
          {
            msg: "dryRun >> tauri-api [postpublish]: node -e \"console.log('postmode for tauri-api')\"",
            level: "info",
            meta: { command: "publish" },
          },
          {
            msg: "dryRun >> tauri-utils [postpublish]: node -e \"console.log('postmode for tauri-utils')\"",
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
        checksWithObject()
      );
    expect(covectored).toMatchSnapshot();
  });

  it("runs test for js and rust", function* () {
    const log = yield* logTest.createCapturedLogger();
    yield* logger.around(log.around, {at: 'min'})

    const fullIntegration = f.copy("integration.js-and-rust-with-changes");
    const covectored = yield* covector({
      logger: logger.operations,
        command: "test" as keyof Covector,
      cwd: fullIntegration,
      dryRun: true,
    });

    // to confirm we have reached the end of the logs
    yield* logger.operations.info("completed");
    yield* logTest.consecutive(
        log.sink.all,
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
            msg: "==== commands ready to run ===",
            level: "info",
            meta: { command: "build" },
            renderAsYAML: {},
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
        checksWithObject()
      );
    expect(covectored).toMatchSnapshot();
  });

  it("runs build for js and rust", function* () {
    const log = yield* logTest.createCapturedLogger();
    yield* logger.around(log.around, {at: 'min'});

    const fullIntegration = f.copy("integration.js-and-rust-with-changes");
    const covectored = yield* covector({
      logger: logger.operations,
        command: "build" as keyof Covector,
      cwd: fullIntegration,
      dryRun: true,
    });

    // to confirm we have reached the end of the logs
    yield* logger.operations.info("completed");
    yield* logTest.consecutive(
        log.sink.all,
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
            msg: "==== data piped into commands ===",
            level: "info",
            meta: { command: "build" },
            renderAsYAML: {},
          },
          {
            msg: "==== data piped into commands ===",
            level: "info",
            meta: { command: "build" },
            renderAsYAML: {},
          },
          {
            msg: "==== data piped into commands ===",
            level: "info",
            meta: { command: "build" },
            renderAsYAML: {},
          },
          {
            msg: "==== data piped into commands ===",
            level: "info",
            meta: { command: "build" },
            renderAsYAML: {},
          },
          {
            msg: "==== data piped into commands ===",
            level: "info",
            meta: { command: "build" },
            renderAsYAML: {},
          },
          {
            msg: "==== commands ready to run ===",
            level: "info",
            meta: { command: "build" },
            renderAsYAML: {},
          },
          {
            msg: "dryRun >> tauri-bundler [build]: node -e \"console.log('the files in the tauri-bundler folder are')\"",
            level: "info",
            meta: { command: "build" },
          },
          {
            msg: "dryRun >> tauri-bundler [build]: ls",
            level: "info",
            meta: { command: "build" },
          },
          {
            msg: "dryRun >> tauri [build]: node -e \"console.log('the files in the tauri folder are')\"",
            level: "info",
            meta: { command: "build" },
          },
          {
            msg: "dryRun >> tauri [build]: ls",
            level: "info",
            meta: { command: "build" },
          },
          {
            msg: "dryRun >> tauri-api [build]: node -e \"console.log('the files in the tauri-api folder are')\"",
            level: "info",
            meta: { command: "build" },
          },
          {
            msg: "dryRun >> tauri-api [build]: ls",
            level: "info",
            meta: { command: "build" },
          },
          {
            msg: "dryRun >> tauri-utils [build]: node -e \"console.log('the files in the tauri-utils folder are')\"",
            level: "info",
            meta: { command: "build" },
          },
          {
            msg: "dryRun >> tauri-utils [build]: ls",
            level: "info",
            meta: { command: "build" },
          },
          {
            msg: "dryRun >> tauri-updater [build]: node -e \"console.log('the files in the tauri-updater folder are')\"",
            level: "info",
            meta: { command: "build" },
          },
          {
            msg: "dryRun >> tauri-updater [build]: ls",
            level: "info",
            meta: { command: "build" },
          },
          {
            msg: "==== result ===",
            level: "info",
            meta: { command: "build" },
          },
          {
            msg: "completed",
            level: "info",
            meta: { command: "build" },
          },
        ],
        checksWithObject()
      );
    expect(covectored).toMatchSnapshot();
  });
});
