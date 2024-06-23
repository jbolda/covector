import { covector } from "../../src";
import { TomlDocument } from "@covector/toml";
import { describe, it } from "../../../../helpers/test-scope.ts";
import { expect } from "vitest";
import pino from "pino";
import * as pinoTest from "pino-test";
import fixtures from "fixturez";
import { loadContent } from "../helpers.ts";
const f = fixtures(__dirname);

expect.addSnapshotSerializer({
  test: (value) => value instanceof TomlDocument,
  print: (_) => `TomlDocument {}`,
});

describe("integration test for preview command", () => {
  it("runs version and publish for js and rust", function* () {
    const stream = pinoTest.sink();
    const logger = pino(stream);
    const fullIntegration = f.copy("integration.js-and-rust-for-preview");
    const covectored = yield covector({
      logger,
      command: "preview",
      cwd: fullIntegration,
      previewVersion: "branch-name.12345",
    });

    yield pinoTest.consecutive(stream, [
      {
        command: "preview",
        msg: "bumping package-b with branch-name.12345 identifier to publish a preview",
        level: 30,
      },
      {
        command: "preview",
        msg: "bumping package-a with branch-name.12345 identifier to publish a preview",
        level: 30,
      },
      {
        command: "preview",
        msg: "bumping package-c with branch-name.12345 identifier to publish a preview",
        level: 30,
      },
      {
        command: "preview",
        msg: "package-a [prepublish]: node -e \"fs.appendFileSync('../log.txt', 'prepublishing package-a would happen here\\\\n')\"",
        level: 30,
      },
      {
        command: "preview",
        msg: "package-b [prepublish]: node -e \"fs.appendFileSync('../log.txt', 'prepublishing package-b would happen here\\\\n')\"",
        level: 30,
      },
      {
        command: "preview",
        msg: "package-c [prepublish]: node -e \"fs.appendFileSync('../log.txt', 'prepublishing package-c would happen here\\\\n')\"",
        level: 30,
      },
      {
        command: "preview",
        msg: "package-a [publish]: node -e \"fs.appendFileSync('../log.txt', 'publishing --tag  would happen here\\\\n')\"",
        level: 30,
      },
      {
        command: "preview",
        msg: "package-b [publish]: node -e \"fs.appendFileSync('../log.txt', 'publishing --tag  would happen here\\\\n')\"",
        level: 30,
      },
      {
        command: "preview",
        msg: "package-c [publish]: node -e \"fs.appendFileSync('../log.txt', 'publishing would happen here\\\\n')\"",
        level: 30,
      },
    ]);
    expect(loadContent(fullIntegration, "log.txt")).toEqual(
      "prepublishing package-a would happen here\n" +
        "prepublishing package-b would happen here\n" +
        "prepublishing package-c would happen here\n" +
        "publishing --tag  would happen here\n" +
        "publishing --tag  would happen here\n" +
        "publishing would happen here\n"
    );
    expect(covectored).toMatchSnapshot();
  });
});

describe("integration test for preview command with dist tags", () => {
  it("runs version and publish for js and rust", function* () {
    const stream = pinoTest.sink();
    const logger = pino(stream);
    const fullIntegration = f.copy("integration.js-and-rust-for-preview");
    const covectored = yield covector({
      logger,
      command: "preview",
      cwd: fullIntegration,
      previewVersion: "branch-name.12345",
      branchTag: "branch_name",
    });

    yield pinoTest.consecutive(stream, [
      {
        command: "preview",
        msg: "bumping package-b with branch-name.12345 identifier to publish a preview",
        level: 30,
      },
      {
        command: "preview",
        msg: "bumping package-a with branch-name.12345 identifier to publish a preview",
        level: 30,
      },
      {
        command: "preview",
        msg: "bumping package-c with branch-name.12345 identifier to publish a preview",
        level: 30,
      },
      {
        command: "preview",
        msg: "package-a [prepublish]: node -e \"fs.appendFileSync('../log.txt', 'prepublishing package-a would happen here\\\\n')\"",
        level: 30,
      },
      {
        command: "preview",
        msg: "package-b [prepublish]: node -e \"fs.appendFileSync('../log.txt', 'prepublishing package-b would happen here\\\\n')\"",
        level: 30,
      },
      {
        command: "preview",
        msg: "package-c [prepublish]: node -e \"fs.appendFileSync('../log.txt', 'prepublishing package-c would happen here\\\\n')\"",
        level: 30,
      },
      {
        command: "preview",
        msg: "package-a [publish]: node -e \"fs.appendFileSync('../log.txt', 'publishing would happen here\\\\n')\"",
        level: 30,
      },
      {
        command: "preview",
        msg: "package-b [publish]: node -e \"fs.appendFileSync('../log.txt', 'publishing would happen here\\\\n')\"",
        level: 30,
      },
      {
        command: "preview",
        msg: "package-c [publish]: node -e \"fs.appendFileSync('../log.txt', 'publishing --tag branch_name would happen here\\\\n')\"",
        level: 30,
      },
    ]);
    expect(loadContent(fullIntegration, "log.txt")).toEqual(
      "prepublishing package-a would happen here\n" +
        "prepublishing package-b would happen here\n" +
        "prepublishing package-c would happen here\n" +
        "publishing would happen here\n" +
        "publishing would happen here\n" +
        "publishing --tag branch_name would happen here\n"
    );
    expect(covectored).toMatchSnapshot();
  });
});
