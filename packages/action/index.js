const core = require("@actions/core");
const github = require("@actions/github");
const { main } = require("@effection/node");
const { covector } = require("../covector");
const fs = require("fs");

main(function* run() {
  try {
    const token =
      core.getInput("token") === ""
        ? process.env.GITHUB_TOKEN
        : core.getInput("token");
    const inputCommand = core.getInput("command");
    let command = inputCommand;
    if (inputCommand === "version-or-publish") {
      if ((yield covector({ command: "status" })) === "No changes.") {
        console.log("As there are no changes, let's try publishing.");
        command = "publish";
      } else {
        command = "version";
      }
    }
    const covectored = yield covector({ command });

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
    } else if (command === "publish" && core.getInput("createRelease")) {
      core.setOutput("change", covectored);
      const payload = JSON.stringify(covectored, undefined, 2);
      console.log(`The covector output: ${payload}`);
      const octokit = github.getOctokit(token);
      const { owner, repo } = github.context.repo;
      let releases = {};
      for (let pkg of Object.keys(covectored)) {
        if (covectored[pkg].command !== false) {
          // true to test
          const createReleaseResponse = yield octokit.repos.createRelease({
            owner,
            repo,
            tag_name: `${pkg}-v${covectored[pkg].pkg.pkgFile.version}`,
            name: `${pkg} v${covectored[pkg].pkg.pkgFile.version}`,
            body: commandText(covectored[pkg]),
          });
          const { data } = createReleaseResponse;
          releases[pkg] = data; // { id: releaseId, html_url: htmlUrl, upload_url: uploadUrl }

          const { releaseId } = data;

          // Determine content-length for header to upload asset
          const contentLength = (filePath) => fs.statSync(filePath).size;

          if (covectored[pkg].pkg.assets) {
            for (let asset in covectored[pkg].pkg.assetPaths) {
              // Setup headers for API call, see Octokit Documentation: https://octokit.github.io/rest.js/#octokit-routes-repos-upload-release-asset for more information
              const headers = {
                "content-type": assetContentType,
                "content-length": contentLength(assetPath),
              };

              const uploadedAsset = yield octokit.repos.uploadReleaseAsset({
                owner,
                repo,
                headers,
                release_id,
                name: asset.name,
                file: fs.readFileSync(asset.path),
              });
            }
          }
        }
      }
    }
  } catch (error) {
    core.setFailed(error.message);
  }
});

const commandText = (pkg) => {
  const { precommand, command, postcommand } = pkg;
  let text = "";
  if (typeof precommand !== "boolean") {
    text = `${precommand}\n`;
  } else if (typeof command !== "boolean") {
    text = `${command}\n`;
  } else if (typeof postcommand !== "boolean") {
    text = `${postcommand}\n`;
  }
  return text === "" ? "Publish complete." : text;
};
