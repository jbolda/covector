import { apply } from "../src";
import { loadFile, readAllPkgFiles } from "@covector/files";
import { it } from "@effection/jest";
import mockConsole, { RestoreConsole } from "jest-mock-console";
import fixtures from "fixturez";
const f = fixtures(__dirname);

const configDefaults = {
  changeFolder: ".changes",
};

describe("package file applies preview bump", () => {
  let restoreConsole: RestoreConsole;
  beforeEach(() => {
    restoreConsole = mockConsole(["log", "dir"]);
  });
  afterEach(() => {
    restoreConsole();
  });

  it("bumps single js json", function* () {
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

    const allPackages = yield readAllPkgFiles({ config, cwd: jsonFolder });

    yield apply({
      //@ts-expect-error
      commands,
      config,
      cwd: jsonFolder,
      allPackages,
      previewVersion: "branch-name.12345",
    });
    const modifiedFile = yield loadFile("package.json", jsonFolder);
    expect(modifiedFile.content).toBe(
      "{\n" +
        '  "private": true,\n' +
        '  "name": "js-single-json-fixture",\n' +
        '  "description": "A single package at the root. No monorepo setup.",\n' +
        '  "repository": "https://www.github.com/jbolda/covector.git",\n' +
        '  "version": "0.5.9-branch-name.12345"\n' +
        "}\n"
    );

    expect({
      //@ts-expect-error
      consoleLog: console.log.mock.calls,
      //@ts-expect-error
      consoleDir: console.dir.mock.calls,
    }).toMatchSnapshot();
  });

  it("bumps multi js json", function* () {
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

    const allPackages = yield readAllPkgFiles({ config, cwd: jsonFolder });

    yield apply({
      //@ts-expect-error
      commands,
      config,
      allPackages,
      cwd: jsonFolder,
      previewVersion: "branch-name.12345",
    });
    const modifiedPkgAFile = yield loadFile(
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

    const modifiedPkgBFile = yield loadFile(
      "packages/pkg-b/package.json",
      jsonFolder
    );
    expect(modifiedPkgBFile.content).toBe(
      "{\n" +
        '  "name": "yarn-workspace-base-pkg-b",\n' +
        '  "version": "1.0.0-branch-name.12345"\n' +
        "}\n"
    );

    expect({
      //@ts-expect-error
      consoleLog: console.log.mock.calls,
      //@ts-expect-error
      consoleDir: console.dir.mock.calls,
    }).toMatchSnapshot();
  });
});

describe("package file applies preview bump to pre-release", () => {
  let restoreConsole: RestoreConsole;
  beforeEach(() => {
    restoreConsole = mockConsole(["log", "dir"]);
  });
  afterEach(() => {
    restoreConsole();
  });

  it("bumps single js json without pre-release", function* () {
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

    const allPackages = yield readAllPkgFiles({ config, cwd: jsonFolder });

    yield apply({
      //@ts-expect-error
      commands,
      config,
      allPackages,
      cwd: jsonFolder,
      previewVersion: "branch-name.12345",
    });
    const modifiedFile = yield loadFile("package.json", jsonFolder);
    expect(modifiedFile.content).toBe(
      "{\n" +
        '  "private": true,\n' +
        '  "name": "js-single-prerelease-json-fixture",\n' +
        '  "description": "A single package at the root. No monorepo setup.",\n' +
        '  "version": "0.5.9-branch-name.12345"\n' +
        "}\n"
    );

    expect({
      //@ts-expect-error
      consoleLog: console.log.mock.calls,
      //@ts-expect-error
      consoleDir: console.dir.mock.calls,
    }).toMatchSnapshot();
  });

  it("bumps multi js json without pre-release", function* () {
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

    const allPackages = yield readAllPkgFiles({ config, cwd: jsonFolder });

    yield apply({
      //@ts-expect-error
      commands,
      config,
      allPackages,
      cwd: jsonFolder,
      previewVersion: "branch-name.12345",
    });
    const modifiedPkgAFile = yield loadFile(
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

    const modifiedPkgBFile = yield loadFile(
      "packages/pkg-b/package.json",
      jsonFolder
    );
    expect(modifiedPkgBFile.content).toBe(
      "{\n" +
        '  "name": "yarn-workspace-base-pkg-b",\n' +
        '  "version": "1.0.0-branch-name.12345"\n' +
        "}\n"
    );

    expect({
      //@ts-expect-error
      consoleLog: console.log.mock.calls,
      //@ts-expect-error
      consoleDir: console.dir.mock.calls,
    }).toMatchSnapshot();
  });
});
