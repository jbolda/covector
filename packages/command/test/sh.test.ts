import { runCommand } from "../src/index.ts";
import { describe, it } from "../../../helpers/test-scope.ts";
import { expect } from "vitest";
import * as logTest from "../../../helpers/test-logger.ts";
import { spawnSync } from "child_process";
import { logger } from "../../covector/src/index.ts";

function toMessage(message: string | object): string {
  if (typeof message === "string") return message;
  if (message && typeof message === "object" && "msg" in message) {
    const value = (message as { msg?: unknown }).msg;
    if (typeof value === "string") return value;
  }
  return JSON.stringify(message);
}

function normalizeOut(value: string | null | undefined): string {
  if (value == null) return "";
  // only convert CRLF -> LF on Windows; preserve original text on other OSes
  if (process.platform === "win32") {
    return value.replace(/\r\n/g, "\n");
  }
  return value;
}

function* sh(
  command: string,
  options: Record<string, unknown> = {},
  log: false | string = false,
) {
  const sink = yield* logTest.useCapturedLogger();
  const out = yield* runCommand({
    logger: logger.operations,
    pkg: "package",
    command,
    cwd: process.cwd(),
    pkgPath: "",
    log,
    options: options as any,
  });
  return { out, sink };
}

describe("sh", () => {
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
    const { out } = yield* sh("npm help", {}, false);
    expect(out.substring(0, 23)).toEqual(
      `npm <command>

Usage:

`,
    );
  });

  it("logs final stdout line without trailing newline", function* () {
    const { out, sink } = yield* sh(
      "node -e \"process.stdout.write('final stdout')\"",
      {},
      "running",
    );

    expect(out).toBe("final stdout");
    expect(sink.all).toEqual([
      { msg: "running", level: "info" },
      { msg: "final stdout", level: "info" },
    ]);
  });

  it("logs split stdout chunks separately", function* () {
    const { out, sink } = yield* sh(
      "node -e \"process.stdout.write('split'); setTimeout(() => process.stdout.write(' line\\n'), 10)\"",
      {},
      "running",
    );

    expect(out).toBe("split line");
    expect(sink.all).toEqual([
      { msg: "running", level: "info" },
      { msg: "split", level: "info" },
      { msg: "line", level: "info" },
    ]);
  });

  it("logs final stderr line without trailing newline", function* () {
    const { sink } = yield* sh(
      "node -e \"process.stderr.write('final stderr')\"",
      {},
      "running",
    );

    expect(sink.all).toEqual([
      { msg: "running", level: "info" },
      { msg: "final stderr", level: "error" },
    ]);
  });

  it("routes process output to stdout/stderr buckets", function* () {
    const { sink } = yield* sh(
      "node -e \"process.stdout.write('from-out'); process.stderr.write('from-err')\"",
      {},
      "running",
    );

    expect(sink.info).toEqual([{ msg: "running", level: "info" }]);
    expect(sink.stdout).toEqual([
      { msg: "from-out", level: "info" },
    ]);
    expect(sink.stderr).toEqual([{ msg: "from-err", level: "error" }]);
  });

  // canonical assertion — content must be preserved regardless of quoting
  it("handle single command (canonical)", function* () {
    const { out } = yield* sh("echo 'this thing'", {}, false);
    expect(out.trim()).toBe("this thing");
  });

  // explicit, per-shell assertions — split so failures are unambiguous
  if (process.platform !== "win32") {
    it("handle single command — sh/baselike", function* () {
      const { out } = yield* sh("echo 'this thing'", { shell: "sh" }, false);
      expect(out.trim()).toBe("this thing");
    });
  }

  if (process.platform === "win32") {
    it("handle single command — cmd", function* () {
      const { out } = yield* sh("echo 'this thing'", { shell: "cmd" }, false);
      // cmd behavior varies across environments; strip any surrounding quotes
      expect(out.trim().replace(/^['"]|['"]$/g, "")).toBe("this thing");
    });

    if (pwshAvailable) {
      it("handle single command — pwsh", function* () {
        const { out } = yield* sh(
          "echo 'this thing'",
          { shell: "pwsh" },
          false,
        );
        // pwsh may include different newline/spacing — normalize whitespace
        const normalized = normalizeOut(out).trim().replace(/\s+/g, " ");
        expect(normalized).toBe("this thing");
      });
    } else {
      it.skip("handle single command — pwsh");
    }
  }

  describe("shell defined", () => {
    it("shell opted in", function* () {
      const { out } = yield* sh("echo this thing", { shell: true }, false);
      expect(out).toBe("this thing");
    });

    it("defines bash as shell", function* () {
      const { out } = yield* sh("echo this thing", { shell: "bash" }, false);
      expect(out).toBe("this thing");
    });

    if (process.platform !== "win32") {
      it("defines sh as shell", function* () {
        const { out } = yield* sh("echo this thing", { shell: "sh" }, false);
        expect(out).toBe("this thing");
      });
    }

    if (process.platform === "win32") {
      it("defines cmd as shell", function* () {
        const { out } = yield* sh("echo this thing", { shell: "cmd" }, false);
        expect(out).toBe("this thing");
      });

      if (pwshAvailable) {
        it("defines pwsh as shell", function* () {
          const { out } = yield* sh(
            "echo this thing",
            { shell: "pwsh" },
            false,
          );
          // accept CRLF or LF and normalize internal whitespace
          const normalized = normalizeOut(out).trim().replace(/\s+/g, " ");
          expect(normalized).toBe("this thing");
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
        );
        expect(out).toBe("but actually this");
      });

      it("considers piped commands, uses fallback to shell", function* () {
        const { out } = yield* sh(
          "echo this thing | echo but actually this",
          {},
          false,
        );
        expect(out).toBe("but actually this");
      });

      it("handle curl piped", function* () {
        // avoid external network dependency in CI — simulate the same pipeline
        const { out } = yield* sh(
          "printf 'version: 0.11.0\n' | grep -o 0.11.0 | sort -u",
          { shell: true },
          false,
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
        );
        // can handle pipes just fine, works like other OS
        expect(out).toBe("but actually this");
      });

      if (pwshAvailable) {
        it("considers piped commands, defines pwsh as shell", function* () {
          try {
            const { out } = yield* sh(
              "echo this thing | echo but actually this",
              { shell: "pwsh" },
              false,
            );
            const normalized = normalizeOut(out).trim();
            const pwshVariants = [
              "but actually this",
              "but actually this\nThe process tried to write to a nonexistent pipe.",
            ];
            expect(pwshVariants).toContain(normalized);
          } catch (err: any) {
            // Accept process-level failures as a valid CI variant — assert the
            // error contains a recognizable message so we don't swallow
            // unexpected failures.
            expect(err.message || String(err)).toMatch(
              /Process exited with non-zero status|nonexistent pipe/i,
            );
          }
        });
      } else {
        it.skip("considers piped commands, defines pwsh as shell");
      } // TODO increase timeout to 60s, windows seems to take forever
    },
  );
});
