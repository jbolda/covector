import * as core from "@actions/core";
import * as github from "@actions/github";

jest.mock("@actions/core");
jest.mock("@actions/github", () => ({
  getOctokit: jest.fn(),
  context: { repo: { owner: "genericOwner", repo: "genericRepo" } },
}));

// doing this is an example showing how we can mock the github side effects
describe("test mocks", () => {
  it("mocks core getInput", () => {
    jest
      .spyOn(core, "getInput")
      .mockImplementationOnce((arg) => `This returns ${arg}`);
    const test = core.getInput("test");
    expect(test).toBe("This returns test");
  });

  it("mocks github context", () => {
    jest
      .spyOn(github, "getOctokit")
      //@ts-ignore
      .mockImplementationOnce((arg) => ({
        context: { repo: { owner: "genericOwner", repo: "genericRepo" } },
      }));
    const octokit = github.getOctokit("token");
    expect(octokit).toEqual({
      context: { repo: { owner: "genericOwner", repo: "genericRepo" } },
    });
  });

  it("mocks octokit createRelease", () => {
    jest.spyOn(github, "getOctokit").mockImplementationOnce((arg) => ({
      //@ts-ignore
      repos: { createRelease: (obj) => obj },
    }));
    const octokit = github.getOctokit("token");
    //@ts-ignore
    const releaseResponse = octokit.repos.createRelease({ body: "text" });
    expect(releaseResponse).toEqual({ body: "text" });
  });
});
