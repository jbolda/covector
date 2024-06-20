import { covector } from "../../src";
import { CovectorVersion } from "@covector/types";
import { TomlDocument } from "@covector/toml";
import { loadFile } from "@covector/files";
import { captureError, describe, it } from "../../../../helpers/test-scope.ts";
import { expect } from "vitest";
import { checksWithObject } from "../helpers.ts";
import pino from "pino";
import * as pinoTest from "pino-test";
import path from "path";
import * as fs from "fs";
import fixtures from "fixturez";

const f = fixtures(__dirname);

expect.addSnapshotSerializer({
  test: (value) => value instanceof TomlDocument,
  print: (_) => `TomlDocument {}`,
});

describe("integration test in --dry-run mode", () => {
  it("passes correct config for js and rust", function* () {
    const stream = pinoTest.sink();
    const logger = pino(stream);
    const fullIntegration = f.copy("integration.js-and-rust-with-changes");
    const covectored = yield covector({
      logger,
      command: "status",
      cwd: fullIntegration,
      dryRun: true,
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
          msg: "==== data piped into commands ===",
          level: 30,
          // TODO check render
        },
        {
          command: "status",
          msg: "==== data piped into commands ===",
          level: 30,
          // TODO check render
        },
        {
          command: "status",
          msg: "==== data piped into commands ===",
          level: 30,
          // TODO check render
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

  it("runs version for js and rust", function* () {
    const stream = pinoTest.sink();
    const logger = pino(stream);
    const fullIntegration = f.copy("integration.js-and-rust-with-changes");
    const covectored = (yield covector({
      logger,
      command: "version",
      cwd: fullIntegration,
      dryRun: true,
    })) as CovectorVersion;

    // to confirm we have reached the end of the logs
    logger.info("completed");
    yield pinoTest.consecutive(
      stream,
      [
        {
          command: "version",
          msg: "==== data piped into commands ===",
          level: 30,
          // TODO check render
        },
        {
          command: "version",
          msg: "==== data piped into commands ===",
          level: 30,
          // TODO check render
        },
        {
          command: "version",
          msg: "==== data piped into commands ===",
          level: 30,
          // TODO check render
        },
        {
          command: "version",
          msg: "==== commands ready to run ===",
          level: 30,
          // TODO check render
        },
        {
          command: "version",
          // TODO no message?
          // msg: "==== commands ready to run ===",
          level: 30,
          // TODO check render
        },
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
          msg: "tauri.js planned to be bumped from 0.6.2 to 0.6.3",
          level: 30,
        },
        {
          command: "version",
          msg: "tauri planned to be bumped from 0.5.2 to 0.6.0",
          level: 30,
        },
        {
          command: "version",
          msg: "tauri-updater planned to be bumped from 0.4.2 to 0.4.3",
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
          msg: "==== result ===",
          level: 30,
        },
        {
          command: "version",
          // TODO check render
          // msg: "completed",
          level: 30,
        },
        {
          msg: "completed",
          level: 30,
        },
      ],
      checksWithObject()
    );

    if (typeof covectored !== "object")
      throw new Error("We are expecting an object here.");
    expect(covectored).toMatchSnapshot();

    // TODO can we less effection this test?
    const changelogTauriCore = yield captureError(
      loadFile(path.join("/tauri/", "CHANGELOG.md"), fullIntegration)
    );
    expect(changelogTauriCore.effectionTrace[0].state).toEqual("erroring");
    expect(changelogTauriCore.effectionTrace[1].state).toEqual("erroring");

    const changelogTaurijs = yield captureError(
      loadFile(path.join("/cli/tauri.js/", "CHANGELOG.md"), fullIntegration)
    );
    expect(changelogTaurijs.effectionTrace[0].state).toEqual("erroring");
    expect(changelogTaurijs.effectionTrace[1].state).toEqual("erroring");
  });

  it("runs publish for js and rust", function* () {
    const stream = pinoTest.sink();
    const logger = pino(stream);
    const fullIntegration = f.copy("integration.js-and-rust-with-changes");
    const covectored = yield covector({
      logger,
      command: "publish",
      cwd: fullIntegration,
      dryRun: true,
    });

    // to confirm we have reached the end of the logs
    logger.info("completed");
    yield pinoTest.consecutive(
      stream,
      [
        {
          command: "publish",
          msg: "==== data piped into commands ===",
          level: 30,
          // TODO check render
        },
        {
          command: "publish",
          msg: "==== data piped into commands ===",
          level: 30,
          // TODO check render
        },
        {
          command: "publish",
          msg: "==== data piped into commands ===",
          level: 30,
          // TODO check render
        },
        {
          command: "publish",
          msg: "==== data piped into commands ===",
          level: 30,
          // TODO check render
        },
        {
          command: "publish",
          msg: "==== data piped into commands ===",
          level: 30,
          // TODO check render
        },
        {
          command: "publish",
          msg: "==== commands ready to run ===",
          level: 30,
          // TODO check render
        },
        {
          command: "publish",
          // TODO no message?
          // msg: "==== commands ready to run ===",
          level: 30,
          // TODO check render
        },
        {
          command: "publish",
          msg: "Checking if tauri-bundler@0.6.0 is already published with: node -e \"console.log('0.5.2')\"",
          level: 30,
        },
        {
          command: "publish",
          msg: "0.5.2",
          level: 30,
        },
        {
          command: "publish",
          msg: "Checking if tauri@0.5.2 is already published with: node -e \"console.log('0.5.2')\"",
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
          msg: "Checking if tauri-api@0.5.1 is already published with: node -e \"console.log('0.5.2')\"",
          level: 30,
        },
        {
          command: "publish",
          msg: "0.5.2",
          level: 30,
        },
        {
          command: "publish",
          msg: "Checking if tauri-utils@0.5.0 is already published with: node -e \"console.log('0.5.2')\"",
          level: 30,
        },
        {
          command: "publish",
          msg: "0.5.2",
          level: 30,
        },
        {
          command: "publish",
          msg: "dryRun >> tauri-bundler [prepublish]: node -e \"console.log('premode for tauri-bundler')\"",
          level: 30,
        },
        {
          command: "publish",
          msg: "dryRun >> tauri-api [prepublish]: node -e \"console.log('premode for tauri-api')\"",
          level: 30,
        },
        {
          command: "publish",
          msg: "dryRun >> tauri-utils [prepublish]: node -e \"console.log('premode for tauri-utils')\"",
          level: 30,
        },
        {
          command: "publish",
          msg: "dryRun >> tauri.js [publish]: node -e \"console.log('publishing tauri.js')\"",
          level: 30,
        },
        {
          command: "publish",
          msg: "dryRun >> tauri-bundler [publish]: node -e \"console.log('publishing tauri-bundler')\"",
          level: 30,
        },
        {
          command: "publish",
          msg: "dryRun >> tauri-bundler [publish]: node -e \"console.log('running in ./cli/tauri-bundler')\"",
          level: 30,
        },
        {
          command: "publish",
          msg: "dryRun >> tauri-bundler [publish run from the cwd]: ls",
          level: 30,
        },
        {
          command: "publish",
          msg: "dryRun >> tauri-bundler [publish]: ls",
          level: 30,
        },
        {
          command: "publish",
          msg: "dryRun >> tauri-api [publish]: node -e \"console.log('publishing tauri-api')\"",
          level: 30,
        },
        {
          command: "publish",
          msg: "dryRun >> tauri-api [publish]: node -e \"console.log('running in ./tauri-api')\"",
          level: 30,
        },
        {
          command: "publish",
          msg: "dryRun >> tauri-api [publish run from the cwd]: ls",
          level: 30,
        },
        {
          command: "publish",
          msg: "dryRun >> tauri-api [publish]: ls",
          level: 30,
        },
        {
          command: "publish",
          msg: "dryRun >> tauri-utils [publish]: node -e \"console.log('publishing tauri-utils')\"",
          level: 30,
        },
        {
          command: "publish",
          msg: "dryRun >> tauri-utils [publish]: node -e \"console.log('running in ./tauri-utils')\"",
          level: 30,
        },
        {
          command: "publish",
          msg: "dryRun >> tauri-utils [publish run from the cwd]: ls",
          level: 30,
        },
        {
          command: "publish",
          msg: "dryRun >> tauri-utils [publish]: ls",
          level: 30,
        },
        {
          command: "publish",
          msg: "dryRun >> tauri-bundler [postpublish]: node -e \"console.log('postmode for tauri-bundler')\"",
          level: 30,
        },
        {
          command: "publish",
          msg: "dryRun >> tauri-api [postpublish]: node -e \"console.log('postmode for tauri-api')\"",
          level: 30,
        },
        {
          command: "publish",
          msg: "dryRun >> tauri-utils [postpublish]: node -e \"console.log('postmode for tauri-utils')\"",
          level: 30,
        },
        {
          command: "publish",
          msg: "==== result ===",
          level: 30,
        },
        {
          command: "publish",
          // msg: "completed",
          // TODO check render
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

  it("runs test for js and rust", function* () {
    const stream = pinoTest.sink();
    const logger = pino(stream);
    const fullIntegration = f.copy("integration.js-and-rust-with-changes");
    const covectored = yield covector({
      logger,
      command: "test",
      cwd: fullIntegration,
      dryRun: true,
    });

    // to confirm we have reached the end of the logs
    logger.info("completed");
    yield pinoTest.consecutive(
      stream,
      [
        {
          command: "arbitrary",
          msg: "==== commands ready to run ===",
          level: 30,
          // TODO check render
        },
        {
          command: "arbitrary",
          // TODO no message?
          // msg: "==== commands ready to run ===",
          level: 30,
          // TODO check render
        },
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
      dryRun: true,
    });

    // to confirm we have reached the end of the logs
    logger.info("completed");
    yield pinoTest.consecutive(
      stream,
      [
        {
          command: "arbitrary",
          msg: "==== data piped into commands ===",
          level: 30,
          // TODO check render
        },
        {
          command: "arbitrary",
          msg: "==== data piped into commands ===",
          level: 30,
          // TODO check render
        },
        {
          command: "arbitrary",
          msg: "==== data piped into commands ===",
          level: 30,
          // TODO check render
        },
        {
          command: "arbitrary",
          msg: "==== data piped into commands ===",
          level: 30,
          // TODO check render
        },
        {
          command: "arbitrary",
          msg: "==== data piped into commands ===",
          level: 30,
          // TODO check render
        },
        {
          command: "arbitrary",
          msg: "==== commands ready to run ===",
          level: 30,
          // TODO check render
        },
        {
          command: "arbitrary",
          // TODO no message?
          // msg: "==== commands ready to run ===",
          level: 30,
          // TODO check render
        },
        {
          command: "arbitrary",
          msg: "dryRun >> tauri-bundler [build]: node -e \"console.log('the files in the tauri-bundler folder are')\"",
          level: 30,
        },
        {
          command: "arbitrary",
          msg: "dryRun >> tauri-bundler [build]: ls",
          level: 30,
        },
        {
          command: "arbitrary",
          msg: "dryRun >> tauri [build]: node -e \"console.log('the files in the tauri folder are')\"",
          level: 30,
        },
        {
          command: "arbitrary",
          msg: "dryRun >> tauri [build]: ls",
          level: 30,
        },
        {
          command: "arbitrary",
          msg: "dryRun >> tauri-api [build]: node -e \"console.log('the files in the tauri-api folder are')\"",
          level: 30,
        },
        {
          command: "arbitrary",
          msg: "dryRun >> tauri-api [build]: ls",
          level: 30,
        },
        {
          command: "arbitrary",
          msg: "dryRun >> tauri-utils [build]: node -e \"console.log('the files in the tauri-utils folder are')\"",
          level: 30,
        },
        {
          command: "arbitrary",
          msg: "dryRun >> tauri-utils [build]: ls",
          level: 30,
        },
        {
          command: "arbitrary",
          msg: "dryRun >> tauri-updater [build]: node -e \"console.log('the files in the tauri-updater folder are')\"",
          level: 30,
        },
        {
          command: "arbitrary",
          msg: "dryRun >> tauri-updater [build]: ls",
          level: 30,
        },
        {
          command: "arbitrary",
          msg: "==== result ===",
          level: 30,
        },
        {
          command: "arbitrary",
          // TODO no message?
          // msg: "completed",
          level: 30,
          // TODO check render
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
