const { covector } = require("./index");
const { main } = require("effection");
const mockConsole = require("jest-mock-console");
const fixtures = require("fixturez");
const f = fixtures(__dirname);

describe("integration test", () => {
  it("passes correct config for js and rust", async () => {
    const restoreConsole = mockConsole(["log", "dir"]);
    const fullIntegration = f.copy("integration.js-and-rust-with-changes");
    const covectored = await main(
      covector({
        command: "status",
        cwd: fullIntegration,
      })
    );
    expect({
      consoleLog: console.log.mock.calls,
      consoleDir: console.dir.mock.calls,
      covectorReturn: covectored,
    }).toMatchSnapshot();
    restoreConsole();
  });

  it("runs version for js and rust", async () => {
    const restoreConsole = mockConsole(["info"]);
    const fullIntegration = f.copy("integration.js-and-rust-with-changes");
    const covectored = await main(
      covector({
        command: "version",
        cwd: fullIntegration,
      })
    );
    expect({
      consoleInfo: console.info.mock.calls,
      covectorReturn: covectored,
    }).toMatchSnapshot();
    restoreConsole();
  });
});
