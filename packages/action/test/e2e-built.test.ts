import { beforeEach, describe, it } from "../../../helpers/test-scope.ts";
import { expect, vi } from "vitest";
import path from "node:path";
import fixtures from "fixturez";
import { x } from "@covector/command";
import { each } from "effection";
const f = fixtures(__dirname);

// some fanciness to get the path resolved for Windows
// without going through the absolute dir which causes issues
// with command line compat and complicates things further
export const command = (cwd: string) =>
  `node "${path
    .relative(cwd, path.join(__dirname, "./../dist/index.js"))
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

      const child = yield* x(command(cwd), { nodeOptions: { cwd } });

      let out = "";
      for (let line of yield* each(child.lines)) {
        out += line + "\n";
        yield* each.next();
      }

      // note we cant check the output of the command
      // as it gets ripped out in CI by GitHub
      expect(out).toContain(
        " bumping tauri with minor\n" +
          " bumping tauri-updater with patch\n" +
          " bumping tauri.js with patch"
      );
    });
  });
});
