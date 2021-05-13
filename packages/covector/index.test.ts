import { covector } from "./src";
import { run } from "effection";
//@ts-ignore
import toVFile from "to-vfile";
import path from "path";
import * as fs from "fs";
import fixtures from "fixturez";
const f = fixtures(__dirname);

let consoleMock = console as jest.Mocked<Console>;
const mockConsole = (toMock: string[]) => {
  const originalConsole = { ...console };
  debugger;
  toMock.forEach((mock) => {
    (console as any)[mock] = jest.fn();
  });
  consoleMock = console as jest.Mocked<Console>;
  return () => {
    global.console = originalConsole;
  };
};
import { injectPublishFunctions } from "../action/src/utils";

describe("integration test in production mode", () => {
  let restoreConsole: Function;
  beforeEach(() => {
    restoreConsole = mockConsole(["log", "dir", "info", "error"]);
  });
  afterEach(() => {
    restoreConsole();
  });

  it("passes correct config for js and rust", async () => {
    const fullIntegration = f.copy("integration.js-and-rust-with-changes");
    const covectored = await run(
      covector({
        command: "status",
        cwd: fullIntegration,
      })
    );
    expect({
      consoleLog: consoleMock.log.mock.calls,
      consoleDir: consoleMock.dir.mock.calls,
      covectorReturn: covectored,
    }).toMatchSnapshot();
  });

  it("fails status for non-existant package", async () => {
    const fullIntegration = f.copy("integration.js-with-change-file-error");
    const covectored = run(
      covector({
        command: "status",
        cwd: fullIntegration,
      })
    );
    await expect(covectored).rejects.toThrow();
    //@ts-ignore
    delete covectored.id;
    expect({
      consoleLog: consoleMock.log.mock.calls,
      consoleDir: consoleMock.dir.mock.calls,
      covectorReturn: covectored,
    }).toMatchSnapshot();
  }, 60000); // increase timeout to 60s, windows seems to take forever on a fail

  it("runs version for js and rust", async () => {
    const fullIntegration = f.copy("integration.js-and-rust-with-changes");
    const covectored = await run(
      covector({
        command: "version",
        cwd: fullIntegration,
      })
    );
    expect({
      consoleLog: consoleMock.log.mock.calls,
      consoleInfo: consoleMock.info.mock.calls,
      //@ts-ignore
      covectorReturn: Object.keys(covectored).reduce((pkgs, pkg) => {
        // remove these as they are dependent on the OS
        // and user running them so would always fail
        //@ts-ignore
        delete pkgs[pkg].applied.vfile;
        return pkgs;
      }, covectored),
    }).toMatchSnapshot();

    const changelogTauriCore = await toVFile.read(
      path.join(fullIntegration, "/tauri/", "CHANGELOG.md"),
      "utf-8"
    );
    expect(changelogTauriCore.contents).toBe(
      "# Changelog\n\n" +
        "## \\[0.6.0]\n\n" +
        "- Summary about the changes in tauri\n"
    );

    const changelogTaurijs = await toVFile.read(
      path.join(fullIntegration, "/cli/tauri.js/", "CHANGELOG.md"),
      "utf-8"
    );
    expect(changelogTaurijs.contents).toBe(
      "# Changelog\n\n" +
        "## \\[0.6.3]\n\n" +
        "- Summary about the changes in tauri\n"
    );
  });

  it("runs version for dart / flutter single", async () => {
    const fullIntegration = f.copy("integration.dart-flutter-single");
    const covectored = await run(
      covector({
        command: "version",
        cwd: fullIntegration,
      })
    );
    expect({
      consoleLog: consoleMock.log.mock.calls,
      consoleInfo: consoleMock.info.mock.calls,
      //@ts-ignore
      covectorReturn: Object.keys(covectored).reduce((pkgs, pkg) => {
        // remove these as they are dependent on the OS
        // and user running them so would always fail
        //@ts-ignore
        delete pkgs[pkg].applied.vfile;
        return pkgs;
      }, covectored),
    }).toMatchSnapshot();

    const changelog = await toVFile.read(
      path.join(fullIntegration, "CHANGELOG.md"),
      "utf-8"
    );
    expect(changelog.contents).toBe(
      "# Changelog\n\n" +
        "## \\[0.4.0]\n\n" +
        "- Summary about the changes in test_app\n" +
        "- Summary about the changes again(!) in test_app\n"
    );

    const versionFile = await toVFile.read(
      path.join(fullIntegration, "pubspec.yaml"),
      "utf-8"
    );
    expect(versionFile.contents).toEqual(
      expect.stringContaining("version: 0.4.0\n")
    );
  });

  it("runs version for dart / flutter multi", async () => {
    const fullIntegration = f.copy("integration.dart-flutter-multi");
    const covectored = await run(
      covector({
        command: "version",
        cwd: fullIntegration,
      })
    );
    expect({
      consoleLog: consoleMock.log.mock.calls,
      consoleInfo: consoleMock.info.mock.calls,
      //@ts-ignore
      covectorReturn: Object.keys(covectored).reduce((pkgs, pkg) => {
        // remove these as they are dependent on the OS
        // and user running them so would always fail
        //@ts-ignore
        delete pkgs[pkg].applied.vfile;
        return pkgs;
      }, covectored),
    }).toMatchSnapshot();

    const changelog = await toVFile.read(
      path.join(fullIntegration, "dart", "CHANGELOG.md"),
      "utf-8"
    );
    expect(changelog.contents).toBe(
      "# Changelog\n\n" +
        "## \\[0.3.2]\n\n" +
        "- Summary about the changes in test_app_two\n"
    );

    const versionFile = await toVFile.read(
      path.join(fullIntegration, "dart", "pubspec.yaml"),
      "utf-8"
    );
    expect(versionFile.contents).toEqual(
      expect.stringContaining("version: 0.3.2\n")
    );
  });

  it("runs version for general file", async () => {
    const fullIntegration = f.copy("integration.general-file");
    const covectored = await run(
      covector({
        command: "version",
        cwd: fullIntegration,
      })
    );
    expect({
      consoleLog: consoleMock.log.mock.calls,
      consoleInfo: consoleMock.info.mock.calls,
      //@ts-ignore
      covectorReturn: Object.keys(covectored).reduce((pkgs, pkg) => {
        // remove these as they are dependent on the OS
        // and user running them so would always fail
        //@ts-ignore
        delete pkgs[pkg].applied.vfile;
        return pkgs;
      }, covectored),
    }).toMatchSnapshot();

    const changelog = await toVFile.read(
      path.join(fullIntegration, "CHANGELOG.md"),
      "utf-8"
    );
    expect(changelog.contents).toBe(
      "# Changelog\n\n" +
        "## \\[6.2.0]\n\n" +
        "- Summary about the changes in general-pkg\n" +
        "- A general summary about the generally changes in general-pkg generally\n"
    );

    const versionFile = await toVFile.read(
      path.join(fullIntegration, "VERSION"),
      "utf-8"
    );
    expect(versionFile.contents).toBe("6.2.0");
  });

  it("runs publish for js and rust", async () => {
    const fullIntegration = f.copy("integration.js-and-rust-with-changes");
    const covectored = await run(
      covector({
        command: "publish",
        cwd: fullIntegration,
      })
    );
    expect({
      consoleLog: consoleMock.log.mock.calls,
      consoleInfo: consoleMock.info.mock.calls,
      covectorReturn: scrubVfile(covectored),
    }).toMatchSnapshot();
  });

  it("runs publish for dart / flutter", async () => {
    const fullIntegration = f.copy("integration.dart-flutter-single");
    const covectored = await run(
      covector({
        command: "publish",
        cwd: fullIntegration,
      })
    );
    expect({
      consoleLog: consoleMock.log.mock.calls,
      consoleInfo: consoleMock.info.mock.calls,
      covectorReturn: scrubVfile(covectored),
    }).toMatchSnapshot();
  });

  it("runs publish for general file", async () => {
    const fullIntegration = f.copy("integration.general-file");
    const covectored = await run(
      covector({
        command: "publish",
        cwd: fullIntegration,
      })
    );
    expect({
      consoleLog: consoleMock.log.mock.calls,
      consoleInfo: consoleMock.info.mock.calls,
      covectorReturn: scrubVfile(covectored),
    }).toMatchSnapshot();
  });

  it("fails with error", async () => {
    const fullIntegration = f.copy("integration.js-with-publish-error");
    const covectored = run(
      covector({
        command: "publish",
        cwd: fullIntegration,
      })
    );
    await expect(covectored).rejects.toThrow();
    expect({
      consoleLog: consoleMock.log.mock.calls,
      consoleInfo: consoleMock.info.mock.calls,
      // covectorReturn: covectored, // skip this as npm publish has fs dep output which creates false positives
    }).toMatchSnapshot();
  }, 60000); // increase timeout to 60s, windows seems to take forever on a fail

  it("fails version with errorOnVersionRange", async () => {
    const fullIntegration = f.copy("integration.js-and-rust-with-changes");
    const modifyConfig = async (pullConfig: any) => {
      const config = await pullConfig;
      let modified = { ...config };
      modified.pkgManagers.rust.errorOnVersionRange = ">= 0.0.1";
      modified.pkgManagers.javascript.errorOnVersionRange = ">= 0.0.1";
      return modified;
    };
    const covectored = run(
      covector({
        command: "version",
        cwd: fullIntegration,
        modifyConfig,
      })
    );
    await expect(covectored).rejects.toThrow();
    expect({
      consoleLog: consoleMock.log.mock.calls,
      consoleInfo: consoleMock.info.mock.calls,
    }).toMatchSnapshot();
  }, 60000); // increase timeout to 60s, windows seems to take forever on a fail

  it("fails status with errorOnVersionRange", async () => {
    const fullIntegration = f.copy("integration.js-and-rust-with-changes");
    const modifyConfig = async (pullConfig: any) => {
      const config = await pullConfig;
      let modified = { ...config };
      modified.pkgManagers.rust.errorOnVersionRange = ">= 0.0.1";
      modified.pkgManagers.javascript.errorOnVersionRange = ">= 0.0.1";
      return modified;
    };
    const covectored = run(
      covector({
        command: "status",
        cwd: fullIntegration,
        modifyConfig,
      })
    );
    await expect(covectored).rejects.toThrow();
    expect({
      consoleLog: consoleMock.log.mock.calls,
      consoleInfo: consoleMock.info.mock.calls,
    }).toMatchSnapshot();
  }, 60000); // increase timeout to 60s, windows seems to take forever on a fail

  it("runs test for js and rust", async () => {
    const fullIntegration = f.copy("integration.js-and-rust-with-changes");
    const covectored = await run(
      covector({
        command: "test",
        cwd: fullIntegration,
      })
    );
    expect({
      consoleLog: consoleMock.log.mock.calls,
      consoleInfo: consoleMock.info.mock.calls,
      covectorReturn: covectored,
    }).toMatchSnapshot();
  });

  it("runs build for js and rust", async () => {
    const fullIntegration = f.copy("integration.js-and-rust-with-changes");
    const covectored = await run(
      covector({
        command: "build",
        cwd: fullIntegration,
      })
    );
    expect({
      consoleLog: consoleMock.log.mock.calls,
      consoleInfo: consoleMock.info.mock.calls,
      covectorReturn: scrubVfile(covectored),
    }).toMatchSnapshot();
  });

  it("allows modifying the config", async () => {
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

    const covectored = await run(
      covector({
        command: "publish",
        cwd: fullIntegration,
        modifyConfig,
      })
    );
    expect(consoleMock.log.mock.calls).toMatchSnapshot();
  });

  it("uses the action config modification", async () => {
    const fullIntegration = f.copy("integration.js-and-rust-with-changes");

    const covectored = await run(
      covector({
        command: "publish",
        cwd: fullIntegration,
        modifyConfig: injectPublishFunctions([
          async (pkg: any) =>
            console.log(
              `push log into publish for ${pkg.pkg}-v${pkg.pkgFile.version}`
            ),
          async () => console.log(`push another log`),
        ]),
      })
    );
    expect(consoleMock.log.mock.calls).toMatchSnapshot();
  });
});

