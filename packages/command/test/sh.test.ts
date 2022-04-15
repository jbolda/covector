import { it } from "@effection/jest";
import { sh } from "../src";
import mockConsole, { RestoreConsole } from "jest-mock-console";
import fixtures from "fixturez";
const f = fixtures(__dirname);

describe("sh", () => {
  let restoreConsole: RestoreConsole;
  beforeEach(() => {
    restoreConsole = mockConsole(["log", "dir"]);
  });
  afterEach(() => {
    restoreConsole();
  });

  it("handle base command", function* () {
    const out = yield sh("npm help", {}, false);
    expect(out.substring(0, 23)).toEqual(
      `npm <command>

Usage:

`
    );
  });

  it("handle single command", function* () {
    const out = yield sh("echo 'this thing'", {}, false);
    expect(out).toBe("this thing");
  });

  if (process.platform !== "win32") {
    describe("commands when !win32", () => {
      it("considers piped commands, opted in", function* () {
        const out = yield sh(
          "echo this thing | echo but actually this",
          { shell: true },
          false
        );
        expect(out).toBe("but actually this");
      });

      it("considers piped commands, uses fallback to shell", function* () {
        const out = yield sh(
          "echo this thing | echo but actually this",
          {},
          false
        );
        expect(out).toBe("but actually this");
      });
    });
  }

  describe("commands cross platform", () => {
    // this will run with shell: true
    // except on windows which inherits from shell
    it("considers piped commands, preset bash-like", function* () {
      const out = yield sh(
        "echo this thing | echo but actually this",
        { preset: "bash-like" },
        false
      );
      expect(out).toBe("but actually this");
    });

    // this will run through cmd.exe on windows
    it("considers piped commands, preset compatibility", function* () {
      const out = yield sh(
        "echo this thing | echo but actually this",
        { preset: "compatibility" },
        false
      );
      expect(out).toBe("but actually this");
    });
  });
});
