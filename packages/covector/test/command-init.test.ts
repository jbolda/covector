import { it } from "@effection/jest";
import { command, runCommand } from "./helpers";
import { loadFile } from "@covector/files";
import fixtures from "fixturez";
const f = fixtures(__dirname);

describe("integration test for init command", () => {
  it("runs on a workspace", function* () {
    const fullIntegration = f.copy("pkg.js-yarn-workspace");
    const { stdout, stderr, status, responded } = yield runCommand(
      command("init", fullIntegration),
      fullIntegration,
      [
        [/\? What is the url to your github repo\?/, "pressEnter"],
        [/\? should we include github action workflows\? \(Y\/n\)/, "Y"],
        [/\? What is the name of your default branch\? \(main\)/, "pressEnter"],
      ]
    );

    expect(stderr).toBe("");
    expect(responded).toMatchSnapshot();
    expect(status.code).toBe(0);

    // let's do a check to confirm it sets the config file correctly
    const config = yield loadFile("./.changes/config.json", fullIntegration);
    expect(config.path).toEqual(".changes/config.json");
    expect(JSON.parse(config.content).gitSiteUrl).toBe(undefined);
  }, 25000); // windows takes some time

  it("sets gitSiteUrl default to repo url", function* () {
    const fullIntegration = f.copy("pkg.js-single-json");
    const { stdout, stderr, status } = yield runCommand(
      command("init", fullIntegration),
      fullIntegration,
      [
        [/\? What is the url to your github repo\? \(.+\)/, "pressEnter"],
        [/\? should we include github action workflows\? \(Y\/n\)/, "Y"],
        [/\? What is the name of your default branch\? \(main\)/, "pressEnter"],
      ]
    );

    expect(stderr).toBe("");
    expect(stdout.replaceAll("\n", "")).toMatchSnapshot();
    expect(status.code).toBe(0);

    // let's do a check to confirm it sets the config file correctly
    const config = yield loadFile("./.changes/config.json", fullIntegration);
    expect(config.path).toEqual(".changes/config.json");
    expect(JSON.parse(config.content).gitSiteUrl).toBe(
      "https://www.github.com/jbolda/covector/"
    );
  }, 25000); // windows takes some time
});
