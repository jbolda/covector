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

  it("fills a changelog", function* () {
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

    expect({
      consoleLog: console.log.mock.calls,
      consoleDir: console.dir.mock.calls,
    }).toMatchSnapshot();
  });
});
