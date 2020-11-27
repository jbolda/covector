const core = require("@actions/core");
const github = require("@actions/github");
const { main } = require("@effection/node");
const { covector } = require("../covector");
const { commandText, packageListToArray } = require("./utils");
const fs = require("fs");

main(function* run() {
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
    const covectored = yield covector({ command, filterPackages });

    core.setOutput("commandRan", command);
    let successfulPublish = false;
    if (command === "publish") {
      for (let pkg of Object.keys(covectored)) {
        if (covectored[pkg].command !== false) successfulPublish = true;
      }
    }
    core.setOutput("successfulPublish", successfulPublish);

    if (command === "version") {
      const covectoredSmushed = Object.keys(covectored).reduce((text, pkg) => {
        if (typeof covectored[pkg].command === "string") {
          text = `${text}\n\n\n# ${pkg}\n\n${commandText(covectored[pkg])}`;
        }
        return text;
      }, "# Version Updates\n\nMerging this PR will bump all of the applicable packages based on your change files.\n\n");
      core.setOutput("change", covectoredSmushed);
      const payload = JSON.stringify(covectoredSmushed, undefined, 2);
      console.log(`The covector output: ${payload}`);
    } else if (
      command === "publish" &&
      core.getInput("createRelease") === "true"
    ) {
      core.setOutput("change", covectored);
      const payload = JSON.stringify(covectored, undefined, 2);
      console.log(`The covector output: ${payload}`);
      const octokit = github.getOctokit(token);
      const { owner, repo } = github.context.repo;

      let releases = {};
      for (let pkg of Object.keys(covectored)) {
        if (covectored[pkg].command !== false) {
          console.log(
            `creating release for ${pkg}@${covectored[pkg].pkg.pkgFile.version}`
          );
          const createReleaseResponse = yield octokit.repos.createRelease({
            owner,
            repo,
            tag_name: `${pkg}-v${covectored[pkg].pkg.pkgFile.version}`,
            name: `${pkg} v${covectored[pkg].pkg.pkgFile.version}`,
            body: commandText(covectored[pkg]),
            draft: core.getInput("draftRelease") === "true" ? true : false,
          });
          const { data } = createReleaseResponse;
          console.log("release created: ", data);
          releases[pkg] = data; // { id: releaseId, html_url: htmlUrl, upload_url: uploadUrl }

          const { id: releaseId } = data;

          if (covectored[pkg].pkg.assets) {
            try {
              for (let asset of covectored[pkg].pkg.assets) {
                console.log(
                  `uploading asset ${asset.name} for ${pkg}@${covectored[pkg].pkg.pkgFile.version}`
                );
                const uploadedAsset = yield octokit.repos.uploadReleaseAsset({
                  owner,
                  repo,
                  release_id: releaseId,
                  name: asset.name,
                  data: fs.readFileSync(asset.path),
                });
              }
            } catch (error) {
              console.error(error);
            }
          }
        }
      }
    }
  } catch (error) {
    core.setFailed(error.message);
  }
});
