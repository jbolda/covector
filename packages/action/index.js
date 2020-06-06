const core = require("@actions/core");
const github = require("@actions/github");
const { main } = require("@effection/node");
const { covector } = require("../covector");

main(function* run() {
  try {
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
    core.setOutput("change", covectored);
    const payload = JSON.stringify(covectored, undefined, 2);
    console.log(`The covector output: ${payload}`);
  } catch (error) {
    core.setFailed(error.message);
  }
});
