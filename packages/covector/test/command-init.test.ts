import { it } from "@effection/jest";
import { runCommand } from "./helpers";
import fixtures from "fixturez";
const f = fixtures(__dirname);

describe("integration test for init command", () => {
  it("runs", function* () {
    const fullIntegration = f.copy("pkg.js-single-json");
    const command = `node ${__dirname}/../bin/covector.js init`;
    const { stdout, stderr, status } = yield runCommand(
      command,
      fullIntegration,
      [
        ["What is the url to your github repo?", "pressEnter"],
        ["should we include github action workflows?", "Y"],
        ["What is the name of your default branch?", "pressEnter"],
      ]
    );

    expect(stderr).toBe("");
    expect(stdout).toMatchSnapshot();
    expect(status.code).toBe(0);
    // let's do a check to confirm it sets the config file correctly
  }, 10000);
});
