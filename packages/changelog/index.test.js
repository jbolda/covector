const { fillChangelogs } = require("./index");
const toVFile = require("to-vfile");
const mockConsole = require("jest-mock-console");
const fixtures = require("fixturez");
const f = fixtures(__dirname);

describe("changelog", () => {
  let restoreConsole;
  beforeEach(() => {
    restoreConsole = mockConsole(["log", "dir"]);
  });
  afterEach(() => {
    restoreConsole();
  });

  it("creates and fills a changelog", function* () {
    const projectFolder = f.copy("pkg.js-single-json");

    const applied = [
      {
        name: "js-single-json-fixture",
        version: "0.5.6",
      },
    ];

    const assembledChanges = {
      releases: {
        "js-single-json-fixture": {
          changes: [
            {
              releases: {
                "js-single-json-fixture": "patch",
              },
              summary: "This is a test.",
            },
            {
              releases: {
                "js-single-json-fixture": "patch",
              },
              summary: "This is another test.",
            },
            {
              releases: {
                "js-single-json-fixture": "patch",
              },
              summary: "This is the last test.",
            },
          ],
          type: "patch",
        },
      },
    };

    const config = {
      packages: {
        "js-single-json-fixture": {
          path: "./",
          manager: "javascript",
        },
      },
    };

    yield fillChangelogs({
      applied,
      assembledChanges,
      config,
      cwd: projectFolder,
    });

    const changelog = yield toVFile.read(
      projectFolder + "/CHANGELOG.md",
      "utf-8"
    );
    expect(changelog.contents).toBe(
      "# Changelog\n\n" +
        "## [0.5.6]\n\n" +
        "-   This is a test.\n" +
        "-   This is another test.\n" +
        "-   This is the last test.\n"
    );
  });

  it("creates and fills a changelog including meta and git info", function* () {
    const projectFolder = f.copy("pkg.js-single-json");

    const applied = [
      {
        name: "js-single-json-fixture",
        version: "0.5.6",
      },
    ];

    const assembledChanges = {
      releases: {
        "js-single-json-fixture": {
          changes: [
            {
              meta: {
                filename: ".changes/change-file.md",
                hashShort: "3ca0504",
                hashLong: "3ca05042c51821d229209e18391535c266b6b200",
                date: "2020-07-06",
                commitSubject: "feat: advanced commands, closes #43 (#71)",
              },
              releases: {
                "js-single-json-fixture": "patch",
              },
              summary: "This is a test.",
            },
            {
              meta: {
                filename: ".changes/change-file.md",
                hashShort: "3ca0504",
                hashLong: "3ca05042c51821d229209e18391535c266b6b200",
                date: "2020-07-06",
                commitSubject: "feat: advanced commands, closes #23 (#72)",
              },
              releases: {
                "js-single-json-fixture": "patch",
              },
              summary: "This is another test.",
            },
            {
              meta: {
                filename: ".changes/change-file.md",
                hashShort: "3ca0504",
                hashLong: "3ca05042c51821d229209e18391535c266b6b200",
                date: "2020-07-06",
                commitSubject: "feat: advanced commands, closes #49 (#73)",
              },
              releases: {
                "js-single-json-fixture": "patch",
              },
              summary: "This is the last test.",
            },
          ],
          type: "patch",
        },
      },
    };

    const config = {
      packages: {
        "js-single-json-fixture": {
          path: "./",
          manager: "javascript",
        },
      },
    };

    yield fillChangelogs({
      applied,
      assembledChanges,
      config,
      cwd: projectFolder,
    });

    const changelog = yield toVFile.read(
      projectFolder + "/CHANGELOG.md",
      "utf-8"
    );
    expect(changelog.contents).toBe(
      "# Changelog\n\n" +
        "## [0.5.6]\n\n" +
        "-   This is a test. [[3ca0504](/commit/3ca05042c51821d229209e18391535c266b6b200) feat: advanced commands, closes [#43](/pull/43) ([#71](/pull/71))]\n" +
        "-   This is another test. [[3ca0504](/commit/3ca05042c51821d229209e18391535c266b6b200) feat: advanced commands, closes [#23](/pull/23) ([#72](/pull/72))]\n" +
        "-   This is the last test. [[3ca0504](/commit/3ca05042c51821d229209e18391535c266b6b200) feat: advanced commands, closes [#49](/pull/49) ([#73](/pull/73))]\n"
    );
  });

  it("creates a changelog for nicknamed pkgs", function* () {
    const projectFolder = f.copy("pkg.js-single-json");
    // note the name in this package file is js-single-json-fixture
    // we use a "nickname" in our change files

    const applied = [
      {
        name: "pkg-nickname",
        version: "0.5.6",
      },
    ];

    const assembledChanges = {
      releases: {
        "pkg-nickname": {
          changes: [
            {
              releases: {
                "pkg-nickname": "patch",
              },
              summary: "This is a test.",
            },
            {
              releases: {
                "pkg-nickname": "patch",
              },
              summary: "This is another test.",
            },
            {
              releases: {
                "pkg-nickname": "patch",
              },
              summary: "This is the last test.",
            },
          ],
          type: "patch",
        },
      },
    };

    const config = {
      packages: {
        "pkg-nickname": {
          path: "./",
          manager: "javascript",
        },
      },
    };

    yield fillChangelogs({
      applied,
      assembledChanges,
      config,
      cwd: projectFolder,
    });

    const changelog = yield toVFile.read(
      projectFolder + "/CHANGELOG.md",
      "utf-8"
    );
    expect(changelog.contents).toBe(
      "# Changelog\n\n" +
        "## [0.5.6]\n\n" +
        "-   This is a test.\n" +
        "-   This is another test.\n" +
        "-   This is the last test.\n"
    );
  });

  it("inserts into an existing changelog", function* () {
    const projectFolder = f.copy("changelog.js-single-exists");

    const applied = [
      {
        name: "changelog-js-pkg-fixture",
        version: "0.9.0",
      },
    ];

    const assembledChanges = {
      releases: {
        "changelog-js-pkg-fixture": {
          changes: [
            {
              releases: {
                "changelog-js-pkg-fixture": "patch",
              },
              summary: "This is a test.",
            },
            {
              releases: {
                "changelog-js-pkg-fixture": "patch",
              },
              summary: "This is another test.",
            },
            {
              releases: {
                "changelog-js-pkg-fixture": "minor",
              },
              summary: "This is the last test.",
            },
          ],
          type: "minor",
        },
      },
    };

    const config = {
      packages: {
        "changelog-js-pkg-fixture": {
          path: "./",
          manager: "javascript",
        },
      },
    };

    yield fillChangelogs({
      applied,
      assembledChanges,
      config,
      cwd: projectFolder,
    });

    const changelog = yield toVFile.read(
      projectFolder + "/CHANGELOG.md",
      "utf-8"
    );
    expect(changelog.contents).toBe(
      "# Changelog\n\n" +
        "## [0.9.0]\n\n" +
        "-   This is a test.\n" +
        "-   This is another test.\n" +
        "-   This is the last test.\n\n" +
        "## [0.8.16]\n\n" +
        "-   Adds a command line interface option to tauri apps, configurable under tauri.conf.json > tauri > cli.\n" +
        "-   Fixes no-server mode not running on another machine due to fs::read_to_string usage instead of the include_str macro.\n" +
        "    Build no longer fails when compiling without environment variables, now the app will show an error.\n" +
        "-   Adds desktop notifications API.\n" +
        "-   Properly reflect tauri.conf.json changes on app when running tauri dev.\n"
    );

    expect({
      consoleLog: console.log.mock.calls,
      consoleDir: console.dir.mock.calls,
    }).toMatchSnapshot();
  });
});
