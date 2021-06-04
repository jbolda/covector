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

  jest
    .spyOn(github, "getOctokit")
    // @ts-ignore
    .mockImplementation((token: string) => ({
      context: { repo: { owner: "genericOwner", repo: "genericRepo" } },
      repos: {
        getReleaseByTag: jest.fn((input) => ({ data: input })),
        updateRelease: jest.fn((input) => ({ data: input })),
        createRelease: jest.fn((input) => ({ data: input })),
        uploadReleaseAsset: jest.fn((input) => ({ data: input })),
      },
    }));

  describe("of status", () => {
    it("output", async () => {
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
  });

  describe("of version", () => {
    it("output", async () => {
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
  });

  describe("of publish", () => {
    it("input", async () => {
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

    it("output", async () => {
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

    it("github release update", async () => {
      const cwd: string = f.copy("integration.js-with-complex-commands");

      const input: { [k: string]: string } = {
        command: "publish",
        cwd: cwd,
        createRelease: "true",
        draftRelease: "false",
        token: "randomsequenceofcharactersforsecurity",
      };

      jest.spyOn(core, "getInput").mockImplementation((arg) => input[arg]);
      const octokit = jest
        .spyOn(github, "getOctokit")
        // @ts-ignore
        .mockImplementation((token: string) => ({
          context: { repo: { owner: "genericOwner", repo: "genericRepo" } },
          repos: {
            getReleaseByTag: jest
              .fn()
              .mockResolvedValueOnce({
                draft: true,
                id: 15,
              })
              .mockResolvedValueOnce({
                draft: true,
                id: 22,
              }) as jest.MockedFunction<any>,
            updateRelease: jest.fn((input) => ({ data: input })),
            createRelease: jest.fn((input) => ({ data: input })),
            uploadReleaseAsset: jest.fn((input) => ({ data: input })),
          },
        }));

      const covectoredAction = await run(covector());
      expect(octokit).toHaveBeenCalledWith(input.token);
      const {
        getReleaseByTag,
        createRelease,
        updateRelease,
        // @ts-ignore
      } = github.getOctokit.mock.results[0].value.repos;
      expect(getReleaseByTag).toHaveBeenCalledWith({
        owner: "genericOwner",
        repo: "genericRepo",
        tag: "package-one-v2.3.1",
      });
      expect(getReleaseByTag).toHaveBeenCalledWith({
        owner: "genericOwner",
        repo: "genericRepo",
        tag: "package-two-v1.9.0",
      });

      expect(updateRelease).toHaveBeenCalledWith({
        owner: "genericOwner",
        repo: "genericRepo",
        release_id: 15,
        draft: false,
        body: "## \\[2.3.1]\n\n- Added some cool things.\n\npublish\n\n",
      });
      expect(updateRelease).toHaveBeenCalledWith({
        owner: "genericOwner",
        repo: "genericRepo",
        release_id: 22,
        draft: false,
        body: "## \\[1.9.0]\n\n- Added some even cooler things.\n\npublish\n\n",
      });

      expect(createRelease).toHaveBeenCalledTimes(0);
    });

    it("github release creation", async () => {
      const cwd: string = f.copy("integration.js-with-complex-commands");

      const input: { [k: string]: string } = {
        command: "publish",
        cwd: cwd,
        createRelease: "true",
        draftRelease: "false",
        token: "randomsequenceofcharactersforsecurity",
      };

      jest.spyOn(core, "getInput").mockImplementation((arg) => input[arg]);
      const octokit = jest
        .spyOn(github, "getOctokit")
        // @ts-ignore
        .mockImplementation((token: string) => ({
          context: { repo: { owner: "genericOwner", repo: "genericRepo" } },
          repos: {
            getReleaseByTag: jest.fn(() => false) as jest.MockedFunction<any>,
            updateRelease: jest.fn((input) => ({ data: input })),
            createRelease: jest.fn((input) => ({ data: input })),
            uploadReleaseAsset: jest.fn((input) => ({ data: input })),
          },
        }));

      const covectoredAction = await run(covector());
      expect(octokit).toHaveBeenCalledWith(input.token);
      const {
        getReleaseByTag,
        createRelease,
        updateRelease,
        // @ts-ignore
      } = github.getOctokit.mock.results[0].value.repos;

      expect(getReleaseByTag).toHaveBeenCalledWith({
        owner: "genericOwner",
        repo: "genericRepo",
        tag: "package-one-v2.3.1",
      });
      expect(getReleaseByTag).toHaveBeenCalledWith({
        owner: "genericOwner",
        repo: "genericRepo",
        tag: "package-two-v1.9.0",
      });

      expect(createRelease).toHaveBeenCalledWith({
        owner: "genericOwner",
        repo: "genericRepo",
        name: "package-one v2.3.1",
        tag_name: "package-one-v2.3.1",
        draft: false,
        body: "## \\[2.3.1]\n\n- Added some cool things.\n\npublish\n\n",
      });
      expect(createRelease).toHaveBeenCalledWith({
        owner: "genericOwner",
        repo: "genericRepo",
        name: "package-two v1.9.0",
        tag_name: "package-two-v1.9.0",
        draft: false,
        body: "## \\[1.9.0]\n\n- Added some even cooler things.\n\npublish\n\n",
      });

      expect(updateRelease).toHaveBeenCalledTimes(0);
    });
  });
});
