import { covector } from "../src";
import { CovectorVersion } from "@covector/types";
import { it, captureError } from "@effection/jest";
import { loadFile } from "@covector/files";
import path from "path";
import mockConsole from "jest-mock-console";
import fixtures from "fixturez";
const f = fixtures(__dirname);

describe("integration test for complex commands", () => {
  it("runs version for prod", function* () {
    const restoreConsole = mockConsole(["log", "dir", "info"]);
    const fullIntegration = f.copy("integration.js-with-complex-commands");
    const covectored = (yield covector({
      command: "version",
      cwd: fullIntegration,
    })) as CovectorVersion;
    if (typeof covectored !== "object")
      throw new Error("We are expecting an object here.");
    expect({
      consoleLog: (console.log as any).mock.calls,
      consoleInfo: (console.info as any).mock.calls,
      covectorReturn: covectored,
    }).toMatchSnapshot();

    const changelogTauriCore = yield captureError(
      loadFile(path.join("/tauri/", "CHANGELOG.md"), fullIntegration)
    );
    expect(changelogTauriCore.effectionTrace[0].state).toEqual("erroring");
    expect(changelogTauriCore.effectionTrace[1].state).toEqual("erroring");

    const changelogTaurijs = yield captureError(
      loadFile(path.join("/cli/tauri.js/", "CHANGELOG.md"), fullIntegration)
    );
    expect(changelogTaurijs.effectionTrace[0].state).toEqual("erroring");
    expect(changelogTaurijs.effectionTrace[1].state).toEqual("erroring");

    restoreConsole();
  }, 15000);

  it("runs publish for prod", function* () {
    const restoreConsole = mockConsole(["log", "info"]);
    const fullIntegration = f.copy("integration.js-with-complex-commands");
    const covectored = yield covector({
      command: "publish",
      cwd: fullIntegration,
    });
    expect({
      consoleLog: (console.log as any).mock.calls,
      consoleInfo: (console.info as any).mock.calls,
      covectorReturn: covectored,
    }).toMatchSnapshot();
    restoreConsole();
  });

  it("runs test for prod", function* () {
    const restoreConsole = mockConsole(["log", "info", "error"]);
    const fullIntegration = f.copy("integration.js-with-complex-commands");
    const covectored = yield covector({
      command: "test",
      cwd: fullIntegration,
    });
    expect({
      consoleLog: (console.log as any).mock.calls,
      consoleInfo: (console.info as any).mock.calls,
      covectorReturn: covectored,
    }).toMatchSnapshot();
    restoreConsole();
  }, 15000);

  it("runs build for prod", function* () {
    const restoreConsole = mockConsole(["log", "info", "error"]);
    const fullIntegration = f.copy("integration.js-with-complex-commands");
    const covectored = yield covector({
      command: "build",
      cwd: fullIntegration,
    });
    expect({
      consoleLog: (console.log as any).mock.calls,
      consoleInfo: (console.info as any).mock.calls,
      covectorReturn: covectored,
    }).toMatchSnapshot();
    restoreConsole();
  }, 10000);

  it("runs version in --dry-run mode", function* () {
    const restoreConsole = mockConsole(["log", "dir", "info"]);
    const fullIntegration = f.copy("integration.js-with-complex-commands");
    const covectored = (yield covector({
      command: "version",
      cwd: fullIntegration,
      dryRun: true,
    })) as CovectorVersion;
    if (typeof covectored !== "object")
      throw new Error("We are expecting an object here.");
    expect({
      consoleLog: (console.log as any).mock.calls,
      consoleDir: (console.dir as any).mock.calls,
      consoleInfo: (console.info as any).mock.calls,
      covectorReturn: covectored,
    }).toMatchSnapshot();

    const changelogTauriCore = yield captureError(
      loadFile(path.join("/tauri/", "CHANGELOG.md"), fullIntegration)
    );
    expect(changelogTauriCore.effectionTrace[0].state).toEqual("erroring");
    expect(changelogTauriCore.effectionTrace[1].state).toEqual("erroring");

    const changelogTaurijs = yield captureError(
      loadFile(path.join("/cli/tauri.js/", "CHANGELOG.md"), fullIntegration)
    );
    expect(changelogTaurijs.effectionTrace[0].state).toEqual("erroring");
    expect(changelogTaurijs.effectionTrace[1].state).toEqual("erroring");

    restoreConsole();
  });

  it("runs publish in --dry-run mode", function* () {
    const restoreConsole = mockConsole(["log", "dir", "info"]);
    const fullIntegration = f.copy("integration.js-with-complex-commands");
    const covectored = yield covector({
      command: "publish",
      cwd: fullIntegration,
      dryRun: true,
    });
    expect({
      consoleLog: (console.log as any).mock.calls,
      consoleDir: (console.dir as any).mock.calls,
      consoleInfo: (console.info as any).mock.calls,
      covectorReturn: covectored,
    }).toMatchSnapshot();
    restoreConsole();
  });

  it("runs test in --dry-run mode", function* () {
    const restoreConsole = mockConsole(["log", "dir", "info"]);
    const fullIntegration = f.copy("integration.js-with-complex-commands");
    const covectored = yield covector({
      command: "test",
      cwd: fullIntegration,
      dryRun: true,
    });
    expect({
      consoleLog: (console.log as any).mock.calls,
      consoleDir: (console.dir as any).mock.calls,
      consoleInfo: (console.info as any).mock.calls,
      covectorReturn: covectored,
    }).toMatchSnapshot();
    restoreConsole();
  });

  it("runs build in --dry-run mode", function* () {
    const restoreConsole = mockConsole(["log", "dir", "info"]);
    const fullIntegration = f.copy("integration.js-with-complex-commands");
    const covectored = yield covector({
      command: "build",
      cwd: fullIntegration,
      dryRun: true,
    });
    expect({
      consoleLog: (console.log as any).mock.calls,
      consoleDir: (console.dir as any).mock.calls,
      consoleInfo: (console.info as any).mock.calls,
      covectorReturn: covectored,
    }).toMatchSnapshot();
    restoreConsole();
  });
});

describe("integration test to invoke sub commands", () => {
  it("runs publish-primary in prod mode", function* () {
    const restoreConsole = mockConsole(["log", "info"]);
    const fullIntegration = f.copy("integration.js-with-subcommands");
    const covectored = yield covector({
      command: "publish-primary",
      cwd: fullIntegration,
    });
    expect({
      consoleLog: (console.log as any).mock.calls,
      consoleInfo: (console.info as any).mock.calls,
      covectorReturn: covectored,
    }).toMatchSnapshot();
    restoreConsole();
  });

  it("runs publishSecondary in prod mode", function* () {
    const restoreConsole = mockConsole(["log", "info"]);
    const fullIntegration = f.copy("integration.js-with-subcommands");
    const covectored = yield covector({
      command: "publishSecondary",
      cwd: fullIntegration,
    });
    expect({
      consoleLog: (console.log as any).mock.calls,
      consoleInfo: (console.info as any).mock.calls,
      covectorReturn: covectored,
    }).toMatchSnapshot();
    restoreConsole();
  });
});
