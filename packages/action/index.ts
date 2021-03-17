import core from "@actions/core";
import github from "@actions/github";
import { main } from "@effection/node";
import { covector, Covector } from "../covector/src/run";
import {
  commandText,
  packageListToArray,
  injectPublishFunctions,
  createReleases,
} from "./utils";

main(function* run(): Generator<any, void, any> {
  try {
    const token =
      core.getInput("token") === ""
        ? process.env.GITHUB_TOKEN
        : core.getInput("token");
    const inputCommand = core.getInput("command");
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
      const covectored = yield covector({ command, filterPackages });
    } else if (command === "version") {
      const covectored: Covector = yield covector({ command, filterPackages });
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
          modifyConfig: injectPublishFunctions([
            createReleases({ core, octokit, owner, repo }),
          ]),
        });
      } else {
        covectored = yield covector({
          command,
          filterPackages,
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
        const payload = JSON.stringify(covectored, undefined, 2);
        console.log(`The covector output: ${payload}`);
      }
    }
  } catch (error) {
    core.setFailed(error.message);
  }
});
