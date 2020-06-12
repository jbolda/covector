const { apply } = require("./index");
const toVFile = require("to-vfile");
const mockConsole = require("jest-mock-console");
const fixtures = require("fixturez");
const f = fixtures(__dirname);

describe("package file apply bump", () => {
  let restoreConsole;
  beforeEach(() => {
    restoreConsole = mockConsole(["log", "dir"]);
  });
  afterEach(() => {
    restoreConsole();
  });

    const jsonFolder = f.copy("pkg.js-single-json");
    const originalVFile = await toVFile.read(
      jsonFolder + "/package.json",
      "utf-8"
    );

  it("bumps single rust toml", function* () {
    const rustFolder = f.copy("pkg.rust-single");

    const changeList = [
      {
        dependencies: undefined,
        manager: "rust",
        path: "./",
        pkg: "rust-single-fixture",
        type: "minor",
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

    yield apply({ changeList, config, cwd: rustFolder });
    const modifiedVFile = yield toVFile.read(
      rustFolder + "/Cargo.toml",
      "utf-8"
    );
    expect(modifiedVFile.contents).toBe(
      '[package]\nname = "rust-single-fixture"\nversion = "0.6.0"\n'
    );

    expect({
      consoleLog: console.log.mock.calls,
      consoleDir: console.dir.mock.calls,
    }).toMatchSnapshot();
  });

  it("bumps multi rust toml", function* () {
    const rustFolder = f.copy("pkg.rust-multi");

    const changeList = [
      {
        dependencies: ["rust_pkg_b_fixture"],
        manager: "rust",
        path: "./pkg-a/",
        pkg: "rust_pkg_a_fixture",
        type: "minor",
      },
      {
        dependencies: undefined,
        manager: "rust",
        path: "./pkg-b/",
        pkg: "rust_pkg_b_fixture",
        type: "minor",
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

    yield apply({ changeList, config, cwd: rustFolder });

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

    const modifiedBPKGVFile = yield toVFile.read(
      rustFolder + "/pkg-b/Cargo.toml",
      "utf-8"
    );
    expect(modifiedBPKGVFile.contents).toBe(
      "[package]\n" + 'name = "rust_pkg_b_fixture"\n' + 'version = "0.9.0"\n'
    );

    expect({
      consoleLog: console.log.mock.calls,
      consoleDir: console.dir.mock.calls,
    }).toMatchSnapshot();
  });
});
