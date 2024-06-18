import { describe, it } from "../../../../helpers/test-scope.ts";
import { expect } from "vitest";
import { command, runCommand } from "../helpers";
import fixtures from "fixturez";
const f = fixtures(__dirname);

describe("integration test for init command", () => {
  it("runs version for prod", function* () {
    const fullIntegration = f.copy("integration.js-with-complex-commands");
    const { stdout, stderr, status } = yield runCommand(
      command("status", fullIntegration),
      fullIntegration
    );

    expect(stderr).toBe("");
    expect(stdout).toBe(
      "[info] There are no changes.\n" +
        "[info] There is 2 packages ready to publish which includes package-one@2.3.1, package-two@1.9.0"
    );
    expect(status.code).toBe(0);
  });
});
