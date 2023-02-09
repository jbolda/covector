import { it } from "@effection/jest";
import { attemptCommands } from "../src";
import mockConsole, { RestoreConsole } from "jest-mock-console";
import fixtures from "fixturez";
const f = fixtures(__dirname);

describe("attemptCommand", () => {
  let restoreConsole: RestoreConsole;
  beforeEach(() => {
    restoreConsole = mockConsole(["log", "dir"]);
  });
  afterEach(() => {
    restoreConsole();
  });

  it("invokes a function", function* () {
    //@ts-expect-error
    yield attemptCommands({
      commands: [
        {
          name: "pkg-nickname",
          pkgFile: { version: "0.5.6", deps: {} },
          //@ts-expect-error
          command: async () => console.log("boop"),
        },
      ],
    });

    //@ts-expect-error
    expect(console.log.mock.calls).toEqual([["boop"]]);
  });

  it("invokes an array of functions", function* () {
    yield attemptCommands({
      commands: [
        {
          pkg: "pkg-nickname",
          manager: "none",
          command: [
            async () => console.log("boop"),
            async () => console.log("booop"),
            async () => console.log("boooop"),
            async () => console.log("booooop"),
          ],
        },
      ],
      command: "publish",
      cwd: "",
      dryRun: false,
    });

    //@ts-expect-error
    expect(console.log.mock.calls).toEqual([
      ["boop"],
      ["booop"],
      ["boooop"],
      ["booooop"],
    ]);
  });

  it("invokes a function using package values", function* () {
    yield attemptCommands({
      commands: [
        {
          pkg: "pkg-nickname",
          pkgFile: { version: "0.5.6", deps: {} },
          //@ts-expect-error
          command: async (pkg: any) =>
            console.log(`boop ${pkg.pkg}@${pkg.pkgFile.version}`),
        },
      ],
      command: "publish",
      cwd: "",
      dryRun: false,
    });

    //@ts-expect-error
    expect(console.log.mock.calls).toEqual([["boop pkg-nickname@0.5.6"]]);
  });

  it("invokes an array of functions using package values", function* () {
    yield attemptCommands({
      commands: [
        {
          pkg: "pkg-nickname",
          pkgFile: { version: "0.5.6", deps: {} },
          manager: "none",
          //@ts-expect-error
          command: [
            async (pkg: any) =>
              console.log(`boop ${pkg.pkg}@${pkg.pkgFile.version}`),
            async (pkg: any) =>
              console.log(`booop ${pkg.pkg}@${pkg.pkgFile.version}`),
            async (pkg: any) =>
              console.log(`boooop ${pkg.pkg}@${pkg.pkgFile.version}`),
            async (pkg: any) =>
              console.log(`booooop ${pkg.pkg}@${pkg.pkgFile.version}`),
          ],
        },
      ],
      command: "publish",
      cwd: "",
      dryRun: false,
    });

    //@ts-expect-error
    expect(console.log.mock.calls).toEqual([
      ["boop pkg-nickname@0.5.6"],
      ["booop pkg-nickname@0.5.6"],
      ["boooop pkg-nickname@0.5.6"],
      ["booooop pkg-nickname@0.5.6"],
    ]);
  });
});
