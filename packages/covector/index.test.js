const { covector } = require("./index");
const { main } = require("effection");
const toVFile = require("to-vfile");
const path = require("path");
const mockConsole = require("jest-mock-console");
const fixtures = require("fixturez");
const f = fixtures(__dirname);

describe("integration test in production mode", () => {
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
        delete pkg.vfile;
        return pkg;
      }),
    }).toMatchSnapshot();

    const changelogTauriCore = await toVFile.read(
      path.join(fullIntegration, "/tauri/", "CHANGELOG.md"),
      "utf-8"
    );
    expect(changelogTauriCore.contents).toBe(
      "# Changelog\n\n" +
        "## [0.6.0]\n\n" +
        "-   Summary about the changes in tauri\n"
    );

    const changelogTaurijs = await toVFile.read(
      path.join(fullIntegration, "/cli/tauri.js/", "CHANGELOG.md"),
      "utf-8"
    );
    expect(changelogTaurijs.contents).toBe(
      "# Changelog\n\n" +
        "## [0.7.0]\n\n" +
        "-   Summary about the changes in tauri\n"
    );

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
    const covectored = main(
      covector({
        command: "publish",
        cwd: fullIntegration,
      })
    );
    await expect(covectored).rejects.toThrow();
    expect({
      consoleLog: console.log.mock.calls,
      consoleInfo: console.info.mock.calls,
      // covectorReturn: covectored, // skip this as npm publish has fs dep output which creates false positives
    }).toMatchSnapshot();
    restoreConsole();
  }, 60000); // increase timeout to 60s, windows seems to take forever on a fail

  it("runs test for js and rust", async () => {
    const restoreConsole = mockConsole(["log", "info"]);
    const fullIntegration = f.copy("integration.js-and-rust-with-changes");
    const covectored = await main(
      covector({
        command: "test",
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

  it("runs build for js and rust", async () => {
    const restoreConsole = mockConsole(["log", "info"]);
    const fullIntegration = f.copy("integration.js-and-rust-with-changes");
    const covectored = await main(
      covector({
        command: "build",
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
});

describe("integration test in --dry-run mode", () => {
  it("passes correct config for js and rust", async () => {
    const restoreConsole = mockConsole(["log", "dir"]);
    const fullIntegration = f.copy("integration.js-and-rust-with-changes");
    const covectored = await main(
      covector({
        command: "status",
        cwd: fullIntegration,
        dryRun: true,
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
        dryRun: true,
      })
    );
    expect({
      consoleLog: console.log.mock.calls,
      consoleInfo: console.info.mock.calls,
      covectorReturn: covectored.map((pkg) => {
        // remove these as they are dependent on the OS
        // and user running them so would always fail
        delete pkg.vfile;
        return pkg;
      }),
    }).toMatchSnapshot();

    const changelogTauriCore = toVFile.read(
      path.join(fullIntegration, "/tauri/", "CHANGELOG.md"),
      "utf-8"
    );
    await expect(changelogTauriCore).rejects.toThrow();

    const changelogTaurijs = toVFile.read(
      path.join(fullIntegration, "/cli/tauri.js/", "CHANGELOG.md"),
      "utf-8"
    );
    await expect(changelogTaurijs).rejects.toThrow();

    restoreConsole();
  });

  it("runs publish for js and rust", async () => {
    const restoreConsole = mockConsole(["log", "info"]);
    const fullIntegration = f.copy("integration.js-and-rust-with-changes");
    const covectored = await main(
      covector({
        command: "publish",
        cwd: fullIntegration,
        dryRun: true,
      })
    );
    expect({
      consoleLog: console.log.mock.calls,
      consoleInfo: console.info.mock.calls,
      covectorReturn: covectored,
    }).toMatchSnapshot();
    restoreConsole();
  });

  it("runs test for js and rust", async () => {
    const restoreConsole = mockConsole(["log", "info"]);
    const fullIntegration = f.copy("integration.js-and-rust-with-changes");
    const covectored = await main(
      covector({
        command: "test",
        cwd: fullIntegration,
        dryRun: true,
      })
    );
    expect({
      consoleLog: console.log.mock.calls,
      consoleInfo: console.info.mock.calls,
      covectorReturn: covectored,
    }).toMatchSnapshot();
    restoreConsole();
  });

  it("runs build for js and rust", async () => {
    const restoreConsole = mockConsole(["log", "info"]);
    const fullIntegration = f.copy("integration.js-and-rust-with-changes");
    const covectored = await main(
      covector({
        command: "build",
        cwd: fullIntegration,
        dryRun: true,
      })
    );
    expect({
      consoleLog: console.log.mock.calls,
      consoleInfo: console.info.mock.calls,
      covectorReturn: covectored,
    }).toMatchSnapshot();
    restoreConsole();
  });
});

describe("integration test for complex commands", () => {
  it("runs version", async () => {
    const restoreConsole = mockConsole(["log", "info"]);
    const fullIntegration = f.copy("integration.js-and-rust-with-changes");
    const covectored = await main(
      covector({
        command: "version",
        cwd: fullIntegration,
        dryRun: true,
      })
    );
    expect({
      consoleLog: console.log.mock.calls,
      consoleInfo: console.info.mock.calls,
      covectorReturn: covectored.map((pkg) => {
        // remove these as they are dependent on the OS
        // and user running them so would always fail
        delete pkg.vfile;
        return pkg;
      }),
    }).toMatchSnapshot();

    const changelogTauriCore = toVFile.read(
      path.join(fullIntegration, "/tauri/", "CHANGELOG.md"),
      "utf-8"
    );
    await expect(changelogTauriCore).rejects.toThrow();

    const changelogTaurijs = toVFile.read(
      path.join(fullIntegration, "/cli/tauri.js/", "CHANGELOG.md"),
      "utf-8"
    );
    await expect(changelogTaurijs).rejects.toThrow();

    restoreConsole();
  });

  it("runs publish", async () => {
    const restoreConsole = mockConsole(["log", "info"]);
    const fullIntegration = f.copy("integration.js-and-rust-with-changes");
    const covectored = await main(
      covector({
        command: "publish",
        cwd: fullIntegration,
        dryRun: true,
      })
    );
    expect({
      consoleLog: console.log.mock.calls,
      consoleInfo: console.info.mock.calls,
      covectorReturn: covectored,
    }).toMatchSnapshot();
    restoreConsole();
  });

  it("runs test", async () => {
    const restoreConsole = mockConsole(["log", "info"]);
    const fullIntegration = f.copy("integration.js-and-rust-with-changes");
    const covectored = await main(
      covector({
        command: "test",
        cwd: fullIntegration,
        dryRun: true,
      })
    );
    expect({
      consoleLog: console.log.mock.calls,
      consoleInfo: console.info.mock.calls,
      covectorReturn: covectored,
    }).toMatchSnapshot();
    restoreConsole();
  });

  it("runs build", async () => {
    const restoreConsole = mockConsole(["log", "info"]);
    const fullIntegration = f.copy("integration.js-and-rust-with-changes");
    const covectored = await main(
      covector({
        command: "build",
        cwd: fullIntegration,
        dryRun: true,
      })
    );
    expect({
      consoleLog: console.log.mock.calls,
      consoleInfo: console.info.mock.calls,
      covectorReturn: covectored,
    }).toMatchSnapshot();
    restoreConsole();
  });
});
