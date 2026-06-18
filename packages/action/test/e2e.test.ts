import * as core from "@actions/core";
import * as github from "@actions/github";
import { run as covector } from "../src/index.ts";
import { describe, it } from "../../../helpers/test-scope.ts";
import { expect, vi } from "vitest";
import * as logTest from "../../../helpers/test-logger.ts";
// @ts-expect-error has no types
import fixtures from "fixturez";
import { checksWithObject } from "./helpers.ts";

import { logger } from "../../covector/src/logger.ts";
const f = fixtures(__dirname);

vi.mock("@actions/core", () => ({
  setOutput: vi.fn(),
  getInput: vi.fn(),
  setFailed: (err: any) => {
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
      const log = yield* logTest.useCapturedLogger();
      const cwd: string = f.copy("integration.js-with-complex-commands");

      const input: { [k: string]: string } = {
        command: "status",
        cwd,
        createRelease: "false",
        draftRelease: "false",
        token: "randomsequenceofcharactersforsecurity",
      };

      vi.spyOn(core, "getInput").mockImplementation((arg) => input[arg]);

      yield* covector(logger.operations);

      // to confirm we have reached the end of the logs
      yield* logger.operations.info("completed");
      yield* logTest.consecutive(
        log.all,
        [
          {
            command: "status",
            msg: "There are no changes.",
            level: "info",
          },
          {
            command: "status",
            msg: "There is 2 packages ready to publish which includes package-one@2.3.1, package-two@1.9.0",
            level: "info",
          },
          {
            msg: "completed",
            level: "info",
          },
        ],
        checksWithObject(),
      );
      expect(core.setOutput).toHaveBeenCalledWith("commandRan", "status");
      expect(core.setOutput).toHaveBeenCalledWith("status", "No changes.");
    });
  });

  describe("of version", () => {
    it("outputs for no change", function* () {
      const log = yield* logTest.useCapturedLogger();
      const cwd: string = f.copy("integration.js-with-complex-commands");

      const input: { [k: string]: string } = {
        command: "version",
        cwd,
        createRelease: "false",
        draftRelease: "false",
        token: "randomsequenceofcharactersforsecurity",
      };

      vi.spyOn(core, "getInput").mockImplementation((arg) => input[arg]);

      yield* covector(logger.operations);

      const changeOutput =
        "# Version Updates\n\n" +
        "Merging this PR will release new versions of the following packages based on your change files.\n\n";
      // to confirm we have reached the end of the logs
      yield* logger.operations.info("completed");
      yield* logTest.consecutive(
        log.all,
        [
          // status runs first to set some output
          {
            command: "status",
            msg: "There are no changes.",
            level: "info",
          },
          {
            command: "status",
            msg: "There is 2 packages ready to publish which includes package-one@2.3.1, package-two@1.9.0",
            level: "info",
          },
          // then the version command runs
          // TODO should there be more logs?
          // and finishes with the output
          {
            msg: "covector version output",
            renderAsYAML: changeOutput,
            level: "info",
          },
          {
            msg: "completed",
            level: "info",
          },
        ],
        checksWithObject(),
      );
      expect(core.setOutput).toHaveBeenCalledWith("status", "No changes.");
      expect(core.setOutput).toHaveBeenCalledWith("commandRan", "version");
      expect(core.setOutput).toHaveBeenCalledWith("change", changeOutput);
      // @ts-expect-error
      expect(core.setOutput?.calls?.templatePipe).toBeUndefined();
    });

    it("outputs with changes", function* () {
      const log = yield* logTest.useCapturedLogger();
      const cwd: string = f.copy("integration.js-and-rust-with-changes");

      const input: { [k: string]: string } = {
        command: "version",
        cwd,
        createRelease: "false",
        draftRelease: "false",
        token: "randomsequenceofcharactersforsecurity",
      };

      vi.spyOn(core, "getInput").mockImplementation((arg) => input[arg]);

      yield* covector(logger.operations);

      // to confirm we have reached the end of the logs
      yield* logger.operations.info("completed");
      yield* logTest.consecutive(
        log.all,
        [
          // status runs first to set some output
          {
            command: "status",
            msg: "changes:",
            level: "info",
          },
          {
            command: "status",
            msg: "tauri => minor",
            level: "info",
          },
          {
            command: "status",
            msg: "tauri-updater => patch",
            level: "info",
          },
          {
            command: "status",
            msg: "bumping tauri with minor",
            level: "info",
          },
          {
            command: "status",
            msg: "bumping tauri-updater with patch",
            level: "info",
          },
          {
            command: "status",
            msg: "bumping tauri.js with patch",
            level: "info",
          },
          {
            command: "status",
            msg: "tauri.js planned to be bumped from 0.6.2 to 0.6.3",
            level: "info",
          },
          {
            command: "status",
            msg: "tauri planned to be bumped from 0.5.2 to 0.6.0",
            level: "info",
          },
          {
            command: "status",
            msg: "tauri-updater planned to be bumped from 0.4.2 to 0.4.3",
            level: "info",
          },
          // then the version command runs
          {
            command: "version",
            msg: "bumping tauri with minor",
            level: "info",
          },
          {
            command: "version",
            msg: "bumping tauri-updater with patch",
            level: "info",
          },
          {
            command: "version",
            msg: "bumping tauri.js with patch",
            level: "info",
          },
          {
            command: "version",
            msg: "Could not load the CHANGELOG.md. Creating one.",
            level: "info",
          },
          {
            command: "version",
            msg: "Could not load the CHANGELOG.md. Creating one.",
            level: "info",
          },
          {
            command: "version",
            msg: "Could not load the CHANGELOG.md. Creating one.",
            level: "info",
          },
          {
            command: "version",
            msg: ".changes/first-change.md was deleted",
            level: "info",
          },
          {
            command: "version",
            msg: ".changes/second-change.md was deleted",
            level: "info",
          },
          {
            msg: "covector version output",
            level: "info",
          },
          {
            msg: "completed",
            level: "info",
          },
        ],
        checksWithObject(),
      );
      expect(core.setOutput).toHaveBeenCalledWith(
        "status",
        "There are 2 changes which include tauri with minor, tauri-updater with patch",
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
      const log = yield* logTest.useCapturedLogger();
      const cwd: string = f.copy("integration.js-with-complex-commands");

      const input: { [k: string]: string } = {
        command: "publish",
        cwd,
        createRelease: "true",
        draftRelease: "false",
        token: "randomsequenceofcharactersforsecurity",
      };

      vi.spyOn(core, "getInput").mockImplementation((arg) => input[arg]);

      const covectoredAction = yield* covector(logger.operations);

      // to confirm we have reached the end of the logs
      yield* logger.operations.info("completed");
      yield* logTest.consecutive(
        log.all,
        [
          // status runs first to set some output
          {
            command: "status",
            msg: "There are no changes.",
            level: "info",
          },
          {
            command: "status",
            msg: "There is 2 packages ready to publish which includes package-one@2.3.1, package-two@1.9.0",
            level: "info",
          },
          // then the publish command runs
          {
            msg: "package-one [publish]: echo publish",
            level: "info",
          },
          {
            msg: "publish",
            level: "info",
          },
          // create release call
          {
            msg: "creating Github Release for package-one@2.3.1",
            level: "info",
          },
          {
            msg: "github release created for package-one with id: undefined",
            level: "info",
          },
          {
            msg: "package-two [publish]: echo publish",
            level: "info",
          },
          {
            msg: "publish",
            level: "info",
          },
          // create release call
          {
            msg: "creating Github Release for package-two@1.9.0",
            level: "info",
          },
          {
            msg: "github release created for package-two with id: undefined",
            level: "info",
          },
          {
            msg: "covector publish output",
            level: "info",
          },
          // and finishes with the output
          {
            msg: "completed",
            level: "info",
          },
        ],
        checksWithObject(),
      );

      expect({ covectoredAction }).toMatchSnapshot();
      expect(core.setOutput).toHaveBeenCalledWith(
        "templatePipe",
        expect.stringContaining("2.3.1"),
      );
      expect(core.setOutput).toHaveBeenCalledWith(
        "templatePipe",
        expect.stringContaining("1.9.0"),
      );
    });

    it("output", function* () {
      const log = yield* logTest.useCapturedLogger();
      const cwd: string = f.copy("integration.js-with-complex-commands");

      const input: { [k: string]: string } = {
        command: "publish",
        cwd,
        createRelease: "false",
        draftRelease: "false",
        token: "randomsequenceofcharactersforsecurity",
      };

      vi.spyOn(core, "getInput").mockImplementation((arg) => input[arg]);

      const covectoredAction = yield* covector(logger.operations);
      expect(covectoredAction).toMatchSnapshot();
      expect(core.setOutput).toHaveBeenCalledWith("status", "No changes.");
      expect(core.setOutput).toHaveBeenCalledWith("commandRan", "publish");
      expect(core.setOutput).toHaveBeenCalledWith("successfulPublish", true);
      expect(core.setOutput).toHaveBeenCalledWith(
        "packagesPublished",
        "package-one,package-two",
      );
      expect(core.setOutput).toHaveBeenCalledWith(
        "templatePipe",
        expect.stringContaining("2.3.1"),
      );
      expect(core.setOutput).toHaveBeenCalledWith(
        "templatePipe",
        expect.stringContaining("1.9.0"),
      );
    });

    it("github release update of all packages", function* () {
      const log = yield* logTest.useCapturedLogger();
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
                  Promise.resolve({ data: input }),
                ),
              createRelease: vi
                .fn()
                .mockImplementation((input) =>
                  Promise.resolve({ data: input }),
                ),
              uploadReleaseAsset: vi
                .fn()
                .mockImplementation((input) =>
                  Promise.resolve({ data: input }),
                ),
            },
          },
        }));

      const covectoredAction = yield* covector(logger.operations);
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

      expect(updateRelease).toHaveBeenCalledTimes(2);
      expect(updateRelease.mock.calls).toEqual(
        expect.arrayContaining([
          [
            expect.objectContaining({
              owner: "genericOwner",
              repo: "genericRepo",
              release_id: 15,
              draft: false,
              body: expect.stringContaining("## \\[2.3.1]"),
            }),
          ],
          [
            expect.objectContaining({
              owner: "genericOwner",
              repo: "genericRepo",
              release_id: 22,
              draft: false,
              body: expect.stringContaining("## \\[1.9.0]"),
            }),
          ],
        ]),
      );

      expect(createRelease).toHaveBeenCalledTimes(0);
    });

    it("github release creation of all packages", function* () {
      const log = yield* logTest.useCapturedLogger();
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
                  Promise.resolve({ data: input }),
                ),
              createRelease: vi
                .fn()
                .mockImplementation((input) =>
                  Promise.resolve({ data: input }),
                ),
              uploadReleaseAsset: vi
                .fn()
                .mockImplementation((input) =>
                  Promise.resolve({ data: input }),
                ),
            },
          },
        }));

      const covectoredAction = yield* covector(logger.operations);
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

      expect(createRelease).toHaveBeenCalledTimes(2);
      expect(createRelease.mock.calls).toEqual(
        expect.arrayContaining([
          [
            expect.objectContaining({
              owner: "genericOwner",
              repo: "genericRepo",
              name: "package-one v2.3.1",
              tag_name: "package-one-v2.3.1",
              draft: false,
              body: expect.stringContaining("## \\[2.3.1]"),
            }),
          ],
          [
            expect.objectContaining({
              owner: "genericOwner",
              repo: "genericRepo",
              name: "package-two v1.9.0",
              tag_name: "package-two-v1.9.0",
              draft: false,
              body: expect.stringContaining("## \\[1.9.0]"),
            }),
          ],
        ]),
      );

      expect(updateRelease).toHaveBeenCalledTimes(0);
    });

    it("github release update of single package", function* () {
      const log = yield* logTest.useCapturedLogger();
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
                  Promise.resolve({ data: input }),
                ),
              createRelease: vi
                .fn()
                .mockImplementation((input) =>
                  Promise.resolve({ data: input }),
                ),
              uploadReleaseAsset: vi
                .fn()
                .mockImplementation((input) =>
                  Promise.resolve({ data: input }),
                ),
            },
          },
        }));

      const covectoredAction = yield* covector(logger.operations);
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
      const log = yield* logTest.useCapturedLogger();
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
                  Promise.resolve({ data: input }),
                ),
              createRelease: vi
                .fn()
                .mockImplementation((input) =>
                  Promise.resolve({ data: input }),
                ),
              uploadReleaseAsset: vi
                .fn()
                .mockImplementation((input) =>
                  Promise.resolve({ data: input }),
                ),
            },
          },
        }));

      const covectoredAction = yield* covector(logger.operations);

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
