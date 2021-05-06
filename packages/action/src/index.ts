import * as core from "@actions/core";
import * as github from "@actions/github";
import { covector, Covector } from "../../covector/src/run";
import {
  commandText,
  packageListToArray,
  injectPublishFunctions,
  createReleases,
} from "./utils";

export function* run(): Generator<any, any, any> {
  try {
    const cwd =
      core.getInput("cwd") === "" ? process.env.cwd : core.getInput("cwd");
    const token =
      core.getInput("token") === ""
        ? process.env.GITHUB_TOKEN || ""
        : core.getInput("token");
    const inputCommand = core.getInput("command");

    if (!inputCommand) {
      throw new Error("Must specify command for action. See README.");
    };

    const filterPackages = packageListToArray(core.getInput("filterPackages"));
    let command = inputCommand;

    if (inputCommand === "version-or-publish") {
      const status = yield covector({ command: "status" });
      core.setOutput("status", status);
      if (status === "No changes.") {
        console.log("As there are no changes, let's try publishing.");
        command = "publish";
      } else {
        command = "version";
      }
    }

    core.setOutput("commandRan", command);
    let successfulPublish = false;
    if (command === "status") {
      const covectored = yield covector({ command, filterPackages, cwd });
      core.setOutput("status", covectored);
    } else if (command === "version") {
      const covectored: Covector = yield covector({
        command,
        filterPackages,
        cwd,
      });
      core.setOutput("successfulPublish", successfulPublish);

      const covectoredSmushed = Object.keys(covectored).reduce((text, pkg) => {
        if (typeof covectored[pkg].command === "string") {
          text = `${text}\n\n\n# ${pkg}\n\n${commandText(covectored[pkg])}`;
        }
        return text;
      }, "# Version Updates\n\nMerging this PR will bump all of the applicable packages based on your change files.\n\n");
      core.setOutput("change", covectoredSmushed);
      const payload = JSON.stringify(covectoredSmushed, undefined, 2);
      console.log(`The covector output: ${payload}`);
    } else if (command === "publish") {
      let covectored: Covector;
      if (core.getInput("createRelease") === "true" && token) {
        const octokit = github.getOctokit(token);
        const { owner, repo } = github.context.repo;
        covectored = yield covector({
          command,
          filterPackages,
          cwd,
          modifyConfig: injectPublishFunctions([
            createReleases({ core, octokit, owner, repo }),
          ]),
        });
      } else {
        covectored = yield covector({
          command,
          filterPackages,
          cwd,
        });
      }

      if (covectored) {
        let packagesPublished = Object.keys(covectored).reduce((pub, pkg) => {
          if (!covectored[pkg].published) {
            return pub;
          } else {
            return `${pub}${pkg}`;
          }
        }, "");
        core.setOutput("packagesPublished", packagesPublished);

        for (let pkg of Object.keys(covectored)) {
          if (covectored[pkg].command !== false) successfulPublish = true;
        }
        core.setOutput("successfulPublish", successfulPublish);

        core.setOutput("change", covectored);
        const payload = JSON.stringify(
          Object.keys(covectored).reduce((c, pkg) => {
            //@ts-ignore
            delete c[pkg].pkg.pkgFile.vfile;
            return c;
          }, covectored),
          undefined,
          2
        );
        console.log(`The covector output: ${payload}`);
        return covectored;
      }
    } else if (command === "preview") {
      const previewLabel = github?.context?.payload?.pull_request?.labels?.filter(({ name } : { name: String }) => name === 'preview').length;
      if (!previewLabel) {
        console.log('Not publishing any preview packages because the "preview" label has not been applied to this pull request.')
      } else {
        let covectored: Covector;
        // if (core.getInput("createRelease") === "true" && token) {
        //   const octokit = github.getOctokit(token);
        //   const { owner, repo } = github.context.repo;
        //   covectored = yield covector({
        //     command,
        //     filterPackages,
        //     cwd,
        //     modifyConfig: injectPublishFunctions([
        //       createReleases({ core, octokit, owner, repo }),
        //     ]),
        //   });
        // } else {
          covectored = yield covector({
            command,
            filterPackages,
            cwd,
          });
        // }

        // if (covectored) {
        //   let packagesPublished = Object.keys(covectored).reduce((pub, pkg) => {
        //     if (!covectored[pkg].published) {
        //       return pub;
        //     } else {
        //       return `${pub}${pkg}`;
        //     }
        //   }, "");
        //   core.setOutput("packagesPublished", packagesPublished);
          // for (let pkg of Object.keys(covectored)) {
          //   if (covectored[pkg].command !== false) successfulPublish = true;
          // }
          // core.setOutput("successfulPublish", successfulPublish);
          // core.setOutput("change", covectored);
        // }
      }
    } else {
      throw new Error(`Command "${command}" not recognized. See README for which commands are available.`);
    };
  } catch (error) {
    core.setFailed(error.message);
  }
}
