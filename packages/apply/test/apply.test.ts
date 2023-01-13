import { apply } from "../src";
import { loadFile, readAllPkgFiles } from "@covector/files";
import { it, captureError } from "@effection/jest";
import mockConsole, { RestoreConsole } from "jest-mock-console";
import fixtures from "fixturez";
import { ConfigFile } from "@covector/types";
const f = fixtures(__dirname);

const configDefaults = {
  changeFolder: ".changes",
};

const allPackagesWithoutRead = ({ config }: { config: ConfigFile }) =>
  Object.entries(config.packages)
    .map(([pkgName, configInfo]) => ({
      name: pkgName,
      version: "none",
      deps: !configInfo.dependencies
        ? undefined
        : configInfo.dependencies.reduce((deps: Record<string, any>, dep) => {
            deps[dep] = [{ type: "dependencies", version: "none" }];
            return deps;
          }, {}),
    }))
    .reduce((pkgs: Record<string, any>, pkg: Record<string, any>) => {
      pkgs[pkg.name] = pkg;
      return pkgs;
    }, {});

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

    //@ts-expect-error
    yield apply({ commands, config, allPackages, cwd: jsonFolder });
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
      //@ts-expect-error
      consoleLog: console.log.mock.calls,
      //@ts-expect-error
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
        parents: {},
      },
    ];

    const config = {
      ...configDefaults,
      packages: {
        "rust-single-fixture": {
          path: "./",
          manager: "rust",
        },
      },
    };

    const allPackages = yield readAllPkgFiles({ config, cwd: rustFolder });

    //@ts-expect-error
    yield apply({ commands, config, allPackages, cwd: rustFolder });
    const modifiedFile = yield loadFile("Cargo.toml", rustFolder);
    expect(modifiedFile.content).toBe(
      '[package]\nname = "rust-single-fixture"\nversion = "0.6.0"\n'
    );

    expect({
      //@ts-expect-error
      consoleLog: console.log.mock.calls,
      //@ts-expect-error
      consoleDir: console.dir.mock.calls,
    }).toMatchSnapshot();
  });

  it("bumps single yaml toml", function* () {
    const flutterFolder = f.copy("pkg.dart-flutter-single");

    const commands = [
      {
        dependencies: undefined,
        manager: "flutter",
        path: "./",
        pkg: "test_app",
        type: "minor",
        parents: {},
      },
    ];

    const config = {
      ...configDefaults,
      packages: {
        test_app: {
          path: "./",
          manager: "flutter",
        },
      },
    };

    const allPackages = yield readAllPkgFiles({ config, cwd: flutterFolder });

    //@ts-expect-error
    yield apply({ commands, config, allPackages, cwd: flutterFolder });
    const modifiedFile = yield loadFile("pubspec.yaml", flutterFolder);
    expect(modifiedFile.content).toBe(
      "name: test_app\ndescription: a great one\nhomepage: https://github.com/\nversion: 0.4.0\n" +
        "environment:\n  sdk: '>=2.10.0 <3.0.0'\n" +
        "dependencies:\n  flutter:\n    sdk: flutter\n  meta: any\n  provider: ^4.3.2\n  related_package:\n    git:\n      url: git@github.com:jbolda/covector.git\n      ref: main\n      path: __fixtures__/haha/\n" +
        "dev_dependencies:\n  flutter_test:\n    sdk: flutter\n  build_runner: any\n  json_serializable: any\n  mobx_codegen: any\n" +
        "flutter:\n  assets:\n    - assets/schema/\n    - assets/localization/\n"
    );

    expect({
      //@ts-expect-error
      consoleLog: console.log.mock.calls,
      //@ts-expect-error
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
        parents: {},
        errorOnVersionRange: ">= 0.6.0",
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
    const applied = yield captureError(
      //@ts-expect-error
      apply({ commands, config, allPackages, cwd: jsonFolder })
    );
    expect(applied.message).toBe(
      "js-single-json-fixture will be bumped to 0.6.0. This satisfies the range >= 0.6.0 which the configuration disallows. Please adjust your bump to accommodate the range or otherwise adjust the allowed range in `errorOnVersionRange`."
    );
    expect({
      //@ts-expect-error
      consoleLog: console.log.mock.calls,
      //@ts-expect-error
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
        parents: {},
        errorOnVersionRange: ">= 0.6.0",
      },
    ];

    const config = {
      ...configDefaults,
      packages: {
        "rust-single-fixture": {
          path: "./",
          manager: "rust",
        },
      },
    };

    const allPackages = yield readAllPkgFiles({ config, cwd: rustFolder });

    const applied = yield captureError(
      //@ts-expect-error
      apply({ commands, config, allPackages, cwd: rustFolder })
    );
    expect(applied.message).toBe(
      "rust-single-fixture will be bumped to 0.6.0. This satisfies the range >= 0.6.0 which the configuration disallows. Please adjust your bump to accommodate the range or otherwise adjust the allowed range in `errorOnVersionRange`."
    );
    expect({
      //@ts-expect-error
      consoleLog: console.log.mock.calls,
      //@ts-expect-error
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

    //@ts-expect-error
    const allPackages = yield readAllPkgFiles({ config, cwd: jsonFolder });

    //@ts-expect-error
    yield apply({ commands, config, allPackages, cwd: jsonFolder });
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
      //@ts-expect-error
      consoleLog: console.log.mock.calls,
      //@ts-expect-error
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
        parents: {},
      },
      {
        dependencies: undefined,
        manager: "rust",
        path: "./pkg-b/",
        pkg: "rust_pkg_b_fixture",
        type: "minor",
        parents: {},
      },
    ];

    const config = {
      ...configDefaults,
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

    const allPackages = yield readAllPkgFiles({ config, cwd: rustFolder });

    //@ts-expect-error
    yield apply({ commands, config, allPackages, cwd: rustFolder });

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
      //@ts-expect-error
      consoleLog: console.log.mock.calls,
      //@ts-expect-error
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
        parents: {},
      },
      {
        dependencies: undefined,
        manager: "rust",
        path: "./pkg-b/",
        pkg: "rust_pkg_b_fixture",
        type: "minor",
        parents: {},
      },
    ];

    const config = {
      ...configDefaults,
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

    const allPackages = yield readAllPkgFiles({ config, cwd: rustFolder });

    //@ts-expect-error
    yield apply({ commands, config, allPackages, cwd: rustFolder });

    const modifiedAPKGFile = yield loadFile("pkg-a/Cargo.toml", rustFolder);
    expect(modifiedAPKGFile.content).toBe(
      "[package]\n" +
        'name = "rust_pkg_a_fixture"\n' +
        'version = "0.6.0"\n' +
        "\n" +
        "[dependencies]\n" +
        'rust_pkg_b_fixture = { version = "0.9.0", path = "../rust_pkg_b_fixture" }\n'
    );

    const modifiedBPKGFile = yield loadFile("pkg-b/Cargo.toml", rustFolder);
    expect(modifiedBPKGFile.content).toBe(
      "[package]\n" + 'name = "rust_pkg_b_fixture"\n' + 'version = "0.9.0"\n'
    );

    expect({
      //@ts-expect-error
      consoleLog: console.log.mock.calls,
      //@ts-expect-error
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
        parents: {},
      },
      {
        dependencies: undefined,
        manager: "rust",
        path: "./pkg-b/",
        pkg: "rust_pkg_b_fixture",
        type: "minor",
        parents: {},
      },
    ];

    const config = {
      ...configDefaults,
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

    const allPackages = yield readAllPkgFiles({ config, cwd: rustFolder });

    //@ts-expect-error
    yield apply({ commands, config, allPackages, cwd: rustFolder });

    const modifiedAPKGFile = yield loadFile("pkg-a/Cargo.toml", rustFolder);
    expect(modifiedAPKGFile.content).toBe(
      "[package]\n" +
        'name = "rust_pkg_a_fixture"\n' +
        'version = "0.6.0"\n' +
        "\n" +
        "[dependencies]\n" +
        'rust_pkg_b_fixture = "0.9"\n'
    );

    const modifiedBPKGFile = yield loadFile("pkg-b/Cargo.toml", rustFolder);
    expect(modifiedBPKGFile.content).toBe(
      "[package]\n" + 'name = "rust_pkg_b_fixture"\n' + 'version = "0.9.0"\n'
    );

    expect({
      //@ts-expect-error
      consoleLog: console.log.mock.calls,
      //@ts-expect-error
      consoleDir: console.dir.mock.calls,
    }).toMatchSnapshot();
  });

  it("bump multi rust toml as patch with object dep missing patch", function* () {
    const rustFolder = f.copy("pkg.rust-multi-object-no-patch-dep");

    const commands = [
      {
        dependencies: ["rust_pkg_b_fixture"],
        manager: "rust",
        path: "./pkg-a/",
        pkg: "rust_pkg_a_fixture",
        type: "patch",
        parents: {},
      },
      {
        dependencies: undefined,
        manager: "rust",
        path: "./pkg-b/",
        pkg: "rust_pkg_b_fixture",
        type: "patch",
        parents: {},
      },
    ];

    const config = {
      ...configDefaults,
      packages: {
        rust_pkg_a_fixture: {
          // version: 0.5.0 with 0.8 dep on pkg-b
          path: "./pkg-a/",
          manager: "rust",
        },
        rust_pkg_b_fixture: {
          // version: 0.8.8
          path: "./pkg-b/",
          manager: "rust",
        },
      },
    };

    const allPackages = yield readAllPkgFiles({ config, cwd: rustFolder });

    //@ts-expect-error
    yield apply({ commands, config, allPackages, cwd: rustFolder });

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
      //@ts-expect-error
      consoleLog: console.log.mock.calls,
      //@ts-expect-error
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
        parents: {},
      },
      {
        dependencies: undefined,
        manager: "rust",
        path: "./pkg-b/",
        pkg: "rust_pkg_b_fixture",
        type: "minor",
        parents: {},
      },
    ];

    const config = {
      ...configDefaults,
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

    const allPackages = yield readAllPkgFiles({ config, cwd: rustFolder });

    //@ts-expect-error
    yield apply({ commands, config, allPackages, cwd: rustFolder });

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
      //@ts-expect-error
      consoleLog: console.log.mock.calls,
      //@ts-expect-error
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

    //@ts-expect-error
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

    //@ts-expect-error
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
