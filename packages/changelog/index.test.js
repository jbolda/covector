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

    const changeList = [
      {
        dependencies: undefined,
        manager: "javascript",
        path: "./",
        pkg: "js-single-json-fixture",
        type: "minor",
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

    yield fillChangelogs({ changeList, config, cwd: projectFolder });

    const changelog = yield toVFile.read(
      projectFolder + "/CHANGELOG.md",
      "utf-8"
    );
    expect(changelog.contents).toBe("# Changelog\n\nminor\n");

    expect({
      consoleLog: console.log.mock.calls,
      consoleDir: console.dir.mock.calls,
    }).toMatchSnapshot();
  });
});
