import * as core from "@actions/core";
import * as github from "@actions/github";
import { covector } from "../../covector/src/run";
import {
  commandText,
  packageListToArray,
  injectPublishFunctions,
  createReleases,
} from "./utils";

import type {
  CovectorStatus,
  CovectorVersion,
  CovectorPublish,
} from "../../types/src";

export function* run(): Generator<any, any, any> {
  try {
    const cwd =
      core.getInput("cwd") === "" ? process.cwd() : core.getInput("cwd");
    const token =
      core.getInput("token") === ""
        ? process.env.GITHUB_TOKEN || ""
        : core.getInput("token");
    const inputCommand = core.getInput("command");
    const releaseCommitish = core.getInput('releaseCommitish') || github.context.sha;

    if (!inputCommand) {
      throw new Error("Must specify command for action. See README.");
    }

    const filterPackages = packageListToArray(core.getInput("filterPackages"));
    let command = inputCommand;

    if (inputCommand === "version-or-publish") {
      const status = yield covector({ command: "status", cwd });
      if (status.response === "No changes.") {
        console.log("As there are no changes, let's try publishing.");
        command = "publish";
      } else {
        command = "version";
      }
    }

    core.setOutput("commandRan", command);
    let successfulPublish = false;
    if (command === "status") {
      const covectored: CovectorStatus = yield covector({
        command,
        filterPackages,
        cwd,
      });
      core.setOutput("status", covectored.response);
      core.setOutput("templatePipe", covectored.pipeTemplate);

      core.setOutput(
        `willPublish`,
        covectored.response === "No changes." &&
        covectored.pkgReadyToPublish.length > 0
      );
      if (covectored?.pkgReadyToPublish?.length > 0) {
        covectored.pkgReadyToPublish.forEach((pkg) => {
          core.setOutput(
            `willPublish-${pkg.pkg}`
              .replace(/\@/g, "-")
              .replace(/\//g, "-")
              .replace(/\_/g, "-"),
            true
          );
          core.setOutput(
            `version-${pkg.pkg}`
              .replace(/\@/g, "-")
              .replace(/\//g, "-")
              .replace(/\_/g, "-"),
            pkg?.pkgFile?.version ?? ""
          );
        });
      }
    } else if (command === "version") {
      const status: CovectorStatus = yield covector({ command: "status", cwd });
      core.setOutput("status", status.response);

      const covectored: CovectorVersion = yield covector({
        command,
        filterPackages,
        cwd,
      });
      core.setOutput("templatePipe", covectored.pipeTemplate);

      const covectoredSmushed = Object.keys(covectored.commandsRan).reduce(
        (text, pkg) => {
          if (typeof covectored.commandsRan[pkg].command === "string") {
            text = `${text}\n\n\n# ${pkg}\n\n${commandText(
              covectored.commandsRan[pkg]
            )}`;
          }
          return text;
        },
        "# Version Updates\n\nMerging this PR will release new versions of the following packages based on your change files.\n\n"
      );
      core.setOutput("change", covectoredSmushed);
      const payload = JSON.stringify(covectoredSmushed, undefined, 2);
      core.startGroup(`covector version output`);
      console.log(`The covector output: ${payload}`);
      core.endGroup();
    } else if (command === "publish") {
      const status = yield covector({ command: "status", cwd });
      core.setOutput("status", status.response);

      let covectored: CovectorPublish;
      core.debug(
        `createRelease is ${core.getInput("createRelease")} ${token ? "with" : "without"
        } a token.`
      );
      if (core.getInput("createRelease") === "true" && token) {
        const octokit = github.getOctokit(token);
        const { owner, repo } = github.context.repo;
        core.debug(`Fetched context, owner is ${owner} and repo is ${repo}.`);
        covectored = yield covector({
          command,
          filterPackages,
          cwd,
          modifyConfig: injectPublishFunctions([
            createReleases({ core, octokit, owner, repo, targetCommitish: releaseCommitish }),
          ]),
        });
      } else {
        covectored = yield covector({
          command,
          filterPackages,
          cwd,
        });
      }

      if (covectored.commandsRan) {
        let packagesPublished = Object.keys(covectored.commandsRan).reduce(
          (pub, pkg) => {
            if (!covectored.commandsRan[pkg].published) {
              return pub;
            } else {
              return pub === "" ? pkg : `${pub},${pkg}`;
            }
          },
          ""
        );
        core.setOutput("packagesPublished", packagesPublished);
        core.setOutput("templatePipe", JSON.stringify(covectored.pipeTemplate));

        for (let pkg of Object.keys(covectored.commandsRan)) {
          if (covectored.commandsRan[pkg].command !== false)
            successfulPublish = true;
        }
        core.setOutput("successfulPublish", successfulPublish);

        core.setOutput("change", covectored.commandsRan);
        const payload = JSON.stringify(
          Object.keys(covectored.commandsRan).reduce((c, pkg) => {
            //@ts-ignore
            delete c[pkg].pkg.pkgFile.vfile;
            return c;
          }, covectored.commandsRan),
          undefined,
          2
        );

        core.startGroup(`covector publish output`);
        console.log(`The covector output: ${payload}`);
        core.endGroup();
        return covectored;
      }
    } else if (command === "preview") {
      const configuredLabel = core.getInput("label");
      const previewLabel = github?.context?.payload?.pull_request?.labels?.filter(
        ({ name }: { name: String }) => name === configuredLabel
      ).length;
      const previewVersion = core.getInput("previewVersion");
      const versionIdentifier = core.getInput("identifier");

      if (github.context.eventName !== "pull_request") {
        throw new Error(
          `The 'preview' command for the covector action is only meant to run on pull requests.`
        );
      }

      if (github.context.eventName !== "pull_request") {
        throw new Error(
          `The 'preview' command for the covector action is only meant to run on pull requests.`
        );
      }

      if (!previewLabel) {
        console.log(
          `Not publishing any preview packages because the "${configuredLabel}" label has not been applied to this pull request.`
        );
      } else {
        // primarily runs publish
        let covectored: CovectorPublish;
        const branchName = github?.context?.payload?.pull_request?.head?.ref;
        let identifier;
        let versionTemplate;
        const branchTag = branchName
          .replace(/(?!.\_)\_/g, "__")
          .replace(/\//g, "_");

        if (branchName === "latest") {
          throw new Error(
            `Using the branch name, 'latest', will conflict with restricted tags when publishing packages. Please create another pull request with a different branch name.`
          );
        }

        switch (versionIdentifier) {
          case "branch":
            identifier = branchName.replace(/\_/g, "-").replace(/\//g, "-");
            break;
          default:
            throw new Error(
              `Version identifier you specified, "${versionIdentifier}", is invalid.`
            );
        }

        switch (previewVersion) {
          case "date":
            versionTemplate = `${identifier}.${Date.now()}`;
            break;
          case "sha":
            versionTemplate = `${identifier}.${github.context.payload.after.substring(
              0,
              7
            )}`;
            break;
          default:
            throw new Error(
              `Preview version template you specified, "${previewVersion}", is invalid. Please use 'date' or 'sha'.`
            );
        }

        covectored = yield covector({
          command,
          filterPackages,
          cwd,
          previewVersion: versionTemplate,
          branchTag,
        });

        if (covectored.commandsRan) {
          let packagesPublished: any = Object.entries(
            covectored.commandsRan
          ).reduce(
            //@ts-ignore
            (pub: Array<string>, pkg: Array<any>) => {
              if (pkg[1].published) {
                let {
                  name: pkgName,
                  version: pkgVersion,
                }: any = pkg[1].pkg.pkgFile.pkg;
                return pub.concat(`${pkgName}@${pkgVersion}`);
              }
            },
            []
          );

          if (token && github.context.payload.pull_request) {
            const octokit = github.getOctokit(token);
            const {
              pull_request: { number: issue_number },
              repository: {
                name: repo,
                owner: { login: owner },
              },
              after,
            }: any = github.context.payload;

            const { data } = yield octokit.rest.issues.listComments({
              owner,
              repo,
              issue_number,
            });

            const covectorComments = data.filter((comment: any) =>
              comment.body.includes("<!-- covector comment -->")
            );

            let prComment = () => {
              let commentHead = "";
              let commentBody = "";
              if (packagesPublished.length) {
                commentHead = `The following preview packages have been published by Covector:`;
                commentBody = packagesPublished.reduce(
                  (result: string, publishedPackage: string) => {
                    return `${result}- \`${publishedPackage}\`\n`;
                  },
                  ""
                );
              } else {
                commentHead = "Covector did not publish any preview packages.";
              }
              const commentFoot = `<p align="right">${after.slice(0, 7)}</p>`;
              return `${commentHead}\n${commentBody}\n${commentFoot}\n<!-- covector comment -->`;
            };

            if (covectorComments.length !== 1) {
              yield octokit.rest.issues.createComment({
                owner,
                repo,
                issue_number,
                body: prComment(),
              });
            } else {
              yield octokit.rest.issues.updateComment({
                owner,
                repo,
                comment_id: covectorComments[0].id,
                body: prComment(),
              });
            }
          } else {
            throw new Error(
              `Github token argument in preview workflow is missing but it is required in order to generate comments on pull requests.`
            );
          }

          core.setOutput("packagesPublished", packagesPublished);
          core.setOutput("templatePipe", covectored.pipeTemplate);
          for (let pkg of Object.keys(covectored.commandsRan)) {
            if (covectored.commandsRan[pkg].command !== false)
              successfulPublish = true;
          }
          core.setOutput("successfulPublish", successfulPublish);
          core.setOutput("change", covectored.commandsRan);
        }
      }
    } else {
      throw new Error(
        `Command "${command}" not recognized. See README for which commands are available.`
      );
    }
  } catch (error: any) {
    core.setFailed(error.message);
  }
}
