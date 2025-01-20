import { apply } from "../src";
import { loadFile, readAllPkgFiles } from "@covector/files";
import { describe, it } from "../../../helpers/test-scope.ts";
import { expect } from "vitest";
import pino from "pino";
import * as pinoTest from "pino-test";
import fixtures from "fixturez";
import { call } from "effection";
const f = fixtures(__dirname);

const configDefaults = {
  changeFolder: ".changes",
};

describe("package file applies preview bump", () => {
  it("bumps single js json", function* () {
    const stream = pinoTest.sink();
    const logger = pino(stream);
    const jsonFolder = f.copy("pkg.js-single-json"); // 0.5.9

    const commands = [
      {
        dependencies: undefined,
        manager: "javascript",
        path: "./",
        pkg: "js-single-json-fixture",
        type: "minor",
        parents: {},
      },
    ];

    const config = {
      ...configDefaults,
      packages: {
        "js-single-json-fixture": {
          path: "./",
          manager: "javascript",
        },
      },
    };

    const allPackages = yield* readAllPkgFiles({ config, cwd: jsonFolder });

    yield* apply({
      logger,
      //@ts-expect-error
      commands,
      config,
      cwd: jsonFolder,
      allPackages,
      previewVersion: "branch-name.12345",
    });
    const modifiedFile = yield* loadFile("package.json", jsonFolder);
    expect(modifiedFile.content).toBe(
      "{\n" +
        '  "private": true,\n' +
        '  "name": "js-single-json-fixture",\n' +
        '  "description": "A single package at the root. No monorepo setup.",\n' +
        '  "repository": "https://www.github.com/jbolda/covector.git",\n' +
        '  "version": "0.5.9-branch-name.12345"\n' +
        "}\n"
    );

    yield* call(() =>
      pinoTest.consecutive(stream, [
        {
          msg: "bumping js-single-json-fixture with branch-name.12345 identifier to publish a preview",
          level: 30,
        },
      ])
    );
  });

  it("bumps multi js json", function* () {
    const stream = pinoTest.sink();
    const logger = pino(stream);
    const jsonFolder = f.copy("pkg.js-yarn-workspace"); // 1.0.0

    const commands = [
      {
        dependencies: ["yarn-workspace-base-pkg-b", "all"],
        manager: "javascript",
        path: "./",
        pkg: "yarn-workspace-base-pkg-a",
        type: "minor",
        parents: {},
      },
      {
        dependencies: undefined,
        manager: "javascript",
        path: undefined,
        pkg: "yarn-workspace-base-pkg-b",
        type: "minor",
        parents: { "yarn-workspace-base-pkg-a": "null" },
      },
      {
        dependencies: undefined,
        manager: "javascript",
        path: undefined,
        pkg: "all",
        type: "minor",
        parents: {
          "yarn-workspace-base-pkg-a": "null",
          "yarn-workspace-base-pkg-b": "null",
        },
      },
    ];

    const config = {
      ...configDefaults,
      packages: {
        "yarn-workspace-base-pkg-a": {
          path: "./packages/pkg-a/",
          manager: "javascript",
          dependencies: ["yarn-workspace-base-pkg-b", "all"],
        },
        "yarn-workspace-base-pkg-b": {
          path: "./packages/pkg-b/",
          manager: "javascript",
          dependencies: ["all"],
        },
        all: { version: true },
      },
    };

    const allPackages = yield* readAllPkgFiles({ config, cwd: jsonFolder });

    yield* apply({
      logger,
      //@ts-expect-error
      commands,
      config,
      allPackages,
      cwd: jsonFolder,
      previewVersion: "branch-name.12345",
    });
    const modifiedPkgAFile = yield* loadFile(
      "packages/pkg-a/package.json",
      jsonFolder
    );
    expect(modifiedPkgAFile.content).toBe(
      "{\n" +
        '  "name": "yarn-workspace-base-pkg-a",\n' +
        '  "version": "1.0.0-branch-name.12345",\n' +
        '  "dependencies": {\n' +
        '    "yarn-workspace-base-pkg-b": "1.0.0-branch-name.12345"\n' +
        "  }\n" +
        "}\n"
    );

    const modifiedPkgBFile = yield* loadFile(
      "packages/pkg-b/package.json",
      jsonFolder
    );
    expect(modifiedPkgBFile.content).toBe(
      "{\n" +
        '  "name": "yarn-workspace-base-pkg-b",\n' +
        '  "version": "1.0.0-branch-name.12345"\n' +
        "}\n"
    );

    yield* call(() =>
      pinoTest.consecutive(stream, [
        {
          msg: "bumping yarn-workspace-base-pkg-a with branch-name.12345 identifier to publish a preview",
          level: 30,
        },
        {
          msg: "bumping yarn-workspace-base-pkg-b with branch-name.12345 identifier to publish a preview",
          level: 30,
        },
        {
          msg: "bumping all with branch-name.12345 identifier to publish a preview",
          level: 30,
        },
      ])
    );
  });
});

