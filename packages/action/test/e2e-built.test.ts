import { beforeEach, describe, it } from "../../../helpers/test-scope.ts";
import { expect, vi } from "vitest";
import path from "node:path";
import { exec } from "@effectionx/process";
// @ts-expect-error has no types
import fixtures from "fixturez";
const f = fixtures(__dirname);

// some fanciness to get the path resolved for Windows
// without going through the absolute dir which causes issues
// with command line compat and complicates things further
export const command = (cwd: string) =>
  `node "${path
    .relative(cwd, path.join(__dirname, "./../dist/index.mjs"))
    .split(path.sep)
    .join("/")}"`;

describe("e2e test with built action", () => {
  describe("of status", () => {
    const testEnvVars = {
      INPUT_COMMAND: "status",
    };

    beforeEach(function* () {
      for (const key in testEnvVars) {
        process.env[key] = testEnvVars[key as keyof typeof testEnvVars];
      }
      process.stdout.write = vi.fn();
    });

    it("output", function* () {
      const cwd: string = f.copy("integration.js-and-rust-with-changes");
      const result = yield* exec(command(cwd), { cwd, shell: true }).join();
      const out = `${result.stdout}${result.stderr}`;

      // note we cant check the output of the command
      // as it gets ripped out in CI by GitHub
      expect(out).toContain(" bumping tauri with minor");
      expect(out).toContain(" bumping tauri-updater with patch");
      expect(out).toContain(" bumping tauri.js with patch");
    });
  });
});
