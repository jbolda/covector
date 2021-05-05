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
      if ((yield covector({ command: "status" })) === "No changes.") {
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
      const configuredLabel = core.getInput("label");
      const previewLabel = github?.context?.payload?.pull_request?.labels?.filter(({ name } : { name: String }) => name === configuredLabel).length;
      const previewVersion = core.getInput("previewVersion");
      const versionIdentifier = core.getInput('identifier');

      if (github.context.eventName !== "pull_request") {
        throw new Error(`The 'preview' command for the covector action is only meant to run on pull requests.`);
      }

      if (!previewLabel) {
        console.log(`Not publishing any preview packages because the "${configuredLabel}" label has not been applied to this pull request.`);
      } else {
        let covectored: Covector;
        const branchName = github?.context?.payload?.pull_request?.head?.ref;
        let identifier;
        let versionTemplate;
        
        switch(versionIdentifier){
          case "branch":
            identifier = branchName.replace(/\_/g, '-').replace(/\//g, '-');
            break;
          default:
            throw new Error(`Version identifier you specified, "${versionIdentifier}", is invalid.`)
        }

        switch(previewVersion){
          case "date":
            versionTemplate = `${identifier}.${Date.now()}`;
            break;
          case "sha":
            versionTemplate = `${identifier}.${github.context.payload.after.substring(0, 7)}`;
            break;
          default:
            throw new Error(`Preview version template you specified, "${previewVersion}", is invalid. Please use 'date' or 'sha'.`)
        };

        covectored = yield covector({
          command,
          filterPackages,
          cwd,
          // context: github.context.payload,
          previewVersion: versionTemplate
        });

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
        }
      }
    } else {
      throw new Error(`Command "${command}" not recognized. See README for which commands are available.`);
    };
  } catch (error) {
    core.setFailed(error.message);
  }
}