describe("package file applies preview bump to pre-release", () => {
  it("bumps single js json without pre-release", function* () {
    const stream = pinoTest.sink();
    const logger = pino(stream);
    const jsonFolder = f.copy("pkg.js-single-prerelease-json"); // 0.5.9-abc.2

    const commands = [
      {
        dependencies: undefined,
        manager: "javascript",
        path: "./",
        pkg: "js-single-prerelease-json-fixture",
        type: "minor",
        parents: {},
      },
    ];

    const config = {
      ...configDefaults,
      packages: {
        "js-single-prerelease-json-fixture": {
          path: "./",
          manager: "javascript",
        },
      },
    };

    const allPackages = yield* readAllPkgFiles({ config, cwd: jsonFolder });

    yield* apply({
      logger,
      //@ts-expect-error
      commands,
      config,
      allPackages,
      cwd: jsonFolder,
      previewVersion: "branch-name.12345",
    });
    const modifiedFile = yield* loadFile("package.json", jsonFolder);
    expect(modifiedFile.content).toBe(
      "{\n" +
        '  "private": true,\n' +
        '  "name": "js-single-prerelease-json-fixture",\n' +
        '  "description": "A single package at the root. No monorepo setup.",\n' +
        '  "version": "0.5.9-branch-name.12345"\n' +
        "}\n"
    );

    yield* call(() =>
      pinoTest.consecutive(stream, [
        {
          msg: "bumping js-single-prerelease-json-fixture with branch-name.12345 identifier to publish a preview",
          level: 30,
        },
      ])
    );
  });

  it("bumps multi js json without pre-release", function* () {
    const stream = pinoTest.sink();
    const logger = pino(stream);
    const jsonFolder = f.copy("pkg.js-yarn-prerelease-workspace");

    const commands = [
      {
        dependencies: ["yarn-workspace-base-pkg-b", "all"],
        manager: "javascript",
        path: "./",
        pkg: "yarn-workspace-base-pkg-a",
        type: "minor",
        parents: {},
      },
      {
        dependencies: undefined,
        manager: "javascript",
        path: undefined,
        pkg: "yarn-workspace-base-pkg-b",
        type: "minor",
        parents: { "yarn-workspace-base-pkg-a": "null" },
      },
      {
        dependencies: undefined,
        manager: "javascript",
        path: undefined,
        pkg: "all",
        type: "minor",
        parents: {
          "yarn-workspace-base-pkg-a": "null",
          "yarn-workspace-base-pkg-b": "null",
        },
      },
    ];

    const config = {
      packages: {
        "yarn-workspace-base-pkg-a": {
          path: "./packages/pkg-a/", // 1.0.0-abc.2
          manager: "javascript",
          dependencies: ["yarn-workspace-base-pkg-b", "all"],
        },
        "yarn-workspace-base-pkg-b": {
          path: "./packages/pkg-b/", // 1.0.0-abc.3
          manager: "javascript",
          dependencies: ["all"],
        },
        all: { version: true },
      },
    };

    const allPackages = yield* readAllPkgFiles({ config, cwd: jsonFolder });

    yield* apply({
      logger,
      //@ts-expect-error
      commands,
      config,
      allPackages,
      cwd: jsonFolder,
      previewVersion: "branch-name.12345",
    });
    const modifiedPkgAFile = yield* loadFile(
      "packages/pkg-a/package.json",
      jsonFolder
    );
    expect(modifiedPkgAFile.content).toBe(
      "{\n" +
        '  "name": "yarn-workspace-base-pkg-a",\n' +
        '  "version": "1.0.0-branch-name.12345",\n' +
        '  "dependencies": {\n' +
        '    "yarn-workspace-base-pkg-b": "1.0.0-branch-name.12345"\n' +
        "  }\n" +
        "}\n"
    );

    const modifiedPkgBFile = yield* loadFile(
      "packages/pkg-b/package.json",
      jsonFolder
    );
    expect(modifiedPkgBFile.content).toBe(
      "{\n" +
        '  "name": "yarn-workspace-base-pkg-b",\n' +
        '  "version": "1.0.0-branch-name.12345"\n' +
        "}\n"
    );

    yield* call(() =>
      pinoTest.consecutive(stream, [
        {
          msg: "bumping yarn-workspace-base-pkg-a with branch-name.12345 identifier to publish a preview",
          level: 30,
        },
        {
          msg: "bumping yarn-workspace-base-pkg-b with branch-name.12345 identifier to publish a preview",
          level: 30,
        },
        {
          msg: "bumping all with branch-name.12345 identifier to publish a preview",
          level: 30,
        },
      ])
    );
  });
});
