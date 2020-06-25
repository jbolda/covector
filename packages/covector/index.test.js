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
    const restoreConsole = mockConsole(["log", "info"]);
    const fullIntegration = f.copy("integration.js-and-rust-with-changes");
    const covectored = await main(
      covector({
        command: "version",
        cwd: fullIntegration,
      })
    );
    expect({
      consoleLog: console.log.mock.calls,
      consoleInfo: console.info.mock.calls,
      covectorReturn: covectored.map((pkg) => {
        // remove these as they are dependent on the OS
        // and user running them so would always fail
        delete pkg.vfile.history;
        delete pkg.vfile.cwd;
        return pkg;
      }),
    }).toMatchSnapshot();
    restoreConsole();
  });

  it("runs publish for js and rust", async () => {
    const restoreConsole = mockConsole(["log", "info"]);
    const fullIntegration = f.copy("integration.js-and-rust-with-changes");
    const covectored = await main(
      covector({
        command: "publish",
        cwd: fullIntegration,
      })
    );
    expect({
      consoleLog: console.log.mock.calls,
      consoleInfo: console.info.mock.calls,
      covectorReturn: covectored,
    }).toMatchSnapshot();
    restoreConsole();
  });

  it("fails with error", async () => {
    const restoreConsole = mockConsole(["log", "info"]);
    const fullIntegration = f.copy("integration.js-with-publish-error");
    const covectored = await main(
      covector({
        command: "publish",
        cwd: fullIntegration,
      })
    );
    expect({
      consoleLog: console.log.mock.calls,
      consoleInfo: console.info.mock.calls,
      covectorReturn: covectored,
    }).toMatchSnapshot();
    expect(covectored).toThrow();
    restoreConsole();
  });
});
