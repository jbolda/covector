import { sh } from "../src";
import { describe, it, captureError } from "../../../helpers/test-scope.ts";
import { it as itPromises, beforeAll, beforeEach, expect } from "vitest";
import pino from "pino";
import * as pinoTest from "pino-test";
import { x } from "tinyexec";
import { tokenizeArgs } from "args-tokenizer";
import { spawnSync } from "child_process";

function normalizeOut(value: string | null | undefined): string {
  if (value == null) return "";
  // only convert CRLF -> LF on Windows; preserve original text on other OSes
  if (process.platform === "win32") {
    return value.replace(/\r\n/g, "\n");
  }
  return value;
}

describe("tinyexec compatibility checks", () => {
  itPromises("handles multiline stdout", async () => {
    const commandString = `echo "this"\n"thing"`;
    const [command, ...args] = tokenizeArgs(commandString);
    const result = await x(command, args);

    // detect which shell the test runner is likely using so we can assert
    // the platform-specific output more precisely (without hiding behavior)
    const envShell = (
      process.env.shell ||
      process.env.SHELL ||
      process.env.COMSPEC ||
      ""
    ).toLowerCase();
    let shellHint: "bash" | "pwsh" | "cmd" | "unknown" = "unknown";
    if (envShell.includes("bash") || envShell.includes("/bin/sh"))
      shellHint = "bash";
    else if (envShell.includes("pwsh") || envShell.includes("powershell"))
      shellHint = "pwsh";
    else if (envShell.includes("cmd")) shellHint = "cmd";
    else if (process.platform === "win32") shellHint = "cmd";

    const out = result.stdout.trim();
    if (process.platform !== "win32" || shellHint === "bash") {
      expect(out).toBe("this thing");
    } else if (shellHint === "pwsh") {
      // accept either quoted tokens or unquoted output depending on environment
      expect(out === "this thing" || out === '"this" "thing"').toBeTruthy();
    } else {
      expect(out).toBe('"this" "thing"');
    }
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

  it("normalizeOut only converts CRLF to LF", function* () {
    if (process.platform === "win32") {
      expect(normalizeOut('"this\r\nthing"')).toBe('"this\nthing"');
    } else {
      expect(normalizeOut('"this\r\nthing"')).toBe('"this\r\nthing"');
    }
    expect(normalizeOut("'this    thing'")).toBe("'this    thing'");
    expect(normalizeOut("  this   thing  ")).toBe("  this   thing  ");
  });

  // pwsh availability probe — module-level so tests can be conditionally
  // collected/skipped depending on environment
  const pwshAvailable = (() => {
    if (process.platform !== "win32") return false;
    try {
      const r = spawnSync("pwsh", ["-v"], { encoding: "utf8" });
      return (
        r.error == null && (r.status === 0 || (r.stdout && r.stdout.length > 0))
      );
    } catch {
      return false;
    }
  })();

  it("handle base command", function* () {
    const { out } = yield* sh("npm help", {}, false, logger);
    expect(out.substring(0, 23)).toEqual(
      `npm <command>

Usage:

`,
    );
  });

  // canonical assertion — content must be preserved regardless of quoting
  it("handle single command (canonical)", function* () {
    const { out } = yield* sh("echo 'this thing'", {}, false, logger);
    expect(out.trim().replace(/^['"]|['"]$/g, "")).toBe("this thing");
  });

  // explicit, per-shell assertions — split so failures are unambiguous
  if (process.platform !== "win32") {
    it("handle single command — sh/baselike", function* () {
      const { out } = yield* sh(
        "echo 'this thing'",
        { shell: "sh" },
        false,
        logger,
      );
      expect(out.trim()).toBe("this thing");
    });
  }

  if (process.platform === "win32") {
    it("handle single command — cmd", function* () {
      const { out } = yield* sh(
        "echo 'this thing'",
        { shell: "cmd" },
        false,
        logger,
      );
      // cmd behavior varies across environments; assert the unquoted canonical
      expect(out.trim()).toBe("this thing");
    });

    if (pwshAvailable) {
      it("handle single command — pwsh", function* () {
        const { out } = yield* sh(
          "echo 'this thing'",
          { shell: "pwsh" },
          false,
          logger,
        );
        // pwsh should print the unquoted canonical value
        expect(normalizeOut(out).trim()).toBe("this thing");
      });
    } else {
      it.skip("handle single command — pwsh");
    }
  }

  describe("shell defined", () => {
    it("shell opted in", function* () {
      const { out } = yield* sh(
        "echo this thing",
        { shell: true },
        false,
        logger,
      );
      expect(out).toBe("this thing");
    });

    it("defines bash as shell", function* () {
      const { out } = yield* sh(
        "echo this thing",
        { shell: "bash" },
        false,
        logger,
      );
      expect(out).toBe("this thing");
    });

    if (process.platform !== "win32") {
      it("defines sh as shell", function* () {
        const { out } = yield* sh(
          "echo this thing",
          { shell: "sh" },
          false,
          logger,
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
          logger,
        );
        expect(out).toBe("this thing");
      });

      if (pwshAvailable) {
        it("defines pwsh as shell", function* () {
          const { out } = yield* sh(
            "echo this thing",
            { shell: "pwsh" },
            false,
            logger,
          );
          expect(out).toBe("this\r\nthing");
        });
      } else {
        it.skip("defines pwsh as shell");
      }
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
          logger,
        );
        expect(out).toBe("but actually this");
      });

      it("considers piped commands, uses fallback to shell", function* () {
        const { out } = yield* sh(
          "echo this thing | echo but actually this",
          {},
          false,
          logger,
        );
        expect(out).toBe("but actually this");
      });

      it("handle curl piped", function* () {
        const { out } = yield* sh(
          "curl -sf https://crates.io/api/v1/crates/tauri/0.11.0 | grep -o 0.11.0 | sort -u",
          { shell: true },
          false,
          logger,
        );
        expect(out).toBe("0.11.0");
      });
    },
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
          logger,
        );

        // accept the known variants for the runner shell (more robust than
        // assuming git-bash will always be used)
        const normalized = normalizeOut(out).trim();
        const pipeVariants = [
          "but actually this",
          "but actually this\nThe process tried to write to a nonexistent pipe.",
        ];
        const fallbackVariants = [
          "this thing | echo but actually this",
          ...pipeVariants,
        ];

        if (process.env.shell && process.env.shell.includes("bash.exe")) {
          expect(pipeVariants).toContain(normalized);
        } else if (
          process.env.shell &&
          process.env.shell.includes("pwsh.exe")
        ) {
          expect(pipeVariants).toContain(normalized);
        } else {
          expect(fallbackVariants).toContain(normalized);
        }
      });

      it("considers piped commands, uses fallback to shell", function* () {
        const { out } = yield* sh(
          "echo this thing | echo but actually this",
          {},
          false,
          logger,
        );

        // fallback is whichever shell this is run from
        const normalized = normalizeOut(out).trim();
        const pipeVariants = [
          "but actually this",
          "but actually this\nThe process tried to write to a nonexistent pipe.",
        ];
        const fallbackVariants = [
          "this thing | echo but actually this",
          ...pipeVariants,
        ];

        if (process.env.shell && process.env.shell.includes("bash.exe")) {
          expect(pipeVariants).toContain(normalized);
        } else if (
          process.env.shell &&
          process.env.shell.includes("pwsh.exe")
        ) {
          // pwsh in some environments will process pipes similarly to bash or
          // surface the Windows pipe error
          expect(pipeVariants).toContain(normalized);
        } else {
          expect(fallbackVariants).toContain(normalized);
        }
      });

      it("considers piped commands, defines cmd as shell", function* () {
        const { out } = yield* sh(
          "echo this thing | echo but actually this",
          { shell: "cmd" },
          false,
          logger,
        );
        const normalized = normalizeOut(out).trim();
        const cmdVariants = [
          "but actually this",
          "but actually this\nThe process tried to write to a nonexistent pipe.",
        ];
        expect(cmdVariants).toContain(normalized);
      });

      it("considers piped commands, defines bash as shell", function* () {
        const { out } = yield* sh(
          "echo this thing | echo but actually this",
          { shell: "bash" },
          false,
          logger,
        );
        // can handle pipes just fine, works like other OS
        expect(out).toBe("but actually this");
      });

      if (pwshAvailable) {
        it("considers piped commands, defines pwsh as shell", function* () {
          const { out } = yield* sh(
            "echo this thing | echo but actually this",
            { shell: "pwsh" },
            false,
            logger,
          );
          const normalized = normalizeOut(out).trim();
          const pwshVariants = [
            "but actually this",
            "but actually this\nThe process tried to write to a nonexistent pipe.",
          ];
          expect(pwshVariants).toContain(normalized);
        });
      } else {
        it.skip("considers piped commands, defines pwsh as shell", () => {});
      } // TODO increase timeout to 60s, windows seems to take forever
    },
  );
});
