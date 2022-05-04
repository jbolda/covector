import { apply } from "../src";
import { loadFile } from "@covector/files";
import { it } from "@effection/jest";
import mockConsole, { RestoreConsole } from "jest-mock-console";
import fixtures from "fixturez";
const f = fixtures(__dirname);

const configDefaults = {
  changeFolder: ".changes",
};

describe("package file apply bump (snapshot)", () => {
  let restoreConsole: RestoreConsole;
  beforeEach(() => {
    restoreConsole = mockConsole(["log", "dir"]);
  });
  afterEach(() => {
    restoreConsole();
  });

  it("bumps single js json", function* () {
    const jsonFolder = f.copy("pkg.js-single-json");

    const commands = [
      {
        dependencies: undefined,
        manager: "javascript",
        path: "./",
        pkg: "js-single-json-fixture",
        type: "minor",
        parents: [],
      },
    ];

    const config = {
      packages: {
        "js-single-json-fixture": {
          path: "./",
          manager: "javascript",
        },
      },
    };

    //@ts-ignore
    yield apply({ commands, config, cwd: jsonFolder });
    const modifiedFile = yield loadFile("package.json", jsonFolder);
    expect(modifiedFile.content).toBe(
      "{\n" +
        '  "private": true,\n' +
        '  "name": "js-single-json-fixture",\n' +
        '  "description": "A single package at the root. No monorepo setup.",\n' +
        '  "repository": "https://www.github.com/jbolda/covector.git",\n' +
        '  "version": "0.6.0"\n' +
        "}\n"
    );

    expect({
      //@ts-ignore
      consoleLog: console.log.mock.calls,
      //@ts-ignore
      consoleDir: console.dir.mock.calls,
    }).toMatchSnapshot();
  });

  it("bumps single rust toml", function* () {
    const rustFolder = f.copy("pkg.rust-single");

    const commands = [
      {
        dependencies: undefined,
        manager: "rust",
        path: "./",
        pkg: "rust-single-fixture",
        type: "minor",
        parents: [],
      },
    ];

    const config = {
      packages: {
        "rust-single-fixture": {
          path: "./",
          manager: "rust",
        },
      },
    };

    //@ts-ignore
    yield apply({ commands, config, cwd: rustFolder });
    const modifiedFile = yield loadFile("Cargo.toml", rustFolder);
    expect(modifiedFile.content).toBe(
      '[package]\nname = "rust-single-fixture"\nversion = "0.6.0"\n'
    );

    expect({
      //@ts-ignore
      consoleLog: console.log.mock.calls,
      //@ts-ignore
      consoleDir: console.dir.mock.calls,
    }).toMatchSnapshot();
  });

  it("bumps single yaml toml", function* () {
    const rustFolder = f.copy("pkg.dart-flutter-single");

    const commands = [
      {
        dependencies: undefined,
        manager: "flutter",
        path: "./",
        pkg: "test_app",
        type: "minor",
        parents: [],
      },
    ];

    const config = {
      packages: {
        test_app: {
          path: "./",
          manager: "flutter",
        },
      },
    };

    //@ts-ignore
    yield apply({ commands, config, cwd: rustFolder });
    const modifiedFile = yield loadFile("pubspec.yaml", rustFolder);
    expect(modifiedFile.content).toBe(
      "name: test_app\ndescription: a great one\nhomepage: https://github.com/\nversion: 0.4.0\n" +
        "environment:\n  sdk: '>=2.10.0 <3.0.0'\n" +
        "dependencies:\n  flutter:\n    sdk: flutter\n  meta: any\n  provider: ^4.3.2\n  related_package:\n    git:\n      url: git@github.com:jbolda/covector.git\n      ref: main\n      path: __fixtures__/haha/\n" +
        "dev_dependencies:\n  flutter_test:\n    sdk: flutter\n  build_runner: any\n  json_serializable: any\n  mobx_codegen: any\n" +
        "flutter:\n  assets:\n    - assets/schema/\n    - assets/localization/\n"
    );

    expect({
      //@ts-ignore
      consoleLog: console.log.mock.calls,
      //@ts-ignore
      consoleDir: console.dir.mock.calls,
    }).toMatchSnapshot();
  });

  it("fails bump single js json that satisfies range", function* () {
    const jsonFolder = f.copy("pkg.js-single-json");

    const commands = [
      {
        dependencies: undefined,
        manager: "javascript",
        path: "./",
        pkg: "js-single-json-fixture",
        type: "minor",
        parents: [],
        errorOnVersionRange: ">= 0.6.0",
      },
    ];

    const config = {
      packages: {
        "js-single-json-fixture": {
          path: "./",
          manager: "javascript",
        },
      },
    };

    //@ts-ignore
    const applied = apply({ commands, config, cwd: jsonFolder });
    expect(applied.return).toThrow();
    expect({
      //@ts-ignore
      consoleLog: console.log.mock.calls,
      //@ts-ignore
      consoleDir: console.dir.mock.calls,
    }).toMatchSnapshot();
  });

  it("fails bumps single rust toml that satisfies range", function* () {
    const rustFolder = f.copy("pkg.rust-single");

    const commands = [
      {
        dependencies: undefined,
        manager: "rust",
        path: "./",
        pkg: "rust-single-fixture",
        type: "minor",
        parents: [],
        errorOnVersionRange: ">= 0.6.0",
      },
    ];

    const config = {
      packages: {
        "rust-single-fixture": {
          path: "./",
          manager: "rust",
        },
      },
    };

    //@ts-ignore
    const applied = apply({ commands, config, cwd: rustFolder });
    expect(applied.return).toThrow();
    expect({
      //@ts-ignore
      consoleLog: console.log.mock.calls,
      //@ts-ignore
      consoleDir: console.dir.mock.calls,
    }).toMatchSnapshot();
  });

  it("bumps multi js json", function* () {
    const jsonFolder = f.copy("pkg.js-yarn-workspace");

    const commands = [
      {
        dependencies: ["yarn-workspace-base-pkg-b", "all"],
        manager: "javascript",
        path: "./",
        pkg: "yarn-workspace-base-pkg-a",
        type: "minor",
        parents: [],
      },
      {
        dependencies: undefined,
        manager: "javascript",
        path: undefined,
        pkg: "yarn-workspace-base-pkg-b",
        type: "minor",
        parents: ["yarn-workspace-base-pkg-a"],
      },
      {
        dependencies: undefined,
        manager: "javascript",
        path: undefined,
        pkg: "all",
        type: "minor",
        parents: ["yarn-workspace-base-pkg-a", "yarn-workspace-base-pkg-b"],
      },
    ];

    const config = {
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

    //@ts-ignore
    yield apply({ commands, config, cwd: jsonFolder });
    const modifiedPkgAFile = yield loadFile(
      "packages/pkg-a/package.json",
      jsonFolder
    );
    expect(modifiedPkgAFile.content).toBe(
      "{\n" +
        '  "name": "yarn-workspace-base-pkg-a",\n' +
        '  "version": "1.1.0",\n' +
        '  "dependencies": {\n' +
        '    "yarn-workspace-base-pkg-b": "1.1.0"\n' +
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
        '  "version": "1.1.0"\n' +
        "}\n"
    );

    expect({
      //@ts-ignore
      consoleLog: console.log.mock.calls,
      //@ts-ignore
      consoleDir: console.dir.mock.calls,
    }).toMatchSnapshot();
  });

  it("bumps multi rust toml", function* () {
    const rustFolder = f.copy("pkg.rust-multi");

    const commands = [
      {
        dependencies: ["rust_pkg_b_fixture"],
        manager: "rust",
        path: "./pkg-a/",
        pkg: "rust_pkg_a_fixture",
        type: "minor",
        parents: [],
      },
      {
        dependencies: undefined,
        manager: "rust",
        path: "./pkg-b/",
        pkg: "rust_pkg_b_fixture",
        type: "minor",
        parents: [],
      },
    ];

    const config = {
      packages: {
        rust_pkg_a_fixture: {
          path: "./pkg-a/",
          manager: "rust",
        },
        rust_pkg_b_fixture: {
          path: "./pkg-b/",
          manager: "rust",
        },
      },
    };

    //@ts-ignore
    yield apply({ commands, config, cwd: rustFolder });

    const modifiedAPKGFile = yield loadFile("pkg-a/Cargo.toml", rustFolder);
    expect(modifiedAPKGFile.content).toBe(
      "[package]\n" +
        'name = "rust_pkg_a_fixture"\n' +
        'version = "0.6.0"\n' +
        "\n" +
        "[dependencies]\n" +
        'rust_pkg_b_fixture = "0.9.0"\n'
    );

    const modifiedBPKGFile = yield loadFile("pkg-b/Cargo.toml", rustFolder);
    expect(modifiedBPKGFile.content).toBe(
      "[package]\n" + 'name = "rust_pkg_b_fixture"\n' + 'version = "0.9.0"\n'
    );

    expect({
      //@ts-ignore
      consoleLog: console.log.mock.calls,
      //@ts-ignore
      consoleDir: console.dir.mock.calls,
    }).toMatchSnapshot();
  });

  it("bumps multi rust toml with object dep", function* () {
    const rustFolder = f.copy("pkg.rust-multi-object-dep");

    const commands = [
      {
        dependencies: ["rust_pkg_b_fixture"],
        manager: "rust",
        path: "./pkg-a/",
        pkg: "rust_pkg_a_fixture",
        type: "minor",
        parents: [],
      },
      {
        dependencies: undefined,
        manager: "rust",
        path: "./pkg-b/",
        pkg: "rust_pkg_b_fixture",
        type: "minor",
        parents: [],
      },
    ];

    const config = {
      packages: {
        rust_pkg_a_fixture: {
          path: "./pkg-a/",
          manager: "rust",
        },
        rust_pkg_b_fixture: {
          path: "./pkg-b/",
          manager: "rust",
        },
      },
    };

    //@ts-ignore
    yield apply({ commands, config, cwd: rustFolder });

    const modifiedAPKGFile = yield loadFile("pkg-a/Cargo.toml", rustFolder);
    expect(modifiedAPKGFile.content).toBe(
      "[package]\n" +
        'name = "rust_pkg_a_fixture"\n' +
        'version = "0.6.0"\n' +
        "\n" +
        "[dependencies]\n" +
        'rust_pkg_b_fixture = { version = "0.9.0", path = "../rust_pkg_b_fixture" }\n'
    );

    //@ts-ignore
    const modifiedBPKGFile = yield loadFile("pkg-b/Cargo.toml", rustFolder);
    expect(modifiedBPKGFile.content).toBe(
      "[package]\n" + 'name = "rust_pkg_b_fixture"\n' + 'version = "0.9.0"\n'
    );

    expect({
      //@ts-ignore
      consoleLog: console.log.mock.calls,
      //@ts-ignore
      consoleDir: console.dir.mock.calls,
    }).toMatchSnapshot();
  });

  it("bumps multi rust toml with dep missing patch", function* () {
    const rustFolder = f.copy("pkg.rust-multi-no-patch-dep");

    const commands = [
      {
        dependencies: ["rust_pkg_b_fixture"],
        manager: "rust",
        path: "./pkg-a/",
        pkg: "rust_pkg_a_fixture",
        type: "minor",
        parents: [],
      },
      {
        dependencies: undefined,
        manager: "rust",
        path: "./pkg-b/",
        pkg: "rust_pkg_b_fixture",
        type: "minor",
        parents: [],
      },
    ];

    const config = {
      packages: {
        rust_pkg_a_fixture: {
          path: "./pkg-a/",
          manager: "rust",
        },
        rust_pkg_b_fixture: {
          path: "./pkg-b/",
          manager: "rust",
        },
      },
    };

    //@ts-ignore
    yield apply({ commands, config, cwd: rustFolder });

    const modifiedAPKGFile = yield loadFile("pkg-a/Cargo.toml", rustFolder);
    expect(modifiedAPKGFile.content).toBe(
      "[package]\n" +
        'name = "rust_pkg_a_fixture"\n' +
        'version = "0.6.0"\n' +
        "\n" +
        "[dependencies]\n" +
        'rust_pkg_b_fixture = "0.9"\n'
    );

    //@ts-ignore
    const modifiedBPKGFile = yield loadFile("pkg-b/Cargo.toml", rustFolder);
    expect(modifiedBPKGFile.content).toBe(
      "[package]\n" + 'name = "rust_pkg_b_fixture"\n' + 'version = "0.9.0"\n'
    );

    expect({
      //@ts-ignore
      consoleLog: console.log.mock.calls,
      //@ts-ignore
      consoleDir: console.dir.mock.calls,
    }).toMatchSnapshot();
  });

  it("bumps multi rust toml as patch with object dep missing patch", function* () {
    const rustFolder = f.copy("pkg.rust-multi-object-no-patch-dep");

    const commands = [
      {
        dependencies: ["rust_pkg_b_fixture"],
        manager: "rust",
        path: "./pkg-a/",
        pkg: "rust_pkg_a_fixture",
        type: "patch",
        parents: [],
      },
      {
        dependencies: undefined,
        manager: "rust",
        path: "./pkg-b/",
        pkg: "rust_pkg_b_fixture",
        type: "patch",
        parents: [],
      },
    ];

    const config = {
      packages: {
        rust_pkg_a_fixture: {
          path: "./pkg-a/",
          manager: "rust",
        },
        rust_pkg_b_fixture: {
          path: "./pkg-b/",
          manager: "rust",
        },
      },
    };

    //@ts-ignore
    yield apply({ commands, config, cwd: rustFolder });

    const modifiedAPKGFile = yield loadFile("pkg-a/Cargo.toml", rustFolder);
    expect(modifiedAPKGFile.content).toBe(
      "[package]\n" +
        'name = "rust_pkg_a_fixture"\n' +
        'version = "0.5.1"\n' +
        "\n" +
        "[dependencies]\n" +
        'rust_pkg_b_fixture = { version = "0.8", path = "../rust_pkg_b_fixture" }\n'
    );

    const modifiedBPKGFile = yield loadFile("pkg-b/Cargo.toml", rustFolder);
    expect(modifiedBPKGFile.content).toBe(
      "[package]\n" + 'name = "rust_pkg_b_fixture"\n' + 'version = "0.8.9"\n'
    );

    expect({
      //@ts-ignore
      consoleLog: console.log.mock.calls,
      //@ts-ignore
      consoleDir: console.dir.mock.calls,
    }).toMatchSnapshot();
  });

  it("bumps multi rust toml as minor with object dep missing patch", function* () {
    const rustFolder = f.copy("pkg.rust-multi-object-no-patch-dep");

    const commands = [
      {
        dependencies: ["rust_pkg_b_fixture"],
        manager: "rust",
        path: "./pkg-a/",
        pkg: "rust_pkg_a_fixture",
        type: "minor",
        parents: [],
      },
      {
        dependencies: undefined,
        manager: "rust",
        path: "./pkg-b/",
        pkg: "rust_pkg_b_fixture",
        type: "minor",
        parents: [],
      },
    ];

    const config = {
      packages: {
        rust_pkg_a_fixture: {
          path: "./pkg-a/",
          manager: "rust",
        },
        rust_pkg_b_fixture: {
          path: "./pkg-b/",
          manager: "rust",
        },
      },
    };

    //@ts-ignore
    yield apply({ commands, config, cwd: rustFolder });

    const modifiedAPKGFile = yield loadFile("pkg-a/Cargo.toml", rustFolder);
    expect(modifiedAPKGFile.content).toBe(
      "[package]\n" +
        'name = "rust_pkg_a_fixture"\n' +
        'version = "0.6.0"\n' +
        "\n" +
        "[dependencies]\n" +
        'rust_pkg_b_fixture = { version = "0.9", path = "../rust_pkg_b_fixture" }\n'
    );

    const modifiedBPKGFile = yield loadFile("pkg-b/Cargo.toml", rustFolder);
    expect(modifiedBPKGFile.content).toBe(
      "[package]\n" + 'name = "rust_pkg_b_fixture"\n' + 'version = "0.9.0"\n'
    );

    expect({
      //@ts-ignore
      consoleLog: console.log.mock.calls,
      //@ts-ignore
      consoleDir: console.dir.mock.calls,
    }).toMatchSnapshot();
  });
});

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
        parents: [],
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

    //@ts-ignore
    yield apply({
      //@ts-ignore
      commands,
      config,
      cwd: jsonFolder,
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
      //@ts-ignore
      consoleLog: console.log.mock.calls,
      //@ts-ignore
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
        parents: [],
      },
      {
        dependencies: undefined,
        manager: "javascript",
        path: undefined,
        pkg: "yarn-workspace-base-pkg-b",
        type: "minor",
        parents: ["yarn-workspace-base-pkg-a"],
      },
      {
        dependencies: undefined,
        manager: "javascript",
        path: undefined,
        pkg: "all",
        type: "minor",
        parents: ["yarn-workspace-base-pkg-a", "yarn-workspace-base-pkg-b"],
      },
    ];

    const config = {
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

    //@ts-ignore
    yield apply({
      //@ts-ignore
      commands,
      //@ts-ignore
      config,
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
      //@ts-ignore
      consoleLog: console.log.mock.calls,
      //@ts-ignore
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
        parents: [],
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

    //@ts-ignore
    yield apply({
      //@ts-ignore
      commands,
      config,
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
      //@ts-ignore
      consoleLog: console.log.mock.calls,
      //@ts-ignore
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
        parents: [],
      },
      {
        dependencies: undefined,
        manager: "javascript",
        path: undefined,
        pkg: "yarn-workspace-base-pkg-b",
        type: "minor",
        parents: ["yarn-workspace-base-pkg-a"],
      },
      {
        dependencies: undefined,
        manager: "javascript",
        path: undefined,
        pkg: "all",
        type: "minor",
        parents: ["yarn-workspace-base-pkg-a", "yarn-workspace-base-pkg-b"],
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

    //@ts-ignore
    yield apply({
      //@ts-ignore
      commands,
      //@ts-ignore
      config,
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
      //@ts-ignore
      consoleLog: console.log.mock.calls,
      //@ts-ignore
      consoleDir: console.dir.mock.calls,
    }).toMatchSnapshot();
  });
});
