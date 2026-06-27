import { covector } from "../../src/index.ts";
import { logger as covectorLogger } from "../../src/logger.ts";
import { TomlDocument } from "@covector/toml";
import { loadFile } from "@covector/files";
import { captureError, describe, it } from "@effectionx/vitest";
import { expect } from "vitest";
import * as logTest from "../../../../helpers/test-logger.ts";
import { checksWithObject } from "../../../../helpers/test-logger.ts";
import path from "path";
import * as fs from "fs";
// @ts-expect-error fixturez has no types
import fixtures from "fixturez";

const f = fixtures(__dirname);

expect.addSnapshotSerializer({
  test: (value) => value instanceof TomlDocument,
  print: (_) => `TomlDocument {}`,
});

describe("integration test with preMode `on`", () => {
  const makePre = (folder: string, prevChanges: string[] = []) =>
    fs.writeFileSync(
      path.join(folder, "./.changes/pre.json"),
      `
  {
    "tag": "beta",
    "changes": [${prevChanges.length === 0 ? "" : prevChanges.join(", ")}]
  }
  `,
    );

  it("runs version in production for js and rust", function* () {
    const sink = yield* logTest.useCapturedLogger();

    const logger = covectorLogger.operations;
    const fullIntegration = f.copy("integration.js-and-rust-with-changes");
    // this enables "pre" mode
    makePre(fullIntegration);

    const covectored = yield* covector({
      logger,
      command: "version",
      cwd: fullIntegration,
    });
    if (typeof covectored !== "object")
      throw new Error("We are expecting an object here.");

    yield* logTest.consecutive(
      sink.all,
      [
        {
          msg: "bumping tauri with preminor",
          level: "info",
          meta: { command: "version" },
        },
        {
          msg: "bumping tauri-updater with prepatch",
          level: "info",
          meta: { command: "version" },
        },
        {
          msg: "bumping tauri.js with prerelease",
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
      ],
      checksWithObject(),
    );

    expect(covectored).toMatchSnapshot();

    const changelogTauriCore = yield* loadFile(
      path.join("/tauri/", "CHANGELOG.md"),
      fullIntegration,
    );
    // has a direct minor from 0.5.2
    expect(changelogTauriCore.content).toBe(
      "# Changelog\n\n" +
        "## [0.6.0-beta.0]\n\n" +
        "- Summary about the changes in tauri\n",
    );

    const changelogTaurijs = yield* loadFile(
      path.join("/cli/tauri.js/", "CHANGELOG.md"),
      fullIntegration,
    );
    // tauri.js through a dep bump
    expect(changelogTaurijs.content).toBe(
      "# Changelog\n\n" +
        "## [0.6.3-beta.0]\n\n" +
        "### Dependencies\n\n" +
        "- Upgraded to `tauri@0.6.0-beta.0`\n",
    );
  });

  it("runs version in production with existing changes for js and rust", function* () {
    const sink = yield* logTest.useCapturedLogger();

    const logger = covectorLogger.operations;
    const fullIntegration = f.copy("integration.js-and-rust-with-changes");
    // this enables "pre" mode
    makePre(fullIntegration);
    const covectoredOne = yield* covector({
      logger,
      command: "version",
      cwd: fullIntegration,
    });

    yield* logTest.consecutive(sink.all, [
      {
        msg: "bumping tauri with preminor",
        level: "info",
      },
      {
        msg: "bumping tauri-updater with prepatch",
        level: "info",
      },
      {
        msg: "bumping tauri.js with prerelease",
        level: "info",
      },
      {
        msg: "Could not load the CHANGELOG.md. Creating one.",
        level: "info",
      },
      {
        msg: "Could not load the CHANGELOG.md. Creating one.",
        level: "info",
      },
      {
        msg: "Could not load the CHANGELOG.md. Creating one.",
        level: "info",
      },
    ]);

    const changelogTauriCoreOne = yield* loadFile(
      path.join("/tauri/", "CHANGELOG.md"),
      fullIntegration,
    );
    expect(changelogTauriCoreOne.content).toBe(
      "# Changelog\n\n" +
        "## [0.6.0-beta.0]\n\n" +
        "- Summary about the changes in tauri\n",
    );

    const changelogTaurijsOne = yield* loadFile(
      path.join("/cli/tauri.js/", "CHANGELOG.md"),
      fullIntegration,
    );
    // tauri.js does not have a change file directly or through a dep bump
    // so it should remain the same
    expect(changelogTaurijsOne.content).toBe(
      "# Changelog\n\n" +
        "## [0.6.3-beta.0]\n\n" +
        "### Dependencies\n\n" +
        "- Upgraded to `tauri@0.6.0-beta.0`\n",
    );

    const preOne = yield* loadFile(
      path.join(".changes", "pre.json"),
      fullIntegration,
    );
    expect(preOne.content).toBe(
      '{\n  "tag": "beta",\n  "changes": [\n    ".changes/first-change.md",\n    ".changes/second-change.md"\n  ]\n}\n',
    );

    // add change file
    fs.writeFileSync(
      path.join(fullIntegration, ".changes", "third-change.md"),
      `---
"tauri-api": patch
---

Boop again.
`,
    );

    // double check the write and formatting
    const newChange = yield* loadFile(
      path.join(".changes", "third-change.md"),
      fullIntegration,
    );
    expect(newChange.content).toBe(
      "---\n" + '"tauri-api": patch\n' + "---\n\n" + "Boop again.\n",
    );

    const startIndex = sink.all.length;

    const covectoredTwo = yield* covector({
      logger,
      command: "version",
      cwd: fullIntegration,
    });

    yield* logTest.consecutive(sink.all.slice(startIndex), [
      {
        msg: "bumping tauri-api with prepatch",
        level: "info",
      },
      {
        msg: "bumping tauri with prerelease",
        level: "info",
      },
      {
        msg: "bumping tauri.js with prerelease",
        level: "info",
      },
      {
        msg: "Could not load the CHANGELOG.md. Creating one.",
        level: "info",
      },
    ]);

    const changelogTauriCoreTwo = yield* loadFile(
      path.join("/tauri/", "CHANGELOG.md"),
      fullIntegration,
    );
    expect(changelogTauriCoreTwo.content).toBe(
      "# Changelog\n\n" +
        "## [0.6.0-beta.1]\n\n" +
        "### Dependencies\n\n" +
        "- Upgraded to `tauri-api@0.5.2-beta.0`\n" +
        "\n" +
        "## [0.6.0-beta.0]\n\n" +
        "- Summary about the changes in tauri\n",
    );

    const changelogTaurijsTwo = yield* loadFile(
      path.join("/cli/tauri.js/", "CHANGELOG.md"),
      fullIntegration,
    );
    // tauri.js does not have a change file directly or through a dep bump
    // so it should remain the same
    expect(changelogTaurijsTwo.content).toBe(
      "# Changelog\n\n" +
        "## [0.6.3-beta.1]\n\n" +
        "### Dependencies\n\n" +
        "- Upgraded to `tauri@0.6.0-beta.1`\n" +
        "\n" +
        "## [0.6.3-beta.0]\n\n" +
        "### Dependencies\n\n" +
        "- Upgraded to `tauri@0.6.0-beta.0`\n",
    );

    const preTwo = yield* loadFile(
      path.join(".changes", "pre.json"),
      fullIntegration,
    );
    expect(preTwo.content).toBe(
      '{\n  "tag": "beta",\n  "changes": [\n    ".changes/first-change.md",\n    ".changes/second-change.md",\n    ".changes/third-change.md"\n  ]\n}\n',
    );

    if (typeof covectoredOne !== "object")
      throw new Error("We are expecting an object here.");
    if (typeof covectoredTwo !== "object")
      throw new Error("We are expecting an object here.");
    expect({
      covectorReturnOne: covectoredOne,
      covectorReturnTwo: covectoredTwo,
    }).toMatchSnapshot();
  });

  it("runs version in --dry-run mode for js and rust", function* () {
    const sink = yield* logTest.useCapturedLogger();

    const logger = covectorLogger.operations;
    const fullIntegration = f.copy("integration.js-and-rust-with-changes");
    // this enables "pre" mode
    makePre(fullIntegration);
    const covectored = yield* covector({
      logger,
      command: "version",
      cwd: fullIntegration,
      dryRun: true,
    });

    yield* logTest.consecutive(
      sink.all,
      [
        {
          msg: "==== data piped into commands ===",
          level: "info",
          meta: { command: "version" },
        },
        {
          msg: "==== data piped into commands ===",
          level: "info",
          meta: { command: "version" },
        },
        {
          msg: "==== data piped into commands ===",
          level: "info",
          meta: { command: "version" },
        },
        {
          msg: "==== commands ready to run ===",
          level: "info",
          meta: { command: "version" },
        },
        {
          msg: "bumping tauri with preminor",
          level: "info",
          meta: { command: "version" },
        },
        {
          msg: "bumping tauri-updater with prepatch",
          level: "info",
          meta: { command: "version" },
        },
        {
          msg: "bumping tauri.js with prerelease",
          level: "info",
          meta: { command: "version" },
        },
        {
          msg: "tauri.js planned to be bumped from 0.6.2 to 0.6.3-beta.0",
          level: "info",
          meta: { command: "version" },
        },
        {
          msg: "tauri planned to be bumped from 0.5.2 to 0.6.0-beta.0",
          level: "info",
          meta: { command: "version" },
        },
        {
          msg: "tauri-updater planned to be bumped from 0.4.2 to 0.4.3-beta.0",
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
        },
      ],
      checksWithObject(),
    );

    if (typeof covectored !== "object")
      throw new Error("We are expecting an object here.");
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
});
