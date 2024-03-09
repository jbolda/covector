import { covector } from "../src";
import { it } from "@effection/jest";
import mockConsole from "jest-mock-console";
import fixtures from "fixturez";
import { TomlDocument } from "@covector/toml";
const f = fixtures(__dirname);

expect.addSnapshotSerializer({
  test: (value) => value instanceof TomlDocument,
  print: (_) => `TomlDocument {}`,
});

describe("integration test for preview command", () => {
  let restoreConsole: Function;
  beforeEach(() => {
    restoreConsole = mockConsole(["log", "dir", "info", "error"]);
  });
  afterEach(() => {
    restoreConsole();
  });

  it("runs version and publish for js and rust", function* () {
    const fullIntegration = f.copy("integration.js-and-rust-for-preview");
    const covectored = yield covector({
      command: "preview",
      cwd: fullIntegration,
      previewVersion: "branch-name.12345",
    });

    expect({
      consoleLog: (console.log as any).mock.calls,
      consoleInfo: (console.info as any).mock.calls,
      covectorReturn: covectored,
    }).toMatchSnapshot();
  });
});

describe("integration test for preview command with dist tags", () => {
  let restoreConsole: Function;
  beforeEach(() => {
    restoreConsole = mockConsole(["log", "dir", "info", "error"]);
  });
  afterEach(() => {
    restoreConsole();
  });

  it("runs version and publish for js and rust", function* () {
    const fullIntegration = f.copy("integration.js-and-rust-for-preview");
    const covectored = yield covector({
      command: "preview",
      cwd: fullIntegration,
      previewVersion: "branch-name.12345",
      branchTag: "branch_name",
    });

    expect({
      consoleLog: (console.log as any).mock.calls,
      consoleInfo: (console.info as any).mock.calls,
      covectorReturn: covectored,
    }).toMatchSnapshot();
  });
});
