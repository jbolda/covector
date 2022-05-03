import { it, captureError } from "@effection/jest";
import { runCommand } from "./helpers";
import fixtures from "fixturez";
const f = fixtures(__dirname);

describe("integration test for init command", () => {
  it("runs version for prod", function* () {
    const fullIntegration = f.copy("integration.js-with-complex-commands");
    const command = `node ${__dirname}/../bin/covector.js status`;
    const { stdout, stderr, status } = yield runCommand(
      command,
      fullIntegration
    );

    expect(stderr).toBe("");
    expect(stdout).toBe(
      "There are no changes.\n" +
        "There is 2 packages ready to publish which includes package-one@2.3.1, package-two@1.9.0\n"
    );
    expect(status.code).toBe(0);
  }, 10000);
});
