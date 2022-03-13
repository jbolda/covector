import {
  fillChangelogs,
  pullLastChangelog,
  pipeChangelogToCommands,
} from "../src";
import { it } from "@effection/jest";
//@ts-ignore
import toVFile from "to-vfile";
import mockConsole, { RestoreConsole } from "jest-mock-console";
import fixtures from "fixturez";
const f = fixtures(__dirname);

describe("changelog", () => {
  let restoreConsole: RestoreConsole;
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
      //@ts-ignore
      assembledChanges,
      config,
      cwd: projectFolder,
    });

    //@ts-ignore
    const changelog = yield toVFile.read(
      projectFolder + "/CHANGELOG.md",
      "utf-8"
    );
    expect(changelog.contents).toBe(
      "# Changelog\n\n" +
        "## \\[0.5.6]\n\n" +
        "- This is a test.\n" +
        "- This is another test.\n" +
        "- This is the last test.\n"
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
                commits: [
                  {
                    filename: ".changes/change-file.md",
                    hashShort: "3ca0504",
                    hashLong: "3ca05042c51821d229209e18391535c266b6b200",
                    date: "2020-07-06",
                    commitSubject:
                      "feat: advanced commands, closes #43 (#719999)",
                  },
                ],
              },
              releases: {
                "js-single-json-fixture": "patch",
              },
              summary: "This is a test.",
            },
            {
              meta: {
                commits: [
                  {
                    filename: ".changes/change-file.md",
                    hashShort: "3ca0504",
                    hashLong: "3ca05042c51821d229209e18391535c266b6b200",
                    date: "2020-07-06",
                    commitSubject: "feat: advanced commands, closes #23 (#123)",
                  },
                ],
              },
              releases: {
                "js-single-json-fixture": "patch",
              },
              summary: "This is another test.",
            },
            {
              meta: {
                commits: [
                  {
                    filename: ".changes/change-file.md",
                    hashShort: "3ca0504",
                    hashLong: "3ca05042c51821d229209e18391535c266b6b200",
                    date: "2020-07-06",
                    commitSubject: "feat: advanced commands, closes #9 (#8873)",
                  },
                ],
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
      //@ts-ignore
      assembledChanges,
      config,
      cwd: projectFolder,
    });

    //@ts-ignore
    const changelog = yield toVFile.read(
      projectFolder + "/CHANGELOG.md",
      "utf-8"
    );
    expect(changelog.contents).toBe(
      "# Changelog\n\n" +
        "## \\[0.5.6]\n\n" +
        "- This is a test.\n" +
        "  - [3ca0504](/commit/3ca05042c51821d229209e18391535c266b6b200) feat: advanced commands, closes [#43](/pull/43) ([#719999](/pull/719999)) on 2020-07-06\n" +
        "- This is another test.\n" +
        "  - [3ca0504](/commit/3ca05042c51821d229209e18391535c266b6b200) feat: advanced commands, closes [#23](/pull/23) ([#123](/pull/123)) on 2020-07-06\n" +
        "- This is the last test.\n" +
        "  - [3ca0504](/commit/3ca05042c51821d229209e18391535c266b6b200) feat: advanced commands, closes [#9](/pull/9) ([#8873](/pull/8873)) on 2020-07-06\n"
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
      //@ts-ignore
      assembledChanges,
      config,
      cwd: projectFolder,
    });

    //@ts-ignore
    const changelog = yield toVFile.read(
      projectFolder + "/CHANGELOG.md",
      "utf-8"
    );
    expect(changelog.contents).toBe(
      "# Changelog\n\n" +
        "## \\[0.5.6]\n\n" +
        "- This is a test.\n" +
        "- This is another test.\n" +
        "- This is the last test.\n"
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
      //@ts-ignore
      assembledChanges,
      config,
      cwd: projectFolder,
    });

    //@ts-ignore
    const changelog = yield toVFile.read(
      projectFolder + "/CHANGELOG.md",
      "utf-8"
    );
    expect(changelog.contents).toBe(
      "# Changelog\n\n" +
        "## \\[0.9.0]\n\n" +
        "- This is a test.\n" +
        "- This is another test.\n" +
        "- This is the last test.\n\n" +
        "## \\[0.8.16]\n\n" +
        "- Adds a command line interface option to tauri apps, configurable under tauri.conf.json > tauri > cli.\n" +
        "- Fixes no-server mode not running on another machine due to fs::read_to_string usage instead of the include_str macro.\n" +
        "- Build no longer fails when compiling without environment variables, now the app will show an error.\n" +
        "- Adds desktop notifications API.\n" +
        "- Properly reflect tauri.conf.json changes on app when running tauri dev.\n"
    );

    expect({
      //@ts-ignore
      consoleLog: console.log.mock.calls,
      //@ts-ignore
      consoleDir: console.dir.mock.calls,
    }).toMatchSnapshot();
  });

  it("reads back the recent change", function* () {
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
                commits: [
                  {
                    filename: ".changes/change-file.md",
                    hashShort: "3ca0504",
                    hashLong: "3ca05042c51821d229209e18391535c266b6b200",
                    date: "2020-07-06",
                    commitSubject:
                      "feat: advanced commands, closes #43 (#719999)",
                  },
                ],
              },
              releases: {
                "js-single-json-fixture": "patch",
              },
              summary: "This is a test.",
            },
            {
              meta: {
                commits: [
                  {
                    filename: ".changes/change-file.md",
                    hashShort: "3ca0504",
                    hashLong: "3ca05042c51821d229209e18391535c266b6b200",
                    date: "2020-07-06",
                    commitSubject: "feat: advanced commands, closes #23 (#123)",
                  },
                ],
              },
              releases: {
                "js-single-json-fixture": "patch",
              },
              summary: "This is another test.",
            },
            {
              meta: {
                commits: [
                  {
                    filename: ".changes/change-file.md",
                    hashShort: "3ca0504",
                    hashLong: "3ca05042c51821d229209e18391535c266b6b200",
                    date: "2020-07-06",
                    commitSubject: "feat: advanced commands, closes #9 (#8873)",
                  },
                ],
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

    const pkgName = "js-single-json-fixture";

    const config = {
      packages: {
        [pkgName]: {
          path: "./",
          manager: "javascript",
        },
      },
    };

    yield fillChangelogs({
      applied,
      //@ts-ignore
      assembledChanges,
      config,
      cwd: projectFolder,
    });

    let pkgCommandsRan = {
      [pkgName]: {
        command: "",
      },
    };

    //@ts-ignore
    const changelogs = yield pullLastChangelog({
      config,
      cwd: projectFolder,
    });

    //@ts-ignore
    pkgCommandsRan = yield pipeChangelogToCommands({
      changelogs,
      pkgCommandsRan,
    });
    expect(pkgCommandsRan[pkgName].command).toBe(
      "## \\[0.5.6]\n\n" +
        "- This is a test.\n" +
        "  - [3ca0504](/commit/3ca05042c51821d229209e18391535c266b6b200) feat: advanced commands, closes [#43](/pull/43) ([#719999](/pull/719999)) on 2020-07-06\n" +
        "- This is another test.\n" +
        "  - [3ca0504](/commit/3ca05042c51821d229209e18391535c266b6b200) feat: advanced commands, closes [#23](/pull/23) ([#123](/pull/123)) on 2020-07-06\n" +
        "- This is the last test.\n" +
        "  - [3ca0504](/commit/3ca05042c51821d229209e18391535c266b6b200) feat: advanced commands, closes [#9](/pull/9) ([#8873](/pull/8873)) on 2020-07-06\n"
    );
  });

  it("reads a changelog with multiple entries", function* () {
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
            {
              releases: {
                "changelog-js-pkg-fixture": "minor",
              },
              summary: "This is the final test.",
            },
          ],
          type: "minor",
        },
      },
    };

    const pkgName = "changelog-js-pkg-fixture";

    const config = {
      packages: {
        [pkgName]: {
          path: "./",
          manager: "javascript",
        },
      },
    };

    yield fillChangelogs({
      applied,
      //@ts-ignore
      assembledChanges,
      config,
      cwd: projectFolder,
    });

    let pkgCommandsRan = {
      [pkgName]: {
        command: "",
      },
    };

    const changelogs = yield pullLastChangelog({
      config,
      cwd: projectFolder,
    });

    //@ts-ignore
    pkgCommandsRan = yield pipeChangelogToCommands({
      //@ts-ignore
      changelogs,
      pkgCommandsRan,
    });
    expect(pkgCommandsRan[pkgName].command).toBe(
      "## \\[0.9.0]\n\n" +
        "- This is a test.\n" +
        "- This is another test.\n" +
        "- This is the last test.\n" +
        "- This is the final test.\n"
    );
  });
});
