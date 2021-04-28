import { covector } from "./src";
import { run } from "effection";
//@ts-ignore
import toVFile from "to-vfile";
import path from "path";
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
    const fullIntegration = f.copy("integration.js-and-rust-with-changes");
    const covectored = await run(
      covector({
        command: "preview",
        cwd: fullIntegration,
        previewVersion: 'branch-name.12345'
      })
    );

    expect({
      consoleLog: consoleMock.log.mock.calls,
      consoleInfo: consoleMock.info.mock.calls,
      covectorReturn: scrubVfile(covectored),
    }).toMatchSnapshot();
  });
})