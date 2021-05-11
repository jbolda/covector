import { apply, changesConsideringParents, validateApply } from "./index";
//@ts-ignore
import toVFile from "to-vfile";
import mockConsole, { RestoreConsole } from "jest-mock-console";
import fixtures from "fixturez";
const f = fixtures(__dirname);

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
    //@ts-ignore
    const modifiedVFile = yield toVFile.read(
      jsonFolder + "/package.json",
      "utf-8"
    );
    expect(modifiedVFile.contents).toBe(
      "{\n" +
        '  "private": true,\n' +
        '  "name": "js-single-json-fixture",\n' +
        '  "description": "A single package at the root. No monorepo setup.",\n' +
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
    //@ts-ignore
    const modifiedVFile = yield toVFile.read(
      rustFolder + "/Cargo.toml",
      "utf-8"
    );
    expect(modifiedVFile.contents).toBe(
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
    //@ts-ignore
    const modifiedVFile = yield toVFile.read(
      rustFolder + "/pubspec.yaml",
      "utf-8"
    );
    expect(modifiedVFile.contents).toBe(
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
    //@ts-ignore
    const modifiedPkgAVFile = yield toVFile.read(
      jsonFolder + "/packages/pkg-a/package.json",
      "utf-8"
    );
    expect(modifiedPkgAVFile.contents).toBe(
      "{\n" +
        '  "name": "yarn-workspace-base-pkg-a",\n' +
        '  "version": "1.1.0",\n' +
        '  "dependencies": {\n' +
        '    "yarn-workspace-base-pkg-b": "1.1.0"\n' +
        "  }\n" +
        "}\n"
    );

    //@ts-ignore
    const modifiedPkgBVFile = yield toVFile.read(
      jsonFolder + "/packages/pkg-b/package.json",
      "utf-8"
    );
    expect(modifiedPkgBVFile.contents).toBe(
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

    //@ts-ignore
    const modifiedAPKGVFile = yield toVFile.read(
      rustFolder + "/pkg-a/Cargo.toml",
      "utf-8"
    );
    expect(modifiedAPKGVFile.contents).toBe(
      "[package]\n" +
        'name = "rust_pkg_a_fixture"\n' +
        'version = "0.6.0"\n' +
        "\n" +
        "[dependencies]\n" +
        'rust_pkg_b_fixture = "0.9.0"\n'
    );

    //@ts-ignore
    const modifiedBPKGVFile = yield toVFile.read(
      rustFolder + "/pkg-b/Cargo.toml",
      "utf-8"
    );
    expect(modifiedBPKGVFile.contents).toBe(
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

    //@ts-ignore
    const modifiedAPKGVFile = yield toVFile.read(
      rustFolder + "/pkg-a/Cargo.toml",
      "utf-8"
    );
    expect(modifiedAPKGVFile.contents).toBe(
      "[package]\n" +
        'name = "rust_pkg_a_fixture"\n' +
        'version = "0.6.0"\n' +
        "\n" +
        "[dependencies]\n" +
        'rust_pkg_b_fixture = { version = "0.9.0", path = "../rust_pkg_b_fixture" }\n'
    );

    //@ts-ignore
    const modifiedBPKGVFile = yield toVFile.read(
      rustFolder + "/pkg-b/Cargo.toml",
      "utf-8"
    );
    expect(modifiedBPKGVFile.contents).toBe(
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

    //@ts-ignore
    const modifiedAPKGVFile = yield toVFile.read(
      rustFolder + "/pkg-a/Cargo.toml",
      "utf-8"
    );
    expect(modifiedAPKGVFile.contents).toBe(
      "[package]\n" +
        'name = "rust_pkg_a_fixture"\n' +
        'version = "0.6.0"\n' +
        "\n" +
        "[dependencies]\n" +
        'rust_pkg_b_fixture = "0.9"\n'
    );

    //@ts-ignore
    const modifiedBPKGVFile = yield toVFile.read(
      rustFolder + "/pkg-b/Cargo.toml",
      "utf-8"
    );
    expect(modifiedBPKGVFile.contents).toBe(
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

    //@ts-ignore
    const modifiedAPKGVFile = yield toVFile.read(
      rustFolder + "/pkg-a/Cargo.toml",
      "utf-8"
    );
    expect(modifiedAPKGVFile.contents).toBe(
      "[package]\n" +
        'name = "rust_pkg_a_fixture"\n' +
        'version = "0.5.1"\n' +
        "\n" +
        "[dependencies]\n" +
        'rust_pkg_b_fixture = { version = "0.8", path = "../rust_pkg_b_fixture" }\n'
    );

    //@ts-ignore
    const modifiedBPKGVFile = yield toVFile.read(
      rustFolder + "/pkg-b/Cargo.toml",
      "utf-8"
    );
    expect(modifiedBPKGVFile.contents).toBe(
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

    //@ts-ignore
    const modifiedAPKGVFile = yield toVFile.read(
      rustFolder + "/pkg-a/Cargo.toml",
      "utf-8"
    );
    expect(modifiedAPKGVFile.contents).toBe(
      "[package]\n" +
        'name = "rust_pkg_a_fixture"\n' +
        'version = "0.6.0"\n' +
        "\n" +
        "[dependencies]\n" +
        'rust_pkg_b_fixture = { version = "0.9", path = "../rust_pkg_b_fixture" }\n'
    );

    //@ts-ignore
    const modifiedBPKGVFile = yield toVFile.read(
      rustFolder + "/pkg-b/Cargo.toml",
      "utf-8"
    );
    expect(modifiedBPKGVFile.contents).toBe(
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

describe("list changes considering parents", () => {
  let restoreConsole: RestoreConsole;
  beforeEach(() => {
    restoreConsole = mockConsole(["log", "dir"]);
  });
  afterEach(() => {
    restoreConsole();
  });

  it("adds changes for dependency", () => {
    const assembledChanges = {
      releases: {
        all: {
          dependencies: undefined,
          manager: "javascript",
          path: undefined,
          pkg: "all",
          type: "minor",
        },
      },
    };

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
    const changes = changesConsideringParents({ assembledChanges, config });

    expect({
      //@ts-ignore
      consoleLog: console.log.mock.calls,
      //@ts-ignore
      consoleDir: console.dir.mock.calls,
      changes,
    }).toMatchSnapshot();
  });

  it("bumps patch due to dependency bump", () => {
    const assembledChanges = {
      releases: {
        "yarn-workspace-base-pkg-a": {
          dependencies: undefined,
          manager: "javascript",
          path: undefined,
          pkg: "all",
          type: "patch",
        },
        all: {
          dependencies: undefined,
          manager: "javascript",
          path: undefined,
          pkg: "all",
          type: "minor",
        },
      },
    };

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
    const changes = changesConsideringParents({ assembledChanges, config });

    expect({
      //@ts-ignore
      consoleLog: console.log.mock.calls,
      //@ts-ignore
      consoleDir: console.dir.mock.calls,
      changes,
    }).toMatchSnapshot();
  });

  it("rolls up the parent bumps", () => {
    const changesFiles = [
      {
        releases: {
          "pkg-c": "patch",
          "pkg-d": "major",
        },
        summary:
          "This should patch bump up the pkg-[number] line to where pkg-one also receives a bump. The pkg-c writes to a patch so we patch bump up that line too.",
        meta: {},
      },
      {
        releases: {
          "pkg-b": "minor",
        },
        summary:
          "The pkg-b doesn't have a dep bump, but can dep bump pkg-a and pkg-overall with a patch.",
        meta: {},
      },
    ];

    const assembledChanges = {
      releases: {
        "pkg-b": {
          type: "minor",
          changes: [changesFiles[1]],
        },
        "pkg-c": {
          type: "patch",
          changes: [changesFiles[0]],
        },
        "pkg-d": {
          type: "major",
          changes: [changesFiles[0]],
        },
      },
    };

    const config = {
      packages: {
        "pkg-overall": {
          path: "./packages/pkg-overall/",
          manager: "javascript",
          dependencies: ["pkg-a", "pkg-b"],
        },
        "pkg-a": {
          path: "./packages/pkg-a/",
          manager: "javascript",
          dependencies: ["pkg-c"],
        },
        "pkg-b": {
          path: "./packages/pkg-b/",
          manager: "javascript",
          dependencies: [],
        },
        "pkg-c": {
          path: "./packages/pkg-c/",
          manager: "javascript",
          dependencies: ["pkg-d"],
        },
        "pkg-d": {
          path: "./packages/pkg-d/",
          manager: "javascript",
          dependencies: [],
        },
        "pkg-one": {
          path: "./packages/pkg-one/",
          manager: "javascript",
          dependencies: ["pkg-two"],
        },
        "pkg-two": {
          path: "./packages/pkg-two/",
          manager: "javascript",
          dependencies: ["pkg-three"],
        },
        "pkg-three": {
          path: "./packages/pkg-three/",
          manager: "javascript",
          dependencies: ["pkg-four"],
        },
        "pkg-four": {
          path: "./packages/pkg-four/",
          manager: "javascript",
          dependencies: ["pkg-d"],
        },
      },
    };

    //@ts-ignore
    const changes = changesConsideringParents({ assembledChanges, config });
    // console.error(changes)

    // these are directly defined in the change files
    expect(changes.releases["pkg-b"].type).toBe("minor");
    expect(changes.releases["pkg-c"].type).toBe("patch");
    expect(changes.releases["pkg-d"].type).toBe("major");

    // these are the top level rolled up
    expect(changes.releases["pkg-overall"].type).toBe("patch");
    expect(changes.releases["pkg-a"].type).toBe("patch");

    // rolls up from pkg-d
    expect(changes.releases["pkg-four"].type).toBe("patch");
    expect(changes.releases["pkg-three"].type).toBe("patch");
    expect(changes.releases["pkg-two"].type).toBe("patch");
    expect(changes.releases["pkg-one"].type).toBe("patch");

    expect({
      //@ts-ignore
      consoleLog: console.log.mock.calls,
      //@ts-ignore
      consoleDir: console.dir.mock.calls,
      changes,
    }).toMatchSnapshot();
  });
});

describe("package file apply bump (async/await)", () => {
  it("bumps single js json", async () => {
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

    expect.assertions(1);
    await expect(async () =>
      //@ts-ignore
      validateApply({ commands, config, cwd: jsonFolder })
    ).not.toThrow();
  });

  it("bumps single rust toml", async () => {
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

    expect.assertions(1);
    await expect(async () =>
      //@ts-ignore
      validateApply({ commands, config, cwd: rustFolder })
    ).not.toThrow();
  });

  it("bumps multi js json", async () => {
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

    expect.assertions(1);
    await expect(async () =>
      //@ts-ignore
      validateApply({ commands, config, cwd: jsonFolder })
    ).not.toThrow();
  });

  it("bumps multi rust toml", async () => {
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

    expect.assertions(1);
    await expect(async () =>
      //@ts-ignore
      validateApply({ commands, config, cwd: rustFolder })
    ).not.toThrow();
  });

  it("bumps multi rust toml with object dep", async () => {
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

    expect.assertions(1);
    await expect(async () =>
      //@ts-ignore
      validateApply({ commands, config, cwd: rustFolder })
    ).not.toThrow();
  });

  it("bumps multi rust toml with dep missing patch", async () => {
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

    expect.assertions(1);
    await expect(async () =>
      //@ts-ignore
      validateApply({ commands, config, cwd: rustFolder })
    ).not.toThrow();
  });

  it("bumps multi rust toml as patch with object dep missing patch", async () => {
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

    expect.assertions(1);
    const validated = await validateApply({
      //@ts-ignore
      commands,
      config,
      cwd: rustFolder,
    });
    expect(validated).toBe(true);
  });

  it("bumps multi rust toml as minor with object dep without version number", async () => {
    let restoreConsole = mockConsole(["error"]);

    const rustFolder = f.copy("pkg.rust-multi-object-path-dep-only");

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

    expect.assertions(2);
    try {
      //@ts-ignore
      await validateApply({ commands, config, cwd: rustFolder });
    } catch (e) {
      expect(e.message).toMatch(
        "rust_pkg_a_fixture has a dependency on rust_pkg_b_fixture, and rust_pkg_b_fixture does not have a version number. " +
          "This cannot be published. Please pin it to a MAJOR.MINOR.PATCH reference."
      );
    }

    expect({
      //@ts-ignore
      consoleError: console.error.mock.calls,
    }).toMatchSnapshot();

    restoreConsole();
  });
});

describe("packge file applies preview bump", () => {
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
      packages: {
        "js-single-json-fixture": {
          path: "./",
          manager: "javascript",
        },
      },
    };

    yield apply({
      //@ts-ignore
      commands,
      config,
      cwd: jsonFolder,
      previewVersion: "branch-name.12345",
    });
    //@ts-ignore
    const modifiedVFile = yield toVFile.read(
      jsonFolder + "/package.json",
      "utf-8"
    );
    expect(modifiedVFile.contents).toBe(
      "{\n" +
        '  "private": true,\n' +
        '  "name": "js-single-json-fixture",\n' +
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

    yield apply({
      //@ts-ignore
      commands,
      //@ts-ignore
      config,
      cwd: jsonFolder,
      previewVersion: "branch-name.12345",
    });
    //@ts-ignore
    const modifiedPkgAVFile = yield toVFile.read(
      jsonFolder + "/packages/pkg-a/package.json",
      "utf-8"
    );
    expect(modifiedPkgAVFile.contents).toBe(
      "{\n" +
        '  "name": "yarn-workspace-base-pkg-a",\n' +
        '  "version": "1.0.0-branch-name.12345",\n' +
        '  "dependencies": {\n' +
        '    "yarn-workspace-base-pkg-b": "1.0.0-branch-name.12345"\n' +
        "  }\n" +
        "}\n"
    );

    //@ts-ignore
    const modifiedPkgBVFile = yield toVFile.read(
      jsonFolder + "/packages/pkg-b/package.json",
      "utf-8"
    );
    expect(modifiedPkgBVFile.contents).toBe(
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
