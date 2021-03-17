import { attemptCommands, sh } from "./index";
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
    it("invokes a function", function* () {
      yield attemptCommands({
        commands: [
          {
            name: "pkg-nickname",
            version: "0.5.6",
            //@ts-ignore
            command: async () => console.log("boop"),
          },
        ],
      });

      //@ts-ignore
      expect(console.log.mock.calls).toEqual([["boop"]]);
    });

    it("invokes an array of functions", function* () {
      yield attemptCommands({
        commands: [
          {
            name: "pkg-nickname",
            version: "0.5.6",
            //@ts-ignore
            command: [
              async () => console.log("boop"),
              async () => console.log("booop"),
              async () => console.log("boooop"),
              async () => console.log("booooop"),
            ],
          },
        ],
      });

      //@ts-ignore
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
            name: "pkg-nickname",
            version: "0.5.6",
            //@ts-ignore
            command: async (pkg) =>
              console.log(`boop ${pkg.name}@${pkg.version}`),
          },
        ],
      });

      //@ts-ignore
      expect(console.log.mock.calls).toEqual([["boop pkg-nickname@0.5.6"]]);
    });

    it("invokes an array of functions using package values", function* () {
      yield attemptCommands({
        commands: [
          {
            name: "pkg-nickname",
            version: "0.5.6",
            //@ts-ignore
            command: [
              async (pkg: any) =>
                console.log(`boop ${pkg.name}@${pkg.version}`),
              async (pkg: any) =>
                console.log(`booop ${pkg.name}@${pkg.version}`),
              async (pkg: any) =>
                console.log(`boooop ${pkg.name}@${pkg.version}`),
              async (pkg: any) =>
                console.log(`booooop ${pkg.name}@${pkg.version}`),
            ],
          },
        ],
      });

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
    it("considers piped commands", function* (): Generator<any> {
      const out = yield sh(
        "echo this thing | echo but actually this",
        {},
        false
      );
      expect(out).toBe("but actually this");
    });

    // it("issues simple commands", function* (): Generator<any> {
    // this errors out for some reason? error below
    // TypeError: Cannot read property 'link' of undefined
    // const out = yield sh("ls", {}, false);
    // expect(out).toBe("this thing");
    // });
  });
});
