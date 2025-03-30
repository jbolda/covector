import { sh } from "../src";
import { describe, it, captureError } from "../../../helpers/test-scope.ts";
import { it as itPromises } from "vitest";
import { expect } from "vitest";
import pino from "pino";
import * as pinoTest from "pino-test";
import { x } from "tinyexec";
import { tokenizeArgs } from "args-tokenizer";

describe("tinyexec compatibility checks", () => {
  itPromises("handles multiline stdout", async () => {
    const commandString = `echo "this"\n"thing"`;
    const [command, ...args] = tokenizeArgs(commandString);
    const result = await x(command, args);
    expect(result.stdout.trim()).toBe(
      process.platform !== "win32" ? "this thing" : `"this" "thing"`
    );
  });

  // no grep on windows so it just returns empty?
  itPromises.runIf(process.platform !== "win32")("handles pipes", async () => {
    const commandString = `echo this\nthing`;
    const [command, ...commandArgs] = tokenizeArgs(commandString);
    const grepString = `grep this`;
    const [grep, ...grepArgs] = tokenizeArgs(grepString);
    const result = await x(command, commandArgs).pipe(grep, grepArgs);
    expect(result.stdout.trim()).toBe("this");
  });

  describe("with `shell: true`", () => {
    itPromises("single command", async () => {
      const commandString = `echo but this`;
      const [command, ...args] = tokenizeArgs(commandString);
      const result = await x(command, args, {
        nodeOptions: { shell: true },
      });
      expect(result.stdout.trim()).toBe("but this");
    });

    itPromises("multiple pipes", async () => {
      const commandString =
        'echo "this thing" | echo "and this" | echo "but this"';
      const [command, ...args] = tokenizeArgs(commandString);
      const result = await x(command, args, {
        nodeOptions: { shell: true },
      });
      expect(result.stdout.trim()).toBe("but this");
    });
  });
});

describe("sh", () => {
  const stream = pinoTest.sink();
  const logger = pino(stream);

  it("handle base command", function* () {
    const { out } = yield* sh("npm help", {}, false, logger);
    expect(out.substring(0, 23)).toEqual(
      `npm <command>

Usage:

`
    );
  });

  it("handle single command", function* () {
    const { out } = yield* sh("echo 'this thing'", {}, false, logger);
    expect(out).toBe(
      process.platform !== "win32" ? "this thing" : `"this thing"`
    );
  });

  describe("shell defined", () => {
    it("shell opted in", function* () {
      const { out } = yield* sh(
        "echo this thing",
        { shell: true },
        false,
        logger
      );
      expect(out).toBe("this thing");
    });

    it("defines bash as shell", function* () {
      const { out } = yield* sh(
        "echo this thing",
        { shell: "bash" },
        false,
        logger
      );
      expect(out).toBe("this thing");
    });

    if (process.platform !== "win32") {
      it("defines sh as shell", function* () {
        const { out } = yield* sh(
          "echo this thing",
          { shell: "sh" },
          false,
          logger
        );
        expect(out).toBe("this thing");
      });
    }

    if (process.platform === "win32") {
      it("defines cmd as shell", function* () {
        const { out } = yield* sh(
          "echo this thing",
          { shell: "cmd" },
          false,
          logger
        );
        expect(out).toBe("this thing");
      });

      it("defines pwsh as shell", function* () {
        const { out } = yield* sh(
          "echo this thing",
          { shell: "pwsh" },
          false,
          logger
        );
        expect(out).toBe("this\r\nthing");
      });
    }
  });

  describe.runIf(process.platform !== "win32")(
    "pipe commands when !win32",
    () => {
      it("considers piped commands, opted in", function* () {
        const { out } = yield* sh(
          "echo this thing | echo but actually this",
          { shell: true },
          false,
          logger
        );
        expect(out).toBe("but actually this");
      });

      it("considers piped commands, uses fallback to shell", function* () {
        const { out } = yield* sh(
          "echo this thing | echo but actually this",
          {},
          false,
          logger
        );
        expect(out).toBe("but actually this");
      });

      it("handle curl piped", function* () {
        const { out } = yield* sh(
          "curl -sf https://crates.io/api/v1/crates/tauri/0.11.0 | grep -o 0.11.0 | sort -u",
          { shell: true },
          false,
          logger
        );
        expect(out).toBe("0.11.0");
      });
    }
  );

  describe.runIf(process.platform === "win32")(
    "pipe commands when win32",
    () => {
      // will use whatever shell at process.env.shell
      it("considers piped commands, opted in", function* () {
        const { out } = yield* sh(
          "echo this thing | echo but actually this",
          { shell: true },
          false,
          logger
        );

        // this should always use git bash, same as defining it
        expect(out).toBe("but actually this");
      });

      it("considers piped commands, uses fallback to shell", function* () {
        const { out } = yield* sh(
          "echo this thing | echo but actually this",
          {},
          false,
          logger
        );

        // fallback is whichever shell this is run from
        //  check if bash which can handle otherwise assume it can't
        if (process.env.shell && process.env.shell.includes("bash.exe")) {
          expect(process.env.shell).toBe("bash.exe");
          expect(out).toBe("but actually this");
        } else if (
          process.env.shell &&
          process.env.shell.includes("pwsh.exe")
        ) {
          expect(process.env.shell).toBe("bash.exe");
          expect(out).toBe("but actually this");
        }
        {
          expect(out).toBe("this thing | echo but actually this");
        }
      });

      it("considers piped commands, defines cmd as shell", function* () {
        const { out } = yield* sh(
          "echo this thing | echo but actually this",
          { shell: "cmd" },
          false,
          logger
        );
        // should act like the fallback
        expect(out).toBe("but actually this");
      });

      it("considers piped commands, defines bash as shell", function* () {
        const { out } = yield* sh(
          "echo this thing | echo but actually this",
          { shell: "bash" },
          false,
          logger
        );
        // can handle pipes just fine, works like other OS
        expect(out).toBe("but actually this");
      });

      it("considers piped commands, defines pwsh as shell", function* () {
        const result = yield* captureError(
          sh(
            "echo this thing | echo but actually this",
            { shell: "pwsh" },
            false,
            logger
          )
        );
        // pwsh doesn't handle pipes with echo
        expect(result.message).toBe(
          "spawn echo this thing | echo but actually this ENOENT"
        );
      }); // TODO increase timeout to 60s, windows seems to take forever
    }
  );
});
