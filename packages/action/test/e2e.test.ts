import * as core from "@actions/core";
import * as github from "@actions/github";
import { run as covector } from "../src";
import { captureError, describe, it } from "../../../helpers/test-scope.ts";
import { expect, vi } from "vitest";
import pino from "pino";
import * as pinoTest from "pino-test";
import fixtures from "fixturez";
import { checksWithObject } from "./helpers.ts";
const f = fixtures(__dirname);

vi.mock("@actions/core", () => ({
  setOutput: vi.fn(),
  getInput: vi.fn(),
  setFailed: (err) => {
    throw new Error(err);
  },
}));
vi.mock("@actions/github", () => ({
  getOctokit: vi.fn(),
  context: { repo: { owner: "genericOwner", repo: "genericRepo" } },
}));

describe("full e2e test", () => {
  describe("of status", () => {
    it("output", function* () {
      const stream = pinoTest.sink();
      const logger = pino(stream);
      const cwd: string = f.copy("integration.js-with-complex-commands");

      const input: { [k: string]: string } = {
        command: "status",
        cwd,
        createRelease: "false",
        draftRelease: "false",
        token: "randomsequenceofcharactersforsecurity",
      };

      vi.spyOn(core, "getInput").mockImplementation((arg) => input[arg]);

      yield covector(logger);

      // to confirm we have reached the end of the logs
      logger.info("completed");
      yield pinoTest.consecutive(
        stream,
        [
          {
            command: "status",
            msg: "There are no changes.",
            level: 30,
          },
          {
            command: "status",
            msg: "There is 2 packages ready to publish which includes package-one@2.3.1, package-two@1.9.0",
            level: 30,
          },
          {
            msg: "completed",
            level: 30,
          },
        ],
        checksWithObject()
      );
      expect(core.setOutput).toHaveBeenCalledWith("commandRan", "status");
      expect(core.setOutput).toHaveBeenCalledWith("status", "No changes.");
    });
  });

  describe("of version", () => {
    it("outputs for no change", function* () {
      const stream = pinoTest.sink();
      const logger = pino(stream);
      const cwd: string = f.copy("integration.js-with-complex-commands");

      const input: { [k: string]: string } = {
        command: "version",
        cwd,
        createRelease: "false",
        draftRelease: "false",
        token: "randomsequenceofcharactersforsecurity",
      };

      vi.spyOn(core, "getInput").mockImplementation((arg) => input[arg]);

      yield covector(logger);

      const changeOutput =
        "# Version Updates\n\n" +
        "Merging this PR will release new versions of the following packages based on your change files.\n\n";
      // to confirm we have reached the end of the logs
      logger.info("completed");
      yield pinoTest.consecutive(
        stream,
        [
          // status runs first to set some output
          {
            command: "status",
            msg: "There are no changes.",
            level: 30,
          },
          {
            command: "status",
            msg: "There is 2 packages ready to publish which includes package-one@2.3.1, package-two@1.9.0",
            level: 30,
          },
          // then the version command runs
          // TODO should there be more logs?
          // and finishes with the output
          {
            msg: "covector version output",
            renderAsYAML: changeOutput,
            level: 30,
          },
          {
            msg: "completed",
            level: 30,
          },
        ],
        checksWithObject()
      );
      expect(core.setOutput).toHaveBeenCalledWith("status", "No changes.");
      expect(core.setOutput).toHaveBeenCalledWith("commandRan", "version");
      expect(core.setOutput).toHaveBeenCalledWith("change", changeOutput);
      // @ts-expect-error
      expect(core.setOutput?.calls?.templatePipe).toBeUndefined();
    });

    it("outputs with changes", function* () {
      const stream = pinoTest.sink();
      const logger = pino(stream);
      const cwd: string = f.copy("integration.js-and-rust-with-changes");

      const input: { [k: string]: string } = {
        command: "version",
        cwd,
        createRelease: "false",
        draftRelease: "false",
        token: "randomsequenceofcharactersforsecurity",
      };

      vi.spyOn(core, "getInput").mockImplementation((arg) => input[arg]);

      yield covector(logger);

      // to confirm we have reached the end of the logs
      logger.info("completed");
      yield pinoTest.consecutive(
        stream,
        [
          // status runs first to set some output
          {
            command: "status",
            msg: "changes:",
            level: 30,
          },
          {
            command: "status",
            msg: "tauri => minor",
            level: 30,
          },
          {
            command: "status",
            msg: "tauri-updater => patch",
            level: 30,
          },
          {
            command: "status",
            msg: "bumping tauri with minor",
            level: 30,
          },
          {
            command: "status",
            msg: "bumping tauri-updater with patch",
            level: 30,
          },
          {
            command: "status",
            msg: "bumping tauri.js with patch",
            level: 30,
          },
          {
            command: "status",
            msg: "tauri.js planned to be bumped from 0.6.2 to 0.6.3",
            level: 30,
          },
          {
            command: "status",
            msg: "tauri planned to be bumped from 0.5.2 to 0.6.0",
            level: 30,
          },
          {
            command: "status",
            msg: "tauri-updater planned to be bumped from 0.4.2 to 0.4.3",
            level: 30,
          },
          // then the version command runs
          {
            command: "version",
            msg: "bumping tauri with minor",
            level: 30,
          },
          {
            command: "version",
            msg: "bumping tauri-updater with patch",
            level: 30,
          },
          {
            command: "version",
            msg: "bumping tauri.js with patch",
            level: 30,
          },
          {
            command: "version",
            msg: "Could not load the CHANGELOG.md. Creating one.",
            level: 30,
          },
          {
            command: "version",
            msg: "Could not load the CHANGELOG.md. Creating one.",
            level: 30,
          },
          {
            command: "version",
            msg: "Could not load the CHANGELOG.md. Creating one.",
            level: 30,
          },
          {
            command: "version",
            msg: ".changes/first-change.md was deleted",
            level: 30,
          },
          {
            command: "version",
            msg: ".changes/second-change.md was deleted",
            level: 30,
          },
          {
            msg: "covector version output",
            level: 30,
          },
          {
            msg: "completed",
            level: 30,
          },
        ],
        checksWithObject()
      );
      expect(core.setOutput).toHaveBeenCalledWith(
        "status",
        "There are 2 changes which include tauri with minor, tauri-updater with patch"
      );
      expect(core.setOutput).toHaveBeenCalledWith("commandRan", "version");
      // @ts-expect-error
      expect(core.setOutput?.calls?.templatePipe).toMatchSnapshot();
    });
  });

  describe("of publish", () => {
    vi.spyOn(github, "getOctokit")
      //@ts-expect-error
      .mockImplementation((token: string) => ({
        context: { repo: { owner: "genericOwner", repo: "genericRepo" } },
        rest: {
          repos: {
            listReleases: vi.fn().mockResolvedValue({
              data: [],
            }),
            updateRelease: vi
              .fn()
              .mockImplementation((input) => Promise.resolve({ data: input })),
            createRelease: vi
              .fn()
              .mockImplementation((input) => Promise.resolve({ data: input })),
            uploadReleaseAsset: vi
              .fn()
              .mockImplementation((input) => Promise.resolve({ data: input })),
          },
        },
      }));

    it("input", function* () {
      const stream = pinoTest.sink();
      const logger = pino(stream);
      const cwd: string = f.copy("integration.js-with-complex-commands");

      const input: { [k: string]: string } = {
        command: "publish",
        cwd,
        createRelease: "true",
        draftRelease: "false",
        token: "randomsequenceofcharactersforsecurity",
      };

      vi.spyOn(core, "getInput").mockImplementation((arg) => input[arg]);

      const covectoredAction = yield covector(logger);

      // to confirm we have reached the end of the logs
      logger.info("completed");
      yield pinoTest.consecutive(
        stream,
        [
          // status runs first to set some output
          {
            command: "status",
            msg: "There are no changes.",
            level: 30,
          },
          {
            command: "status",
            msg: "There is 2 packages ready to publish which includes package-one@2.3.1, package-two@1.9.0",
            level: 30,
          },
          // then the publish command runs
          {
            command: "publish",
            msg: "package-one [publish]: echo publish",
            level: 30,
          },
          {
            command: "publish",
            msg: "publish",
            level: 30,
          },
          // create release call
          {
            msg: "creating Github Release for package-one@2.3.1",
            level: 30,
          },
          {
            msg: "github release created for package-one with id: undefined",
            level: 30,
          },
          {
            command: "publish",
            msg: "package-two [publish]: echo publish",
            level: 30,
          },
          {
            command: "publish",
            msg: "publish",
            level: 30,
          },
          // create release call
          {
            msg: "creating Github Release for package-two@1.9.0",
            level: 30,
          },
          {
            msg: "github release created for package-two with id: undefined",
            level: 30,
          },
          {
            msg: "covector publish output",
            level: 30,
          },
          // and finishes with the output
          {
            msg: "completed",
            level: 30,
          },
        ],
        checksWithObject()
      );

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

    it("output", function* () {
      const stream = pinoTest.sink();
      const logger = pino(stream);
      const cwd: string = f.copy("integration.js-with-complex-commands");

      const input: { [k: string]: string } = {
        command: "publish",
        cwd,
        createRelease: "false",
        draftRelease: "false",
        token: "randomsequenceofcharactersforsecurity",
      };

      vi.spyOn(core, "getInput").mockImplementation((arg) => input[arg]);

      const covectoredAction = yield covector(logger);
      expect(covectoredAction).toMatchSnapshot();
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

    it("github release update of all packages", function* () {
      const stream = pinoTest.sink();
      const logger = pino(stream);
      const cwd: string = f.copy("integration.js-with-complex-commands");

      const input: { [k: string]: string } = {
        command: "publish",
        cwd,
        createRelease: "true",
        draftRelease: "false",
        token: "randomsequenceofcharactersforsecurity",
      };

      vi.spyOn(core, "getInput").mockImplementation((arg) => input[arg]);
      const octokit = vi
        .spyOn(github, "getOctokit")
        //@ts-expect-error
        .mockImplementation((token: string) => ({
          context: { repo: { owner: "genericOwner", repo: "genericRepo" } },
          rest: {
            repos: {
              listReleases: vi.fn().mockResolvedValue({
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
              }),
              updateRelease: vi
                .fn()
                .mockImplementation((input) =>
                  Promise.resolve({ data: input })
                ),
              createRelease: vi
                .fn()
                .mockImplementation((input) =>
                  Promise.resolve({ data: input })
                ),
              uploadReleaseAsset: vi
                .fn()
                .mockImplementation((input) =>
                  Promise.resolve({ data: input })
                ),
            },
          },
        }));

      const covectoredAction = yield covector(logger);
      expect(covectoredAction).toMatchSnapshot();
      expect(octokit).toHaveBeenCalledWith(input.token);
      const {
        listReleases,
        createRelease,
        updateRelease,
        //@ts-expect-error
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

    it("github release creation of all packages", function* () {
      const stream = pinoTest.sink();
      const logger = pino(stream);
      const cwd: string = f.copy("integration.js-with-complex-commands");

      const input: { [k: string]: string } = {
        command: "publish",
        cwd,
        createRelease: "true",
        draftRelease: "false",
        token: "randomsequenceofcharactersforsecurity",
      };

      vi.spyOn(core, "getInput").mockImplementation((arg) => input[arg]);
      const octokit = vi
        .spyOn(github, "getOctokit")
        //@ts-expect-error
        .mockImplementation((token: string) => ({
          context: { repo: { owner: "genericOwner", repo: "genericRepo" } },
          rest: {
            repos: {
              listReleases: vi.fn().mockResolvedValue({
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
              }),
              updateRelease: vi
                .fn()
                .mockImplementation((input) =>
                  Promise.resolve({ data: input })
                ),
              createRelease: vi
                .fn()
                .mockImplementation((input) =>
                  Promise.resolve({ data: input })
                ),
              uploadReleaseAsset: vi
                .fn()
                .mockImplementation((input) =>
                  Promise.resolve({ data: input })
                ),
            },
          },
        }));

      const covectoredAction = yield covector(logger);
      expect(covectoredAction).toMatchSnapshot();
      expect(octokit).toHaveBeenCalledWith(input.token);
      const {
        listReleases,
        createRelease,
        updateRelease,
        //@ts-expect-error
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

    it("github release update of single package", function* () {
      const stream = pinoTest.sink();
      const logger = pino(stream);
      const cwd: string = f.copy("integration.js-with-single-github-release");

      const input: { [k: string]: string } = {
        command: "publish",
        cwd,
        createRelease: "true",
        draftRelease: "false",
        token: "randomsequenceofcharactersforsecurity",
      };

      vi.spyOn(core, "getInput").mockImplementation((arg) => input[arg]);
      const octokit = vi
        .spyOn(github, "getOctokit")
        //@ts-expect-error
        .mockImplementation((token: string) => ({
          context: { repo: { owner: "genericOwner", repo: "genericRepo" } },
          rest: {
            repos: {
              listReleases: vi.fn().mockResolvedValue({
                data: [
                  {
                    draft: true,
                    body: "some stuff",
                    id: 15,
                    tag_name: "v2.3.1",
                  },
                ],
              }),
              updateRelease: vi
                .fn()
                .mockImplementation((input) =>
                  Promise.resolve({ data: input })
                ),
              createRelease: vi
                .fn()
                .mockImplementation((input) =>
                  Promise.resolve({ data: input })
                ),
              uploadReleaseAsset: vi
                .fn()
                .mockImplementation((input) =>
                  Promise.resolve({ data: input })
                ),
            },
          },
        }));

      const covectoredAction = yield covector(logger);
      expect(covectoredAction).toMatchSnapshot();
      expect(octokit).toHaveBeenCalledWith(input.token);
      const {
        listReleases,
        createRelease,
        updateRelease,
        //@ts-expect-error
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

    it("github release creation of single package", function* () {
      const stream = pinoTest.sink();
      const logger = pino(stream);
      const cwd: string = f.copy("integration.js-with-single-github-release");

      const input: { [k: string]: string } = {
        command: "publish",
        cwd,
        createRelease: "true",
        draftRelease: "false",
        token: "randomsequenceofcharactersforsecurity",
      };

      vi.spyOn(core, "getInput").mockImplementation((arg) => input[arg]);
      const octokit = vi
        .spyOn(github, "getOctokit")
        //@ts-expect-error
        .mockImplementation((token: string) => ({
          context: { repo: { owner: "genericOwner", repo: "genericRepo" } },
          rest: {
            repos: {
              listReleases: vi.fn().mockResolvedValue({
                data: [],
              }),
              updateRelease: vi
                .fn()
                .mockImplementation((input) =>
                  Promise.resolve({ data: input })
                ),
              createRelease: vi
                .fn()
                .mockImplementation((input) =>
                  Promise.resolve({ data: input })
                ),
              uploadReleaseAsset: vi
                .fn()
                .mockImplementation((input) =>
                  Promise.resolve({ data: input })
                ),
            },
          },
        }));

      const covectoredAction = yield covector(logger);

      yield pinoTest.once(stream, {
        command: "publish",
        msg: "We cannot pipe the function command in package-one@2.3.1",
        level: 50,
      });

      expect(covectoredAction).toMatchSnapshot();
      expect(octokit).toHaveBeenCalledWith(input.token);
      const {
        listReleases,
        createRelease,
        updateRelease,
        //@ts-expect-error
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