describe("integration test in --dry-run mode", () => {
  it("passes correct config for js and rust", async () => {
    const restoreConsole = mockConsole(["log", "dir"]);
    const fullIntegration = f.copy("integration.js-and-rust-with-changes");
    const covectored = await run(
      covector({
        command: "status",
        cwd: fullIntegration,
        dryRun: true,
      })
    );
    expect({
      consoleLog: consoleMock.log.mock.calls,
      consoleDir: consoleMock.dir.mock.calls,
      covectorReturn: covectored,
    }).toMatchSnapshot();
    restoreConsole();
  });

  it("runs version for js and rust", async () => {
    const restoreConsole = mockConsole(["log", "info"]);
    const fullIntegration = f.copy("integration.js-and-rust-with-changes");
    const covectored = await run(
      covector({
        command: "version",
        cwd: fullIntegration,
        dryRun: true,
      })
    );
    expect({
      consoleLog: consoleMock.log.mock.calls,
      consoleInfo: consoleMock.info.mock.calls,
      //@ts-ignore
      covectorReturn: Object.keys(covectored).reduce((pkgs, pkg) => {
        // remove these as they are dependent on the OS
        // and user running them so would always fail
        //@ts-ignore
        delete pkgs[pkg].applied.vfile;
        return pkgs;
      }, covectored),
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
    const covectored = await run(
      covector({
        command: "publish",
        cwd: fullIntegration,
        dryRun: true,
      })
    );
    expect({
      consoleLog: consoleMock.log.mock.calls,
      consoleInfo: consoleMock.info.mock.calls,
      covectorReturn: scrubVfile(covectored),
    }).toMatchSnapshot();
    restoreConsole();
  });

  it("runs test for js and rust", async () => {
    const restoreConsole = mockConsole(["log", "info"]);
    const fullIntegration = f.copy("integration.js-and-rust-with-changes");
    const covectored = await run(
      covector({
        command: "test",
        cwd: fullIntegration,
        dryRun: true,
      })
    );
    expect({
      consoleLog: consoleMock.log.mock.calls,
      consoleInfo: consoleMock.info.mock.calls,
      covectorReturn: covectored,
    }).toMatchSnapshot();
    restoreConsole();
  });

  it("runs build for js and rust", async () => {
    const restoreConsole = mockConsole(["log", "info"]);
    const fullIntegration = f.copy("integration.js-and-rust-with-changes");
    const covectored = await run(
      covector({
        command: "build",
        cwd: fullIntegration,
        dryRun: true,
      })
    );
    expect({
      consoleLog: consoleMock.log.mock.calls,
      consoleInfo: consoleMock.info.mock.calls,
      covectorReturn: scrubVfile(covectored),
    }).toMatchSnapshot();
    restoreConsole();
  });
});

describe("integration test with preMode `on`", () => {
  let restoreConsole: Function;
  const makePre = (folder: string, prevChanges: string[] = []) =>
    fs.writeFileSync(
      path.join(folder, "./.changes/pre.json"),
      `
  {
    "tag": "beta",
    "changes": [${prevChanges.length === 0 ? "" : prevChanges.join(", ")}]
  }
  `
    );

  beforeEach(() => {
    restoreConsole = mockConsole(["log", "dir", "info", "warn", "error"]);
  });
  afterEach(() => {
    restoreConsole();
  });

  it("runs version in production for js and rust", async () => {
    const fullIntegration = f.copy("integration.js-and-rust-with-changes");
    // this enables "pre" mode
    makePre(fullIntegration);

    const covectored = await run(
      covector({
        command: "version",
        cwd: fullIntegration,
      })
    );
    expect({
      consoleLog: consoleMock.log.mock.calls,
      consoleInfo: consoleMock.info.mock.calls,
      //@ts-ignore
      covectorReturn: Object.keys(covectored).reduce((pkgs, pkg) => {
        // remove these as they are dependent on the OS
        // and user running them so would always fail
        //@ts-ignore
        delete pkgs[pkg].applied.vfile;
        return pkgs;
      }, covectored),
    }).toMatchSnapshot();

    const changelogTauriCore = await toVFile.read(
      path.join(fullIntegration, "/tauri/", "CHANGELOG.md"),
      "utf-8"
    );
    // has a direct minor from 0.5.2
    expect(changelogTauriCore.contents).toBe(
      "# Changelog\n\n" +
        "## \\[0.6.0-beta.0]\n\n" +
        "- Summary about the changes in tauri\n"
    );

    const changelogTaurijs = await toVFile.read(
      path.join(fullIntegration, "/cli/tauri.js/", "CHANGELOG.md"),
      "utf-8"
    );
    // tauri.js through a dep bump
    expect(changelogTaurijs.contents).toBe(
      "# Changelog\n\n" +
        "## \\[0.6.3-beta.0]\n\n" +
        "- Summary about the changes in tauri\n"
    );
  });

  it("runs version in production with existing changes for js and rust", async () => {
    const fullIntegration = f.copy("integration.js-and-rust-with-changes");
    // this enables "pre" mode
    makePre(fullIntegration);
    const covectoredOne = await run(
      covector({
        command: "version",
        cwd: fullIntegration,
      })
    );

    const changelogTauriCoreOne = await toVFile.read(
      path.join(fullIntegration, "/tauri/", "CHANGELOG.md"),
      "utf-8"
    );
    expect(changelogTauriCoreOne.contents).toBe(
      "# Changelog\n\n" +
        "## \\[0.6.0-beta.0]\n\n" +
        "- Summary about the changes in tauri\n"
    );

    const changelogTaurijsOne = await toVFile.read(
      path.join(fullIntegration, "/cli/tauri.js/", "CHANGELOG.md"),
      "utf-8"
    );
    // tauri.js does not have a change file directly or through a dep bump
    // so it should remain the same
    expect(changelogTaurijsOne.contents).toBe(
      "# Changelog\n\n" +
        "## \\[0.6.3-beta.0]\n\n" +
        "- Summary about the changes in tauri\n"
    );

    const preOne = await toVFile.read(
      path.join(fullIntegration, ".changes", "pre.json"),
      "utf-8"
    );
    expect(preOne.contents).toBe(
      '{\n  "tag": "beta",\n  "changes": [\n    ".changes/first-change.md",\n    ".changes/second-change.md"\n  ]\n}\n'
    );

    // add change file
    fs.writeFileSync(
      path.join(fullIntegration, ".changes", "third-change.md"),
      `---
"tauri-api": patch
---

Boop again.
`
    );

    // double check the write and formatting
    const newChange = await toVFile.read(
      path.join(fullIntegration, ".changes", "third-change.md"),
      "utf-8"
    );
    expect(newChange.contents).toBe(
      "---\n" + '"tauri-api": patch\n' + "---\n\n" + "Boop again.\n"
    );

    const covectoredTwo = await run(
      covector({
        command: "version",
        cwd: fullIntegration,
      })
    );

    const changelogTauriCoreTwo = await toVFile.read(
      path.join(fullIntegration, "/tauri/", "CHANGELOG.md"),
      "utf-8"
    );
    expect(changelogTauriCoreTwo.contents).toBe(
      "# Changelog\n\n" +
        "## \\[0.6.0-beta.1]\n\n" +
        "- Boop again.\n" +
        "\n" +
        "## \\[0.6.0-beta.0]\n\n" +
        "- Summary about the changes in tauri\n"
    );

    const changelogTaurijsTwo = await toVFile.read(
      path.join(fullIntegration, "/cli/tauri.js/", "CHANGELOG.md"),
      "utf-8"
    );
    // tauri.js does not have a change file directly or through a dep bump
    // so it should remain the same
    expect(changelogTaurijsTwo.contents).toBe(
      "# Changelog\n\n" +
        "## \\[0.6.3-beta.1]\n\n" +
        "- Boop again.\n" +
        "\n" +
        "## \\[0.6.3-beta.0]\n\n" +
        "- Summary about the changes in tauri\n"
    );

    const preTwo = await toVFile.read(
      path.join(fullIntegration, ".changes", "pre.json"),
      "utf-8"
    );
    expect(preTwo.contents).toBe(
      '{\n  "tag": "beta",\n  "changes": [\n    ".changes/first-change.md",\n    ".changes/second-change.md",\n    ".changes/third-change.md"\n  ]\n}\n'
    );

    expect({
      consoleLog: consoleMock.log.mock.calls,
      consoleInfo: consoleMock.info.mock.calls,
      //@ts-ignore
      covectorReturnOne: Object.keys(covectoredOne).reduce((pkgs, pkg) => {
        // remove these as they are dependent on the OS
        // and user running them so would always fail
        //@ts-ignore
        delete pkgs[pkg].applied.vfile;
        return pkgs;
      }, covectoredOne),
      //@ts-ignore
      covectorReturnTwo: Object.keys(covectoredTwo).reduce((pkgs, pkg) => {
        // remove these as they are dependent on the OS
        // and user running them so would always fail
        //@ts-ignore
        delete pkgs[pkg].applied.vfile;
        return pkgs;
      }, covectoredTwo),
    }).toMatchSnapshot();
  });

  it("runs version in --dry-run mode for js and rust", async () => {
    const restoreConsole = mockConsole(["log", "info"]);
    const fullIntegration = f.copy("integration.js-and-rust-with-changes");
    // this enables "pre" mode
    makePre(fullIntegration);
    const covectored = await run(
      covector({
        command: "version",
        cwd: fullIntegration,
        dryRun: true,
      })
    );
    expect({
      consoleLog: consoleMock.log.mock.calls,
      consoleInfo: consoleMock.info.mock.calls,
      //@ts-ignore
      covectorReturn: Object.keys(covectored).reduce((pkgs, pkg) => {
        // remove these as they are dependent on the OS
        // and user running them so would always fail
        //@ts-ignore
        delete pkgs[pkg].applied.vfile;
        return pkgs;
      }, covectored),
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
});

describe("integration test for complex commands", () => {
  it("runs version for prod", async () => {
    const restoreConsole = mockConsole(["log", "info"]);
    const fullIntegration = f.copy("integration.js-with-complex-commands");
    const covectored = await run(
      covector({
        command: "version",
        cwd: fullIntegration,
      })
    );
    expect({
      consoleLog: consoleMock.log.mock.calls,
      consoleInfo: consoleMock.info.mock.calls,
      //@ts-ignore
      covectorReturn: Object.keys(covectored).reduce((pkgs, pkg) => {
        // remove these as they are dependent on the OS
        // and user running them so would always fail
        //@ts-ignore
        delete pkgs[pkg].applied.vfile;
        return pkgs;
      }, covectored),
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

  it("runs publish for prod", async () => {
    const restoreConsole = mockConsole(["log", "info"]);
    const fullIntegration = f.copy("integration.js-with-complex-commands");
    const covectored = await run(
      covector({
        command: "publish",
        cwd: fullIntegration,
      })
    );
    expect({
      consoleLog: consoleMock.log.mock.calls,
      consoleInfo: consoleMock.info.mock.calls,
      covectorReturn: scrubVfile(covectored),
    }).toMatchSnapshot();
    restoreConsole();
  });

  it("runs test for prod", async () => {
    const restoreConsole = mockConsole(["log", "info"]);
    const fullIntegration = f.copy("integration.js-with-complex-commands");
    const covectored = await run(
      covector({
        command: "test",
        cwd: fullIntegration,
      })
    );
    expect({
      consoleLog: consoleMock.log.mock.calls,
      consoleInfo: consoleMock.info.mock.calls,
      covectorReturn: scrubVfile(covectored),
    }).toMatchSnapshot();
    restoreConsole();
  });

  it("runs build for prod", async () => {
    const restoreConsole = mockConsole(["log", "info"]);
    const fullIntegration = f.copy("integration.js-with-complex-commands");
    const covectored = await run(
      covector({
        command: "build",
        cwd: fullIntegration,
      })
    );
    expect({
      consoleLog: consoleMock.log.mock.calls,
      consoleInfo: consoleMock.info.mock.calls,
      covectorReturn: scrubVfile(covectored),
    }).toMatchSnapshot();
    restoreConsole();
  });

  it("runs version in --dry-run mode", async () => {
    const restoreConsole = mockConsole(["log", "info"]);
    const fullIntegration = f.copy("integration.js-with-complex-commands");
    const covectored = await run(
      covector({
        command: "version",
        cwd: fullIntegration,
        dryRun: true,
      })
    );
    expect({
      consoleLog: consoleMock.log.mock.calls,
      consoleInfo: consoleMock.info.mock.calls,
      //@ts-ignore
      covectorReturn: Object.keys(covectored).reduce((pkgs, pkg) => {
        // remove these as they are dependent on the OS
        // and user running them so would always fail
        //@ts-ignore
        delete pkgs[pkg].applied.vfile;
        return pkgs;
      }, covectored),
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

  it("runs publish in --dry-run mode", async () => {
    const restoreConsole = mockConsole(["log", "info"]);
    const fullIntegration = f.copy("integration.js-with-complex-commands");
    const covectored = await run(
      covector({
        command: "publish",
        cwd: fullIntegration,
        dryRun: true,
      })
    );
    expect({
      consoleLog: consoleMock.log.mock.calls,
      consoleInfo: consoleMock.info.mock.calls,
      covectorReturn: scrubVfile(covectored),
    }).toMatchSnapshot();
    restoreConsole();
  });

  it("runs test in --dry-run mode", async () => {
    const restoreConsole = mockConsole(["log", "info"]);
    const fullIntegration = f.copy("integration.js-with-complex-commands");
    const covectored = await run(
      covector({
        command: "test",
        cwd: fullIntegration,
        dryRun: true,
      })
    );
    expect({
      consoleLog: consoleMock.log.mock.calls,
      consoleInfo: consoleMock.info.mock.calls,
      covectorReturn: scrubVfile(covectored),
    }).toMatchSnapshot();
    restoreConsole();
  });

  it("runs build in --dry-run mode", async () => {
    const restoreConsole = mockConsole(["log", "info"]);
    const fullIntegration = f.copy("integration.js-with-complex-commands");
    const covectored = await run(
      covector({
        command: "build",
        cwd: fullIntegration,
        dryRun: true,
      })
    );
    expect({
      consoleLog: consoleMock.log.mock.calls,
      consoleInfo: consoleMock.info.mock.calls,
      covectorReturn: scrubVfile(covectored),
    }).toMatchSnapshot();
    restoreConsole();
  });
});

// vfile returns fs information that is flaky between machines, scrub it
const scrubVfile = (covectored: any) => {
  return Object.keys(covectored).reduce((c, pkg) => {
    delete c[pkg].pkg.pkgFile.vfile;
    return c;
  }, covectored);
};

describe("integration test to invoke sub commands", () => {
  it("runs publish-primary in prod mode", async () => {
    const restoreConsole = mockConsole(["log", "info"]);
    const fullIntegration = f.copy("integration.js-with-subcommands");
    const covectored = await run(
      covector({
        command: "publish-primary",
        cwd: fullIntegration,
      })
    );
    expect({
      consoleLog: consoleMock.log.mock.calls,
      consoleInfo: consoleMock.info.mock.calls,
      covectorReturn: scrubVfile(covectored),
    }).toMatchSnapshot();
    restoreConsole();
  });

  it("runs publishSecondary in prod mode", async () => {
    const restoreConsole = mockConsole(["log", "info"]);
    const fullIntegration = f.copy("integration.js-with-subcommands");
    const covectored = await run(
      covector({
        command: "publishSecondary",
        cwd: fullIntegration,
      })
    );
    expect({
      consoleLog: consoleMock.log.mock.calls,
      consoleInfo: consoleMock.info.mock.calls,
      covectorReturn: scrubVfile(covectored),
    }).toMatchSnapshot();
    restoreConsole();
  });
});

describe("integration test for preview command", () => {
  let restoreConsole: Function;
  beforeEach(() => {
    restoreConsole = mockConsole(["log", "dir", "info", "error"]);
  });
  afterEach(() => {
    restoreConsole();
  });

  it("runs version and publish for js and rust", async () => {
    const fullIntegration = f.copy("integration.js-and-rust-for-preview");
    const covectored = await run(
      covector({
        command: "preview",
        cwd: fullIntegration,
        previewVersion: "branch-name.12345",
      })
    );

    expect({
      consoleLog: consoleMock.log.mock.calls,
      consoleInfo: consoleMock.info.mock.calls,
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

  it("runs version and publish for js and rust", async () => {
    const fullIntegration = f.copy("integration.js-and-rust-for-preview");
    const covectored = await run(
      covector({
        command: "preview",
        cwd: fullIntegration,
        previewVersion: "branch-name.12345",
        branchTag: "branch_name",
      })
    );

    expect({
      consoleLog: consoleMock.log.mock.calls,
      consoleInfo: consoleMock.info.mock.calls,
      covectorReturn: scrubVfile(covectored),
    }).toMatchSnapshot();
  });
});
