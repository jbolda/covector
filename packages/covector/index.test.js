const { covector } = require("./index");
const mockConsole = require("jest-mock-console");
const fixtures = require("fixturez");
const f = fixtures(__dirname);

describe("integration test", () => {
  it("passes correct config for js and rust", function* () {
    const restoreConsole = mockConsole(["log", "dir"]);
    const fullIntegration = f.copy("integration.js-and-rust-with-changes");
    const covectored = yield covector({
      command: "status",
      cwd: fullIntegration,
    });
    expect({
      consoleLog: console.log.mock.calls,
      consoleDir: console.dir.mock.calls,
      covectorReturn: covectored,
    }).toMatchSnapshot();
    restoreConsole();
  });

  it("runs version for js and rust", function* () {
    const restoreConsole = mockConsole(["log", "dir"]);
    const fullIntegration = f.copy("integration.js-and-rust-with-changes");
    const covectored = yield covector({
      command: "version",
      cwd: fullIntegration,
    });
    expect({
      consoleLog: console.log.mock.calls,
      consoleDir: console.dir.mock.calls,
      covectorReturn: covectored,
    }).toMatchSnapshot();
    restoreConsole();
  });
});
