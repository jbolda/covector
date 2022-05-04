import { it } from "@effection/jest";
import { runCommand } from "./helpers";
import { loadFile } from "@covector/files";
import fixtures from "fixturez";
const f = fixtures(__dirname);

describe("integration test for init command", () => {
  const command = `node "${__dirname}/../bin/covector.js init"`;

  it("runs on a workspace", function* () {
    const fullIntegration = f.copy("pkg.js-yarn-workspace");
    const { stdout, stderr, status } = yield runCommand(
      command,
      fullIntegration,
      "just press enter for everything right now"
      // [
      //   ["What is the url to your github repo?", "https://www.jacobbolda.com"],
      //   ["should we include github action workflows?", "Y"],
      //   ["What is the name of your default branch?", "pressEnter"],
      // ]
    );

    expect(stderr).toBe("");
    expect(stdout).toMatchSnapshot();
    expect(status.code).toBe(0);

    // let's do a check to confirm it sets the config file correctly
    const config = yield loadFile("./.changes/config.json", fullIntegration);
    expect(config.path).toEqual(".changes/config.json");
    expect(JSON.parse(config.content).gitSiteUrl).toBe(undefined);
  }, 20000);

  it("sets gitSiteUrl default to repo url", function* () {
    const fullIntegration = f.copy("pkg.js-single-json");
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
    const config = yield loadFile("./.changes/config.json", fullIntegration);
    expect(config.path).toEqual(".changes/config.json");
    expect(JSON.parse(config.content).gitSiteUrl).toBe(
      "https://www.github.com/jbolda/covector/"
    );
  }, 10000);
});
