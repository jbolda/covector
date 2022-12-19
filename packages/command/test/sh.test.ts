import { it, captureError } from "@effection/jest";
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

  describe("shell defined", () => {
    it("shell opted in", function* () {
      const out = yield sh("echo this thing", { shell: true }, false);
      expect(out).toBe("this thing");
    });

    it("defines bash as shell", function* () {
      const out = yield sh("echo this thing", { shell: "bash" }, false);
      expect(out).toBe("this thing");
    });

    if (process.platform !== "win32") {
      it("defines sh as shell", function* () {
        const out = yield sh("echo this thing", { shell: "sh" }, false);
        expect(out).toBe("this thing");
      });
    }

    if (process.platform === "win32") {
      it("defines cmd as shell", function* () {
        const out = yield sh("echo this thing", { shell: "cmd" }, false);
        expect(out).toBe("this thing");
      });

      it("defines pwsh as shell", function* () {
        const out = yield sh("echo this thing", { shell: "pwsh" }, false);
        expect(out).toBe("this\r\nthing");
      });
    }
  });

  if (process.platform !== "win32") {
    describe("pipe commands when !win32", () => {
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

  if (process.platform === "win32") {
    describe("pipe commands when win32", () => {
      // will use whatever shell at process.env.shell
      it("considers piped commands, opted in", function* () {
        const out = yield sh(
          "echo this thing | echo but actually this",
          { shell: true },
          false
        );

        // this should always use git bash, same as defining it
        expect(out).toBe("but actually this");
      });

      it("considers piped commands, uses fallback to shell", function* () {
        const out = yield sh(
          "echo this thing | echo but actually this",
          {},
          false
        );

        // fallback is whichever shell this is run from
        //  check if bash which can handle otherwise assume it can't
        if (process.env.shell && process.env.shell.includes("bash.exe")) {
          expect(out).toBe("but actually this");
        } else {
          expect(out).toBe("this thing | echo but actually this");
        }
      });

      it("considers piped commands, defines cmd as shell", function* () {
        const out = yield sh(
          "echo this thing | echo but actually this",
          { shell: "cmd" },
          false
        );
        // should act like the fallback
        expect(out).toBe("but actually this");
      });

      it("considers piped commands, defines bash as shell", function* () {
        const out = yield sh(
          "echo this thing | echo but actually this",
          { shell: "bash" },
          false
        );
        // can handle pipes just fine, works like other OS
        expect(out).toBe("but actually this");
      });

      it("considers piped commands, defines pwsh as shell", function* () {
        const out = yield captureError(
          sh(
            "echo this thing | echo but actually this",
            { shell: "pwsh" },
            false
          )
        );
        // pwsh doesn't handle pipes with echo
        expect(out.message).toBe(
          "spawn echo this thing | echo but actually this ENOENT"
        );
      });
    });
  }
});
