import * as core from "@actions/core";
import * as github from "@actions/github";
import { run as covector } from "../src";
import { run } from "effection";
import mockConsole from "jest-mock-console";
import fixtures from "fixturez";
const f = fixtures(__dirname);

jest.mock("@actions/core");
jest.mock("@actions/github", () => ({
  getOctokit: jest.fn(),
  context: { repo: { owner: "genericOwner", repo: "genericRepo" } },
}));

describe("full e2e test", () => {
  let restoreConsole: Function;
  beforeEach(() => {
    restoreConsole = mockConsole(["log", "info", "error"]);
    jest.clearAllMocks();
  });
  afterEach(() => {
    restoreConsole();
  });

  describe("of status", () => {
    it("output", async () => {
      const cwd: string = f.copy("integration.js-with-complex-commands");

      const input: { [k: string]: string } = {
        command: "status",
        cwd,
        createRelease: "false",
        draftRelease: "false",
        token: "randomsequenceofcharactersforsecurity",
      };

      jest.spyOn(core, "getInput").mockImplementation((arg) => input[arg]);

      const covectoredAction = await run(covector());
      expect({ covectoredAction }).toMatchSnapshot();
      expect(core.setOutput).toHaveBeenCalledWith("commandRan", "status");
      expect(core.setOutput).toHaveBeenCalledWith("status", "No changes.");
    });
  });

  describe("of version", () => {
    it("output", async () => {
      const cwd: string = f.copy("integration.js-with-complex-commands");

      const input: { [k: string]: string } = {
        command: "version",
        cwd,
        createRelease: "false",
        draftRelease: "false",
        token: "randomsequenceofcharactersforsecurity",
      };

      jest.spyOn(core, "getInput").mockImplementation((arg) => input[arg]);

      const covectoredAction = await run(covector());
      expect({ covectoredAction }).toMatchSnapshot();
      expect(core.setOutput).toHaveBeenCalledWith("status", "No changes.");
      expect(core.setOutput).toHaveBeenCalledWith("commandRan", "version");
      // to cover template pipe
      expect(core.setOutput).toMatchSnapshot();
    });
  });

  describe("of publish", () => {
    jest
      .spyOn(github, "getOctokit")
      // @ts-ignore
      .mockImplementation((token: string) => ({
        context: { repo: { owner: "genericOwner", repo: "genericRepo" } },
        rest: {
          repos: {
            listReleases: jest.fn().mockResolvedValue({
              data: [],
            }),
            updateRelease: jest
              .fn()
              .mockImplementation((input) => Promise.resolve({ data: input })),
            createRelease: jest
              .fn()
              .mockImplementation((input) => Promise.resolve({ data: input })),
            uploadReleaseAsset: jest
              .fn()
              .mockImplementation((input) => Promise.resolve({ data: input })),
          },
        },
      }));

    it("input", async () => {
      const cwd: string = f.copy("integration.js-with-complex-commands");

      const input: { [k: string]: string } = {
        command: "publish",
        cwd,
        createRelease: "true",
        draftRelease: "false",
        token: "randomsequenceofcharactersforsecurity",
      };

      jest.spyOn(core, "getInput").mockImplementation((arg) => input[arg]);

      const covectoredAction = await run(covector());
      expect(
        // the log gets random /r on windows in CI
        (console.log as any).mock.calls.map((logArray: any) =>
          logArray.map((log: any) =>
            typeof log === "string" ? log.replace(/\\r/g, "") : log
          )
        )
      ).toMatchSnapshot();
      expect({ covectoredAction }).toMatchSnapshot();
      expect(core.setOutput).toHaveBeenCalledWith(
        "templatePipe",
        expect.stringContaining("2.3.1")
      );
      expect(core.setOutput).toHaveBeenCalledWith(
        "templatePipe",
        expect.stringContaining("1.9.0")
      );
    });

    it("output", async () => {
      const cwd: string = f.copy("integration.js-with-complex-commands");

      const input: { [k: string]: string } = {
        command: "publish",
        cwd,
        createRelease: "false",
        draftRelease: "false",
        token: "randomsequenceofcharactersforsecurity",
      };

      jest.spyOn(core, "getInput").mockImplementation((arg) => input[arg]);

      const covectoredAction = await run(covector());
      expect({ covectoredAction }).toMatchSnapshot();
      expect(core.setOutput).toHaveBeenCalledWith("status", "No changes.");
      expect(core.setOutput).toHaveBeenCalledWith("commandRan", "publish");
      expect(core.setOutput).toHaveBeenCalledWith("successfulPublish", true);
      expect(core.setOutput).toHaveBeenCalledWith(
        "packagesPublished",
        "package-one,package-two"
      );
      expect(core.setOutput).toHaveBeenCalledWith(
        "templatePipe",
        expect.stringContaining("2.3.1")
      );
      expect(core.setOutput).toHaveBeenCalledWith(
        "templatePipe",
        expect.stringContaining("1.9.0")
      );
    });

    it("github release update of all packages", async () => {
      const cwd: string = f.copy("integration.js-with-complex-commands");

      const input: { [k: string]: string } = {
        command: "publish",
        cwd,
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
          rest: {
            repos: {
              listReleases: jest.fn().mockResolvedValue({
                data: [
                  {
                    draft: true,
                    body: "some stuff",
                    id: 15,
                    tag_name: "package-one-v2.3.1",
                  },
                  {
                    draft: true,
                    body: "other stuff",
                    id: 22,
                    tag_name: "package-two-v1.9.0",
                  },
                ],
              }) as jest.MockedFunction<any>,
              updateRelease: jest
                .fn()
                .mockImplementation((input) =>
                  Promise.resolve({ data: input })
                ),
              createRelease: jest
                .fn()
                .mockImplementation((input) =>
                  Promise.resolve({ data: input })
                ),
              uploadReleaseAsset: jest
                .fn()
                .mockImplementation((input) =>
                  Promise.resolve({ data: input })
                ),
            },
          },
        }));

      const covectoredAction = await run(covector());
      expect({ covectoredAction }).toMatchSnapshot();
      expect(octokit).toHaveBeenCalledWith(input.token);
      const {
        listReleases,
        createRelease,
        updateRelease,
        // @ts-ignore
      } = github.getOctokit.mock.results[0].value.rest.repos;
      expect(listReleases).toHaveBeenCalledWith({
        owner: "genericOwner",
        repo: "genericRepo",
      });
      expect(listReleases).toHaveBeenCalledWith({
        owner: "genericOwner",
        repo: "genericRepo",
      });

      expect(updateRelease).toHaveBeenCalledWith({
        owner: "genericOwner",
        repo: "genericRepo",
        release_id: 15,
        draft: false,
        body: "some stuff\n## \\[2.3.1]\n\n- Added some cool things.\n\npublish\n\n",
      });
      expect(updateRelease).toHaveBeenCalledWith({
        owner: "genericOwner",
        repo: "genericRepo",
        release_id: 22,
        draft: false,
        body: "other stuff\n## \\[1.9.0]\n\n- Added some even cooler things.\n\npublish\n\n",
      });

      expect(createRelease).toHaveBeenCalledTimes(0);
    });

    it("github release creation of all packages", async () => {
      const cwd: string = f.copy("integration.js-with-complex-commands");

      const input: { [k: string]: string } = {
        command: "publish",
        cwd,
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
          rest: {
            repos: {
              listReleases: jest.fn().mockResolvedValue({
                data: [
                  {
                    draft: false,
                    body: "some stuff",
                    id: 15,
                    tag_name: "package-one-v2.3.0",
                  },
                  {
                    draft: false,
                    body: "other stuff",
                    id: 22,
                    tag_name: "package-two-v1.8.7",
                  },
                ],
              }) as jest.MockedFunction<any>,
              updateRelease: jest
                .fn()
                .mockImplementation((input) =>
                  Promise.resolve({ data: input })
                ),
              createRelease: jest
                .fn()
                .mockImplementation((input) =>
                  Promise.resolve({ data: input })
                ),
              uploadReleaseAsset: jest
                .fn()
                .mockImplementation((input) =>
                  Promise.resolve({ data: input })
                ),
            },
          },
        }));

      const covectoredAction = await run(covector());
      expect({ covectoredAction }).toMatchSnapshot();
      expect(octokit).toHaveBeenCalledWith(input.token);
      const {
        listReleases,
        createRelease,
        updateRelease,
        // @ts-ignore
      } = github.getOctokit.mock.results[0].value.rest.repos;

      expect(listReleases).toHaveBeenCalledWith({
        owner: "genericOwner",
        repo: "genericRepo",
      });
      expect(listReleases).toHaveBeenCalledWith({
        owner: "genericOwner",
        repo: "genericRepo",
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

    it("github release update of single package", async () => {
      const cwd: string = f.copy("integration.js-with-single-github-release");

      const input: { [k: string]: string } = {
        command: "publish",
        cwd,
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
          rest: {
            repos: {
              listReleases: jest.fn().mockResolvedValue({
                data: [
                  {
                    draft: true,
                    body: "some stuff",
                    id: 15,
                    tag_name: "v2.3.1",
                  },
                ],
              }) as jest.MockedFunction<any>,
              updateRelease: jest
                .fn()
                .mockImplementation((input) =>
                  Promise.resolve({ data: input })
                ),
              createRelease: jest
                .fn()
                .mockImplementation((input) =>
                  Promise.resolve({ data: input })
                ),
              uploadReleaseAsset: jest
                .fn()
                .mockImplementation((input) =>
                  Promise.resolve({ data: input })
                ),
            },
          },
        }));

      const covectoredAction = await run(covector());
      expect({ covectoredAction }).toMatchSnapshot();
      expect(octokit).toHaveBeenCalledWith(input.token);
      const {
        listReleases,
        createRelease,
        updateRelease,
        // @ts-ignore
      } = github.getOctokit.mock.results[0].value.rest.repos;
      expect(listReleases).toHaveBeenCalledWith({
        owner: "genericOwner",
        repo: "genericRepo",
      });
      expect(listReleases).toHaveBeenCalledWith({
        owner: "genericOwner",
        repo: "genericRepo",
      });

      expect(updateRelease).toHaveBeenCalledWith({
        owner: "genericOwner",
        repo: "genericRepo",
        release_id: 15,
        draft: false,
        body: "some stuff\n## \\[2.3.1]\n\n- Added some cool things.\n\npublish\n\n",
      });

      expect(updateRelease).toHaveBeenCalledTimes(1);
      expect(createRelease).toHaveBeenCalledTimes(0);
    });

    it("github release creation of single package", async () => {
      const cwd: string = f.copy("integration.js-with-single-github-release");

      const input: { [k: string]: string } = {
        command: "publish",
        cwd,
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
          rest: {
            repos: {
              listReleases: jest.fn().mockResolvedValue({
                data: [],
              }) as jest.MockedFunction<any>,
              updateRelease: jest
                .fn()
                .mockImplementation((input) =>
                  Promise.resolve({ data: input })
                ),
              createRelease: jest
                .fn()
                .mockImplementation((input) =>
                  Promise.resolve({ data: input })
                ),
              uploadReleaseAsset: jest
                .fn()
                .mockImplementation((input) =>
                  Promise.resolve({ data: input })
                ),
            },
          },
        }));

      const covectoredAction = await run(covector());
      expect({ covectoredAction }).toMatchSnapshot();
      expect(octokit).toHaveBeenCalledWith(input.token);
      const {
        listReleases,
        createRelease,
        updateRelease,
        // @ts-ignore
      } = github.getOctokit.mock.results[0].value.rest.repos;

      expect(listReleases).toHaveBeenCalledWith({
        owner: "genericOwner",
        repo: "genericRepo",
      });
      expect(listReleases).toHaveBeenCalledWith({
        owner: "genericOwner",
        repo: "genericRepo",
      });

      expect(createRelease).toHaveBeenCalledWith({
        owner: "genericOwner",
        repo: "genericRepo",
        name: "package-one v2.3.1",
        tag_name: "v2.3.1",
        draft: false,
        body: "## \\[2.3.1]\n\n- Added some cool things.\n\npublish\n\n",
      });

      expect(createRelease).toHaveBeenCalledTimes(1);
      expect(updateRelease).toHaveBeenCalledTimes(0);
    });
  });
});
