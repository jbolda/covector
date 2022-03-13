import { covector } from "../src";
import { CovectorVersion } from "@covector/types";
import { run } from "effection";
import { it } from "@effection/jest";
//@ts-ignore
import toVFile from "to-vfile";
import path from "path";
import * as fs from "fs";
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
    //@ts-ignore
    delete covectored.id;
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
      //@ts-ignore
      covectorReturn: Object.keys(covectored.commandsRan).reduce(
        (pkgs, pkg) => {
          // remove these as they are dependent on the OS
          // and user running them so would always fail
          //@ts-ignore
          delete pkgs[pkg].applied.vfile;
          return pkgs;
        },
        covectored.commandsRan
      ),
    }).toMatchSnapshot();

    const changelogTauriCore = yield toVFile.read(
      path.join(fullIntegration, "/tauri/", "CHANGELOG.md"),
      "utf-8"
    );
    expect(changelogTauriCore.contents).toBe(
      "# Changelog\n\n" +
        "## \\[0.6.0]\n\n" +
        "- Summary about the changes in tauri\n"
    );

    const changelogTaurijs = yield toVFile.read(
      path.join(fullIntegration, "/cli/tauri.js/", "CHANGELOG.md"),
      "utf-8"
    );
    expect(changelogTaurijs.contents).toBe(
      "# Changelog\n\n" +
        "## \\[0.6.3]\n\n" +
        "- Summary about the changes in tauri\n"
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
      //@ts-ignore
      covectorReturn: Object.keys(covectored.commandsRan).reduce(
        (pkgs, pkg) => {
          // remove these as they are dependent on the OS
          // and user running them so would always fail
          //@ts-ignore
          delete pkgs[pkg].applied.vfile;
          return pkgs;
        },
        covectored.commandsRan
      ),
    }).toMatchSnapshot();

    const changelog = yield toVFile.read(
      path.join(fullIntegration, "CHANGELOG.md"),
      "utf-8"
    );
    expect(changelog.contents).toBe(
      "# Changelog\n\n" +
        "## \\[0.4.0]\n\n" +
        "- Summary about the changes in test_app\n" +
        "- Summary about the changes again(!) in test_app\n"
    );

    const versionFile = yield toVFile.read(
      path.join(fullIntegration, "pubspec.yaml"),
      "utf-8"
    );
    expect(versionFile.contents).toEqual(
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
      //@ts-ignore
      covectorReturn: Object.keys(covectored.commandsRan).reduce(
        (pkgs, pkg) => {
          // remove these as they are dependent on the OS
          // and user running them so would always fail
          //@ts-ignore
          delete pkgs[pkg].applied.vfile;
          return pkgs;
        },
        covectored.commandsRan
      ),
    }).toMatchSnapshot();

    const changelog = yield toVFile.read(
      path.join(fullIntegration, "dart", "CHANGELOG.md"),
      "utf-8"
    );
    expect(changelog.contents).toBe(
      "# Changelog\n\n" +
        "## \\[0.3.2]\n\n" +
        "- Summary about the changes in test_app_two\n"
    );

    const versionFile = yield toVFile.read(
      path.join(fullIntegration, "dart", "pubspec.yaml"),
      "utf-8"
    );
    expect(versionFile.contents).toEqual(
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
      //@ts-ignore
      covectorReturn: Object.keys(covectored.commandsRan).reduce(
        (pkgs, pkg) => {
          // remove these as they are dependent on the OS
          // and user running them so would always fail
          //@ts-ignore
          delete pkgs[pkg].applied.vfile;
          return pkgs;
        },
        covectored.commandsRan
      ),
    }).toMatchSnapshot();

    const changelog = yield toVFile.read(
      path.join(fullIntegration, "CHANGELOG.md"),
      "utf-8"
    );
    expect(changelog.contents).toBe(
      "# Changelog\n\n" +
        "## \\[6.2.0]\n\n" +
        "- Summary about the changes in general-pkg\n" +
        "- A general summary about the generally changes in general-pkg generally\n"
    );

    const versionFile = yield toVFile.read(
      path.join(fullIntegration, "VERSION"),
      "utf-8"
    );
    expect(versionFile.contents).toBe("6.2.0");
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
      covectorReturn: scrubVfile(covectored),
    }).toMatchSnapshot();
  });

  it("runs publish for dart / flutter", function* () {
    const fullIntegration = f.copy("integration.dart-flutter-single");
    const covectored = yield covector({
      command: "publish",
      cwd: fullIntegration,
    });
    expect({
      consoleLog: (console.log as any).mock.calls,
      consoleInfo: (console.info as any).mock.calls,
      covectorReturn: scrubVfile(covectored),
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
      covectorReturn: scrubVfile(covectored),
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
      covectorReturn: scrubVfile(covectored),
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
  });

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

describe("integration test in --dry-run mode", () => {
  it("passes correct config for js and rust", function* () {
    const restoreConsole = mockConsole(["log", "dir"]);
    const fullIntegration = f.copy("integration.js-and-rust-with-changes");
    const covectored = yield covector({
      command: "status",
      cwd: fullIntegration,
      dryRun: true,
    });
    expect({
      consoleLog: (console.log as any).mock.calls,
      consoleDir: (console.dir as any).mock.calls,
      covectorReturn: covectored,
    }).toMatchSnapshot();
    restoreConsole();
  });

  it("runs version for js and rust", function* () {
    const restoreConsole = mockConsole(["log", "info"]);
    const fullIntegration = f.copy("integration.js-and-rust-with-changes");
    const covectored = (yield covector({
      command: "version",
      cwd: fullIntegration,
      dryRun: true,
    })) as CovectorVersion;
    if (typeof covectored !== "object")
      throw new Error("We are expecting an object here.");
    expect({
      consoleLog: (console.log as any).mock.calls,
      consoleInfo: (console.info as any).mock.calls,
      //@ts-ignore
      covectorReturn: Object.keys(covectored.commandsRan).reduce(
        (pkgs, pkg) => {
          // remove these as they are dependent on the OS
          // and user running them so would always fail
          //@ts-ignore
          delete pkgs[pkg].applied.vfile;
          return pkgs;
        },
        covectored.commandsRan
      ),
    }).toMatchSnapshot();

    const changelogTauriCore = toVFile.read(
      path.join(fullIntegration, "/tauri/", "CHANGELOG.md"),
      "utf-8"
    );
    yield expect(changelogTauriCore).rejects.toThrow();

    const changelogTaurijs = toVFile.read(
      path.join(fullIntegration, "/cli/tauri.js/", "CHANGELOG.md"),
      "utf-8"
    );
    yield expect(changelogTaurijs).rejects.toThrow();

    restoreConsole();
  });

  it("runs publish for js and rust", function* () {
    const restoreConsole = mockConsole(["log", "info"]);
    const fullIntegration = f.copy("integration.js-and-rust-with-changes");
    const covectored = yield covector({
      command: "publish",
      cwd: fullIntegration,
      dryRun: true,
    });
    expect({
      consoleLog: (console.log as any).mock.calls,
      consoleInfo: (console.info as any).mock.calls,
      covectorReturn: scrubVfile(covectored),
    }).toMatchSnapshot();
    restoreConsole();
  });

  it("runs test for js and rust", function* () {
    const restoreConsole = mockConsole(["log", "info"]);
    const fullIntegration = f.copy("integration.js-and-rust-with-changes");
    const covectored = yield covector({
      command: "test",
      cwd: fullIntegration,
      dryRun: true,
    });
    expect({
      consoleLog: (console.log as any).mock.calls,
      consoleInfo: (console.info as any).mock.calls,
      covectorReturn: covectored,
    }).toMatchSnapshot();
    restoreConsole();
  });

  it("runs build for js and rust", function* () {
    const restoreConsole = mockConsole(["log", "info"]);
    const fullIntegration = f.copy("integration.js-and-rust-with-changes");
    const covectored = yield covector({
      command: "build",
      cwd: fullIntegration,
      dryRun: true,
    });
    expect({
      consoleLog: (console.log as any).mock.calls,
      consoleInfo: (console.info as any).mock.calls,
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

  it("runs version in production for js and rust", function* () {
    const fullIntegration = f.copy("integration.js-and-rust-with-changes");
    // this enables "pre" mode
    makePre(fullIntegration);

    const covectored = (yield covector({
      command: "version",
      cwd: fullIntegration,
    })) as CovectorVersion;
    if (typeof covectored !== "object")
      throw new Error("We are expecting an object here.");
    expect({
      consoleLog: (console.log as any).mock.calls,
      consoleInfo: (console.info as any).mock.calls,
      //@ts-ignore
      covectorReturn: Object.keys(covectored.commandsRan).reduce(
        (pkgs, pkg) => {
          // remove these as they are dependent on the OS
          // and user running them so would always fail
          //@ts-ignore
          delete pkgs[pkg].applied.vfile;
          return pkgs;
        },
        covectored.commandsRan
      ),
    }).toMatchSnapshot();

    const changelogTauriCore = yield toVFile.read(
      path.join(fullIntegration, "/tauri/", "CHANGELOG.md"),
      "utf-8"
    );
    // has a direct minor from 0.5.2
    expect(changelogTauriCore.contents).toBe(
      "# Changelog\n\n" +
        "## \\[0.6.0-beta.0]\n\n" +
        "- Summary about the changes in tauri\n"
    );

    const changelogTaurijs = yield toVFile.read(
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

  it("runs version in production with existing changes for js and rust", function* () {
    const fullIntegration = f.copy("integration.js-and-rust-with-changes");
    // this enables "pre" mode
    makePre(fullIntegration);
    const covectoredOne = (yield covector({
      command: "version",
      cwd: fullIntegration,
    })) as CovectorVersion;

    const changelogTauriCoreOne = yield toVFile.read(
      path.join(fullIntegration, "/tauri/", "CHANGELOG.md"),
      "utf-8"
    );
    expect(changelogTauriCoreOne.contents).toBe(
      "# Changelog\n\n" +
        "## \\[0.6.0-beta.0]\n\n" +
        "- Summary about the changes in tauri\n"
    );

    const changelogTaurijsOne = yield toVFile.read(
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

    const preOne = yield toVFile.read(
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
    const newChange = yield toVFile.read(
      path.join(fullIntegration, ".changes", "third-change.md"),
      "utf-8"
    );
    expect(newChange.contents).toBe(
      "---\n" + '"tauri-api": patch\n' + "---\n\n" + "Boop again.\n"
    );

    const covectoredTwo = (yield covector({
      command: "version",
      cwd: fullIntegration,
    })) as CovectorVersion;

    const changelogTauriCoreTwo = yield toVFile.read(
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

    const changelogTaurijsTwo = yield toVFile.read(
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

    const preTwo = yield toVFile.read(
      path.join(fullIntegration, ".changes", "pre.json"),
      "utf-8"
    );
    expect(preTwo.contents).toBe(
      '{\n  "tag": "beta",\n  "changes": [\n    ".changes/first-change.md",\n    ".changes/second-change.md",\n    ".changes/third-change.md"\n  ]\n}\n'
    );

    if (typeof covectoredOne !== "object")
      throw new Error("We are expecting an object here.");
    if (typeof covectoredTwo !== "object")
      throw new Error("We are expecting an object here.");
    expect({
      consoleLog: (console.log as any).mock.calls,
      consoleInfo: (console.info as any).mock.calls,
      //@ts-ignore
      covectorReturnOne: Object.keys(covectoredOne.commandsRan).reduce(
        (pkgs, pkg) => {
          // remove these as they are dependent on the OS
          // and user running them so would always fail
          //@ts-ignore
          delete pkgs[pkg].applied.vfile;
          return pkgs;
        },
        covectoredOne.commandsRan
      ),
      //@ts-ignore
      covectorReturnTwo: Object.keys(covectoredTwo.commandsRan).reduce(
        (pkgs, pkg) => {
          // remove these as they are dependent on the OS
          // and user running them so would always fail
          //@ts-ignore
          delete pkgs[pkg].applied.vfile;
          return pkgs;
        },
        covectoredTwo.commandsRan
      ),
    }).toMatchSnapshot();
  });

  it("runs version in --dry-run mode for js and rust", function* () {
    const restoreConsole = mockConsole(["log", "info"]);
    const fullIntegration = f.copy("integration.js-and-rust-with-changes");
    // this enables "pre" mode
    makePre(fullIntegration);
    const covectored = (yield covector({
      command: "version",
      cwd: fullIntegration,
      dryRun: true,
    })) as CovectorVersion;
    if (typeof covectored !== "object")
      throw new Error("We are expecting an object here.");
    expect({
      consoleLog: (console.log as any).mock.calls,
      consoleInfo: (console.info as any).mock.calls,
      //@ts-ignore
      covectorReturn: Object.keys(covectored.commandsRan).reduce(
        (pkgs, pkg) => {
          // remove these as they are dependent on the OS
          // and user running them so would always fail
          //@ts-ignore
          delete pkgs[pkg].applied.vfile;
          return pkgs;
        },
        covectored.commandsRan
      ),
    }).toMatchSnapshot();

    const changelogTauriCore = toVFile.read(
      path.join(fullIntegration, "/tauri/", "CHANGELOG.md"),
      "utf-8"
    );
    yield expect(changelogTauriCore).rejects.toThrow();

    const changelogTaurijs = toVFile.read(
      path.join(fullIntegration, "/cli/tauri.js/", "CHANGELOG.md"),
      "utf-8"
    );
    yield expect(changelogTaurijs).rejects.toThrow();

    restoreConsole();
  });
});

describe("integration test for complex commands", () => {
  it("runs version for prod", function* () {
    jest.setTimeout(7000);
    const restoreConsole = mockConsole(["log", "info"]);
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
      //@ts-ignore
      covectorReturn: Object.keys(covectored.commandsRan).reduce(
        (pkgs, pkg) => {
          // remove these as they are dependent on the OS
          // and user running them so would always fail
          //@ts-ignore
          delete pkgs[pkg].applied.vfile;
          return pkgs;
        },
        covectored.commandsRan
      ),
    }).toMatchSnapshot();

    const changelogTauriCore = toVFile.read(
      path.join(fullIntegration, "/tauri/", "CHANGELOG.md"),
      "utf-8"
    );
    yield expect(changelogTauriCore).rejects.toThrow();

    const changelogTaurijs = toVFile.read(
      path.join(fullIntegration, "/cli/tauri.js/", "CHANGELOG.md"),
      "utf-8"
    );
    yield expect(changelogTaurijs).rejects.toThrow();

    restoreConsole();
  });

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
      covectorReturn: scrubVfile(covectored),
    }).toMatchSnapshot();
    restoreConsole();
  });

  it("runs test for prod", function* () {
    const restoreConsole = mockConsole(["log", "info"]);
    const fullIntegration = f.copy("integration.js-with-complex-commands");
    const covectored = yield covector({
      command: "test",
      cwd: fullIntegration,
    });
    expect({
      consoleLog: (console.log as any).mock.calls,
      consoleInfo: (console.info as any).mock.calls,
      covectorReturn: scrubVfile(covectored),
    }).toMatchSnapshot();
    restoreConsole();
  });

  it("runs build for prod", function* () {
    const restoreConsole = mockConsole(["log", "info"]);
    const fullIntegration = f.copy("integration.js-with-complex-commands");
    const covectored = yield covector({
      command: "build",
      cwd: fullIntegration,
    });
    expect({
      consoleLog: (console.log as any).mock.calls,
      consoleInfo: (console.info as any).mock.calls,
      covectorReturn: scrubVfile(covectored),
    }).toMatchSnapshot();
    restoreConsole();
  });

  it("runs version in --dry-run mode", function* () {
    const restoreConsole = mockConsole(["log", "info"]);
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
      consoleInfo: (console.info as any).mock.calls,
      //@ts-ignore
      covectorReturn: Object.keys(covectored.commandsRan).reduce(
        (pkgs, pkg) => {
          // remove these as they are dependent on the OS
          // and user running them so would always fail
          //@ts-ignore
          delete pkgs[pkg].applied.vfile;
          return pkgs;
        },
        covectored.commandsRan
      ),
    }).toMatchSnapshot();

    const changelogTauriCore = toVFile.read(
      path.join(fullIntegration, "/tauri/", "CHANGELOG.md"),
      "utf-8"
    );
    yield expect(changelogTauriCore).rejects.toThrow();

    const changelogTaurijs = toVFile.read(
      path.join(fullIntegration, "/cli/tauri.js/", "CHANGELOG.md"),
      "utf-8"
    );
    yield expect(changelogTaurijs).rejects.toThrow();

    restoreConsole();
  });

  it("runs publish in --dry-run mode", function* () {
    const restoreConsole = mockConsole(["log", "info"]);
    const fullIntegration = f.copy("integration.js-with-complex-commands");
    const covectored = yield covector({
      command: "publish",
      cwd: fullIntegration,
      dryRun: true,
    });
    expect({
      consoleLog: (console.log as any).mock.calls,
      consoleInfo: (console.info as any).mock.calls,
      covectorReturn: scrubVfile(covectored),
    }).toMatchSnapshot();
    restoreConsole();
  });

  it("runs test in --dry-run mode", function* () {
    const restoreConsole = mockConsole(["log", "info"]);
    const fullIntegration = f.copy("integration.js-with-complex-commands");
    const covectored = yield covector({
      command: "test",
      cwd: fullIntegration,
      dryRun: true,
    });
    expect({
      consoleLog: (console.log as any).mock.calls,
      consoleInfo: (console.info as any).mock.calls,
      covectorReturn: scrubVfile(covectored),
    }).toMatchSnapshot();
    restoreConsole();
  });

  it("runs build in --dry-run mode", function* () {
    const restoreConsole = mockConsole(["log", "info"]);
    const fullIntegration = f.copy("integration.js-with-complex-commands");
    const covectored = yield covector({
      command: "build",
      cwd: fullIntegration,
      dryRun: true,
    });
    expect({
      consoleLog: (console.log as any).mock.calls,
      consoleInfo: (console.info as any).mock.calls,
      covectorReturn: scrubVfile(covectored),
    }).toMatchSnapshot();
    restoreConsole();
  });
});

// vfile returns fs information that is flaky between machines, scrub it
const scrubVfile = (covectored: any) => {
  return Object.keys(covectored.commandsRan).reduce((c, pkg) => {
    delete c[pkg].pkg.pkgFile.vfile;
    return c;
  }, covectored.commandsRan);
};

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
      covectorReturn: scrubVfile(covectored),
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
