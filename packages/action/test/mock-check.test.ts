import * as core from "@actions/core";
import * as github from "@actions/github";
import { captureError, describe, it } from "../../../helpers/test-scope.ts";
import { expect, vi } from "vitest";

vi.mock("@actions/core");
vi.mock("@actions/github", () => ({
  getOctokit: vi.fn(),
  context: { repo: { owner: "genericOwner", repo: "genericRepo" } },
}));

// doing this is an example showing how we can mock the github side effects
describe("test mocks", () => {
  it("mocks core getInput", function* () {
    vi.spyOn(core, "getInput").mockImplementationOnce(
      (arg) => `This returns ${arg}`
    );
    const test = core.getInput("test");
    expect(test).toBe("This returns test");
  });

  it("mocks github context", function* () {
    vi.spyOn(github, "getOctokit")
      //@ts-expect-error
      .mockImplementationOnce((arg) => ({
        context: { repo: { owner: "genericOwner", repo: "genericRepo" } },
      }));
    const octokit = github.getOctokit("token");
    expect(octokit).toEqual({
      context: { repo: { owner: "genericOwner", repo: "genericRepo" } },
    });
  });

  it("mocks octokit createRelease", function* () {
    //@ts-expect-error not all things are mocked despite TS expecting to be
    vi.spyOn(github, "getOctokit").mockImplementationOnce((arg) => ({
      repos: { createRelease: (obj: any) => obj },
    }));
    const octokit = github.getOctokit("token");
    //@ts-expect-error
    const releaseResponse = octokit.repos.createRelease({ body: "text" });
    expect(releaseResponse).toEqual({ body: "text" });
  });
});
