import { covector } from "../src";
import { it } from "@effection/jest";
import mockConsole from "jest-mock-console";
import fixtures from "fixturez";
const f = fixtures(__dirname);

// vfile returns fs information that is flaky between machines, scrub it
const scrubVfile = (covectored: any) => {
  return Object.keys(covectored.commandsRan).reduce((c, pkg) => {
    delete c[pkg].pkg.pkgFile.vfile;
    return c;
  }, covectored.commandsRan);
};

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
      covectorReturn: scrubVfile(covectored),
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
      covectorReturn: scrubVfile(covectored),
    }).toMatchSnapshot();
  });
});
