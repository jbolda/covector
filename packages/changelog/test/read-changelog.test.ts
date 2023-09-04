import {
  fillChangelogs,
  pullLastChangelog,
  pipeChangelogToCommands,
} from "../src";
import { it } from "@effection/jest";
import mockConsole, { RestoreConsole } from "jest-mock-console";
import fixtures from "fixturez";
const f = fixtures(__dirname);

const configDefaults = {
  changeFolder: ".changes",
  changeTags: { feat: "Features", bug: "Bugs" },
};

describe("reads changelog", () => {
  let restoreConsole: RestoreConsole;
  beforeEach(() => {
    restoreConsole = mockConsole(["log", "dir"]);
  });
  afterEach(() => {
    restoreConsole();
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
      ...configDefaults,
      packages: {
        [pkgName]: {
          path: "./",
          manager: "javascript",
        },
      },
    };

    yield fillChangelogs({
      applied,
      //@ts-expect-error
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

    pkgCommandsRan = yield pipeChangelogToCommands({
      changelogs,
      pkgCommandsRan,
    });
    expect(pkgCommandsRan[pkgName].command).toBe(
      "## \\[0.5.6]\n\n" +
        "- [`3ca0504`](/commit/3ca05042c51821d229209e18391535c266b6b200)([#719999](/pull/719999)) This is a test.\n" +
        "- [`3ca0504`](/commit/3ca05042c51821d229209e18391535c266b6b200)([#123](/pull/123)) This is another test.\n" +
        "- [`3ca0504`](/commit/3ca05042c51821d229209e18391535c266b6b200)([#8873](/pull/8873)) This is the last test.\n"
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
              tag: "bug",
            },
            {
              releases: {
                "changelog-js-pkg-fixture": "patch",
              },
              summary: "This is another test.",
              tag: "bug",
            },
            {
              releases: {
                "changelog-js-pkg-fixture": "minor",
              },
              summary: "This is the last test.",
              tag: "feat",
            },
            {
              releases: {
                "changelog-js-pkg-fixture": "minor",
              },
              summary: "This is the final test.",
              tag: "feat",
            },
          ],
          type: "minor",
        },
      },
    };

    const pkgName = "changelog-js-pkg-fixture";

    const config = {
      ...configDefaults,
      packages: {
        [pkgName]: {
          path: "./",
          manager: "javascript",
        },
      },
    };

    yield fillChangelogs({
      applied,
      //@ts-expect-error
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

    pkgCommandsRan = yield pipeChangelogToCommands({
      changelogs,
      pkgCommandsRan,
    });
    expect(pkgCommandsRan[pkgName].command).toBe(
      "## \\[0.9.0]\n\n" +
        "### Features\n\n" +
        "- This is the last test.\n" +
        "- This is the final test.\n\n" +
        "### Bugs\n\n" +
        "- This is a test.\n" +
        "- This is another test.\n",
    );
  });
});
