import { loadFile } from "@covector/files";
import { describe, it } from "../../../../helpers/test-scope.ts";
import { expect } from "vitest";
import { command, runCommand } from "../helpers";
import fixtures from "fixturez";
const f = fixtures(__dirname);

describe("integration test for init command", () => {
  it("runs on a workspace", function* () {
    const fullIntegration = f.copy("pkg.js-yarn-workspace");
    const gitSiteUrl = "https://example.com";
    const { stderr, status, responded } = yield runCommand(
      command("init", fullIntegration),
      fullIntegration,
      [
        [/What is the url to your GitHub repo/, gitSiteUrl],
        [/should we include GitHub Action workflows/, "pressEnter"],
        [/What is the name of your default branch/, "pressEnter"],
      ],
      14900
    );

    expect(stderr).toBe("");
    expect(responded).toMatchSnapshot();
    expect(status.code).toBe(0);

    // let's do a check to confirm it sets the config file correctly
    const config = yield loadFile("./.changes/config.json", fullIntegration);
    expect(config.path).toEqual(".changes/config.json");
    expect(JSON.parse(config.content).gitSiteUrl).toBe(`${gitSiteUrl}/`);
  }, 15000);

  it("sets gitSiteUrl default to repo url", function* () {
    const fullIntegration = f.copy("pkg.js-single-json");
    const { responded, stderr, status } = yield runCommand(
      command("init", fullIntegration),
      fullIntegration,
      [
        [/What is the url to your GitHub repo/, "pressEnter"],
        [/should we include GitHub Action workflows/, "pressEnter"],
        [/What is the name of your default branch/, "pressEnter"],
      ]
    );

    expect(stderr).toBe("");
    expect(responded).toMatchSnapshot();
    expect(status.code).toBe(0);

    // let's do a check to confirm it sets the config file correctly
    const config = yield loadFile("./.changes/config.json", fullIntegration);
    expect(config.path).toEqual(".changes/config.json");
    expect(JSON.parse(config.content).gitSiteUrl).toBe(
      "https://www.github.com/jbolda/covector/"
    );
  });
});
