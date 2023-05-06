import { covector } from "../src";
import { CovectorVersion } from "@covector/types";
import { run } from "effection";
import { it } from "@effection/jest";
import { loadFile } from "@covector/files";
import path from "path";
import mockConsole, { RestoreConsole } from "jest-mock-console";
import fixtures from "fixturez";
const f = fixtures(__dirname);
import { injectPublishFunctions } from "../../action/src/utils";

describe("integration test in production mode", () => {
  let restoreConsole: RestoreConsole;
  beforeEach(() => {
    restoreConsole = mockConsole(["log", "dir", "info", "error"]);
  });
  afterEach(() => {
    restoreConsole();
  });

  it("passes correct config for js and rust", function* () {
    const fullIntegration = f.copy("integration.js-and-rust-with-changes");
    const covectored = yield covector({
      command: "status",
      cwd: fullIntegration,
    });
    expect({
      consoleLog: (console.log as any).mock.calls,
      consoleDir: (console.dir as any).mock.calls,
      covectorReturn: covectored,
    }).toMatchSnapshot();
  });

  it("fails status for non-existant package", function* () {
    const fullIntegration = f.copy("integration.js-with-change-file-error");
    const covectored = covector({
      command: "status",
      cwd: fullIntegration,
    });
    yield expect(run(covectored)).rejects.toThrow();

    expect({
      consoleLog: (console.log as any).mock.calls,
      consoleDir: (console.dir as any).mock.calls,
      covectorReturn: covectored,
    }).toMatchSnapshot();
  }, 60000); // increase timeout to 60s, windows seems to take forever on a fail

  it("runs version for js and rust", function* () {
    const fullIntegration = f.copy("integration.js-and-rust-with-changes");
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

    const changelogTauriCore = yield loadFile(
      path.join("/tauri/", "CHANGELOG.md"),
      fullIntegration
    );
    expect(changelogTauriCore.content).toBe(
      "# Changelog\n\n" +
        "## \\[0.6.0]\n\n" +
        "- Summary about the changes in tauri\n"
    );

    const changelogTaurijs = yield loadFile(
      path.join("/cli/tauri.js/", "CHANGELOG.md"),
      fullIntegration
    );
    expect(changelogTaurijs.content).toBe(
      "# Changelog\n\n" +
        "## \\[0.6.3]\n\n" +
        "### Dependencies\n\n" +
        "- Updated to latest `tauri`\n"
    );
  });

  it("runs version for dart / flutter single", function* () {
    const fullIntegration = f.copy("integration.dart-flutter-single");
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

    const changelog = yield loadFile("CHANGELOG.md", fullIntegration);
    expect(changelog.content).toBe(
      "# Changelog\n\n" +
        "## \\[0.4.0]\n\n" +
        "- Summary about the changes in test_app\n" +
        "- Summary about the changes again(!) in test_app\n"
    );

    const versionFile = yield loadFile("pubspec.yaml", fullIntegration);
    expect(versionFile.content).toEqual(
      expect.stringContaining("version: 0.4.0\n")
    );
  });

  it("runs version for dart / flutter multi", function* () {
    const fullIntegration = f.copy("integration.dart-flutter-multi");
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

    const changelog = yield loadFile(
      path.join("dart", "CHANGELOG.md"),
      fullIntegration
    );
    expect(changelog.content).toBe(
      "# Changelog\n\n" +
        "## \\[0.3.2]\n\n" +
        "### Dependencies\n\n" +
        "- Updated to latest `test_app_two`\n"
    );

    const versionFile = yield loadFile(
      path.join("dart", "pubspec.yaml"),
      fullIntegration
    );
    expect(versionFile.content).toEqual(
      expect.stringContaining("version: 0.3.2\n")
    );
  });

  it("runs version for general file", function* () {
    const fullIntegration = f.copy("integration.general-file");
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

    const changelog = yield loadFile("CHANGELOG.md", fullIntegration);
    expect(changelog.content).toBe(
      "# Changelog\n\n" +
        "## \\[6.2.0]\n\n" +
        "- Summary about the changes in general-pkg\n" +
        "- A general summary about the generally changes in general-pkg generally\n"
    );

    const versionFile = yield loadFile("VERSION", fullIntegration);
    expect(versionFile.content).toBe("6.2.0");
  });

  it("runs publish for js and rust", function* () {
    const fullIntegration = f.copy("integration.js-and-rust-with-changes");
    const covectored = yield covector({
      command: "publish",
      cwd: fullIntegration,
    });
    expect({
      consoleLog: (console.log as any).mock.calls,
      consoleInfo: (console.info as any).mock.calls,
      covectorReturn: covectored,
    }).toMatchSnapshot();
  }, 6000); // increase timeout to 60s, windows seems to take forever

  it("runs publish for dart / flutter", function* () {
    const fullIntegration = f.copy("integration.dart-flutter-single");
    const covectored = yield covector({
      command: "publish",
      cwd: fullIntegration,
    });
    expect({
      consoleLog: (console.log as any).mock.calls,
      consoleInfo: (console.info as any).mock.calls,
      covectorReturn: covectored,
    }).toMatchSnapshot();
  });

  it("runs publish for general file", function* () {
    const fullIntegration = f.copy("integration.general-file");
    const covectored = yield covector({
      command: "publish",
      cwd: fullIntegration,
    });
    expect({
      consoleLog: (console.log as any).mock.calls,
      consoleInfo: (console.info as any).mock.calls,
      covectorReturn: covectored,
    }).toMatchSnapshot();
  });

  it("fails with error", function* () {
    const fullIntegration = f.copy("integration.js-with-publish-error");
    const covectored = covector({
      command: "publish",
      cwd: fullIntegration,
    });
    yield expect(run(covectored)).rejects.toThrow();
    expect({
      consoleLog: (console.log as any).mock.calls,
      consoleInfo: (console.info as any).mock.calls,
      // covectorReturn: covectored, // skip this as npm publish has fs dep output which creates false positives
    }).toMatchSnapshot();
  }, 60000); // increase timeout to 60s, windows seems to take forever on a fail

  it("fails version with errorOnVersionRange", function* () {
    const fullIntegration = f.copy("integration.js-and-rust-with-changes");
    const modifyConfig = async (pullConfig: any) => {
      const config = await pullConfig;
      let modified = { ...config };
      modified.pkgManagers.rust.errorOnVersionRange = ">= 0.0.1";
      modified.pkgManagers.javascript.errorOnVersionRange = ">= 0.0.1";
      return modified;
    };
    const covectored = covector({
      command: "version",
      cwd: fullIntegration,
      modifyConfig,
    });
    yield expect(run(covectored)).rejects.toThrow();
    expect({
      consoleLog: (console.log as any).mock.calls,
      consoleInfo: (console.info as any).mock.calls,
    }).toMatchSnapshot();
  }, 60000); // increase timeout to 60s, windows seems to take forever on a fail

  it("fails status with errorOnVersionRange", function* () {
    const fullIntegration = f.copy("integration.js-and-rust-with-changes");
    const modifyConfig = async (pullConfig: any) => {
      const config = await pullConfig;
      let modified = { ...config };
      modified.pkgManagers.rust.errorOnVersionRange = ">= 0.0.1";
      modified.pkgManagers.javascript.errorOnVersionRange = ">= 0.0.1";
      return modified;
    };
    const covectored = covector({
      command: "status",
      cwd: fullIntegration,
      modifyConfig,
    });
    yield expect(run(covectored)).rejects.toThrow();
    expect({
      consoleLog: (console.log as any).mock.calls,
      consoleInfo: (console.info as any).mock.calls,
    }).toMatchSnapshot();
  }, 60000); // increase timeout to 60s, windows seems to take forever on a fail

  it("runs test for js and rust", function* () {
    const fullIntegration = f.copy("integration.js-and-rust-with-changes");
    const covectored = yield covector({
      command: "test",
      cwd: fullIntegration,
    });
    expect({
      consoleLog: (console.log as any).mock.calls,
      consoleInfo: (console.info as any).mock.calls,
      covectorReturn: covectored,
    }).toMatchSnapshot();
  });

  it("runs build for js and rust", function* () {
    const fullIntegration = f.copy("integration.js-and-rust-with-changes");
    const covectored = yield covector({
      command: "build",
      cwd: fullIntegration,
    });
    expect({
      consoleLog: (console.log as any).mock.calls,
      consoleInfo: (console.info as any).mock.calls,
      covectorReturn: covectored,
    }).toMatchSnapshot();
  });

  it("allows modifying the config", function* () {
    const fullIntegration = f.copy("integration.js-and-rust-with-changes");
    const modifyConfig = async (pullConfig: any) => {
      const config = await pullConfig;
      return Object.keys(config.pkgManagers).reduce(
        (finalConfig, pkgManager) => {
          finalConfig.pkgManagers[pkgManager] = Object.keys(
            config.pkgManagers[pkgManager]
          ).reduce((pm, p) => {
            if (p.startsWith("publish")) {
              const functionInject = async () => console.log("deboop");
              pm[p] = Array.isArray(pm[p])
                ? pm[p].concat(functionInject)
                : [pm[p], functionInject];
            } else if (p.startsWith("pre")) {
              const functionInject = async () =>
                console.log("begin with only boops");
              pm[p] = [functionInject];
            } else if (p.startsWith("post")) {
              const functionInject = async () =>
                console.log("ends with overwrites using boops");
              pm[p] = functionInject;
            }
            return pm;
          }, config.pkgManagers[pkgManager]);

          return finalConfig;
        },
        config
      );
    };

    const covectored = yield covector({
      command: "publish",
      cwd: fullIntegration,
      modifyConfig,
    });
    expect((console.log as any).mock.calls).toMatchSnapshot();
  }, 6000); // increase timeout to 60s, windows seems to take forever

  it("uses the action config modification", function* () {
    const fullIntegration = f.copy("integration.js-and-rust-with-changes");

    const covectored = yield covector({
      command: "publish",
      cwd: fullIntegration,
      modifyConfig: injectPublishFunctions([
        async (pkg: any) =>
          console.log(
            `push log into publish for ${pkg.pkg}-v${pkg.pkgFile.version}`
          ),
        async () => console.log(`push another log`),
      ]),
    });
    expect((console.log as any).mock.calls).toMatchSnapshot();
  });
});
