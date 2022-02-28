import { run } from "effection";
import { attemptCommands, sh } from "../src";
import mockConsole, { RestoreConsole } from "jest-mock-console";
import fixtures from "fixturez";
const f = fixtures(__dirname);

describe("command", () => {
  let restoreConsole: RestoreConsole;
  beforeEach(() => {
    restoreConsole = mockConsole(["log", "dir"]);
  });
  afterEach(() => {
    restoreConsole();
  });

  describe("attemptCommand", () => {
    it("invokes a function", async () => {
      await run(
        attemptCommands({
          commands: [
            {
              name: "pkg-nickname",
              pkgFile: { version: "0.5.6" },
              //@ts-ignore
              command: async () => console.log("boop"),
            },
          ],
        })
      );

      //@ts-ignore
      expect(console.log.mock.calls).toEqual([["boop"]]);
    });

    it("invokes an array of functions", async () => {
      await run(
        attemptCommands({
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
        })
      );

      //@ts-ignore
      expect(console.log.mock.calls).toEqual([
        ["boop"],
        ["booop"],
        ["boooop"],
        ["booooop"],
      ]);
    });

    it("invokes a function using package values", async () => {
      await run(
        attemptCommands({
          commands: [
            {
              pkg: "pkg-nickname",
              pkgFile: { version: "0.5.6" },
              //@ts-ignore
              command: async (pkg: any) =>
                console.log(`boop ${pkg.pkg}@${pkg.pkgFile.version}`),
            },
          ],
          command: "publish",
          cwd: "",
          dryRun: false,
        })
      );

      //@ts-ignore
      expect(console.log.mock.calls).toEqual([["boop pkg-nickname@0.5.6"]]);
    });

    it("invokes an array of functions using package values", async () => {
      await run(
        attemptCommands({
          commands: [
            {
              pkg: "pkg-nickname",
              pkgFile: { version: "0.5.6" },
              manager: "none",
              //@ts-ignore
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
        })
      );

      //@ts-ignore
      expect(console.log.mock.calls).toEqual([
        ["boop pkg-nickname@0.5.6"],
        ["booop pkg-nickname@0.5.6"],
        ["boooop pkg-nickname@0.5.6"],
        ["booooop pkg-nickname@0.5.6"],
      ]);
    });
  });

  describe("sh", () => {
    it("handle base command", async () => {
      const out = await run(sh("npm help", {}, false));
      expect(out.substring(0, 23)).toEqual(
        `npm <command>

Usage:

`
      );
    });

    it("handle single command", async () => {
      const out = await run(sh("echo 'this thing'", {}, false));
      expect(out).toBe("this thing");
    });

    it.skip("considers piped commands", async () => {
      const out = await run(
        sh("echo this thing | echo but actually this", { shell: true }, false)
      );
      expect(out).toBe("but actually this");
    });
  });
});
