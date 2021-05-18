import * as core from "@actions/core";
import * as github from "@actions/github";
import { run as covector } from "./src";
import { run } from "effection";
import { packageListToArray } from "./src/utils";
import fixtures from "fixturez";
const f = fixtures(__dirname);

jest.mock("@actions/core");
jest.mock("@actions/github", () => ({
  getOctokit: jest.fn(),
  context: { repo: { owner: "genericOwner", repo: "genericRepo" } },
}));

let consoleMock = console as jest.Mocked<Console>;
const mockConsole = (toMock: string[]) => {
  const originalConsole = { ...console };
  debugger;
  toMock.forEach((mock) => {
    (console as any)[mock] = jest.fn();
  });
  consoleMock = console as jest.Mocked<Console>;
  return () => {
    global.console = originalConsole;
  };
};

describe("packageListToArray", () => {
  it("returns empty array on empty string", () => {
    const list = "";
    const pkgArray = packageListToArray(list);
    expect(pkgArray.length).toBe(0);
  });

  it("splits on comma", () => {
    const list = "package1,package2,package3";
    const pkgArray = packageListToArray(list);
    expect(pkgArray[0]).toBe("package1");
    expect(pkgArray[1]).toBe("package2");
    expect(pkgArray[2]).toBe("package3");
  });

  it("considers a single package", () => {
    const list = "package17";
    const pkgArray = packageListToArray(list);
    expect(pkgArray[0]).toBe("package17");
    expect(pkgArray[1]).toBe(undefined);
  });
});

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

describe("full e2e test", () => {
  let restoreConsole: Function;
  beforeEach(() => {
    restoreConsole = mockConsole(["log", "dir", "info", "error"]);
    jest.clearAllMocks();
  });
  afterEach(() => {
    restoreConsole();
  });

  const octokit = jest
    .spyOn(github, "getOctokit")
    //@ts-ignore
    .mockImplementation((arg) => ({
      repos: {
        //@ts-ignore
        createRelease: (obj) => ({ data: { ...obj, id: "boop" } }),
        //@ts-ignore
        uploadReleaseAsset: (obj) => obj,
      },
    }));

  it("tests publish input", async () => {
    const cwd: string = f.copy("integration.js-with-complex-commands");

    const input: { [k: string]: string } = {
      command: "publish",
      cwd: cwd,
      createRelease: "true",
      draftRelease: "false",
      token: "randomsequenceofcharactersforsecurity",
    };

    jest.spyOn(core, "getInput").mockImplementation((arg) => input[arg]);

    const covectoredAction = await run(covector());
    expect({
      consoleLog: consoleMock.log.mock.calls,
      consoleDir: consoleMock.dir.mock.calls,
    }).toMatchSnapshot();
    expect(core.setOutput).toMatchSnapshot();
  });

  it("tests status output", async () => {
    const cwd: string = f.copy("integration.js-with-complex-commands");

    const input: { [k: string]: string } = {
      command: "status",
      cwd: cwd,
      createRelease: "false",
      draftRelease: "false",
      token: "randomsequenceofcharactersforsecurity",
    };

    jest.spyOn(core, "getInput").mockImplementation((arg) => input[arg]);

    const covectoredAction = await run(covector());
    expect(core.setOutput).toHaveBeenCalledWith("commandRan", "status");
    expect(core.setOutput).toHaveBeenCalledWith("status", "No changes.");
  });

  it("tests version output", async () => {
    const cwd: string = f.copy("integration.js-with-complex-commands");

    const input: { [k: string]: string } = {
      command: "version",
      cwd: cwd,
      createRelease: "false",
      draftRelease: "false",
      token: "randomsequenceofcharactersforsecurity",
    };

    jest.spyOn(core, "getInput").mockImplementation((arg) => input[arg]);

    const covectoredAction = await run(covector());
    expect(core.setOutput).toHaveBeenCalledWith("status", "No changes.");
    expect(core.setOutput).toHaveBeenCalledWith("commandRan", "version");
    expect(core.setOutput).toHaveBeenCalledWith("successfulPublish", false);
    // to cover template pipe
    expect(core.setOutput).toMatchSnapshot();
  });

  it("tests publish output", async () => {
    const cwd: string = f.copy("integration.js-with-complex-commands");

    const input: { [k: string]: string } = {
      command: "publish",
      cwd: cwd,
      createRelease: "false",
      draftRelease: "false",
      token: "randomsequenceofcharactersforsecurity",
    };

    jest.spyOn(core, "getInput").mockImplementation((arg) => input[arg]);

    const covectoredAction = await run(covector());
    expect(core.setOutput).toHaveBeenCalledWith("status", "No changes.");
    expect(core.setOutput).toHaveBeenCalledWith("commandRan", "publish");
    expect(core.setOutput).toHaveBeenCalledWith("successfulPublish", true);
    expect(core.setOutput).toHaveBeenCalledWith(
      "packagesPublished",
      "package-one,package-two"
    );
    // to cover template pipe
    expect(core.setOutput).toMatchSnapshot();
  });
});
