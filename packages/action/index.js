const core = require("@actions/core");
const github = require("@actions/github");
const { covector } = require("../covector");

async function run() {
  try {
    const inputCommand = core.getInput("command");
    let command = inputCommand;
    if (inputCommand === "version-or-publish") {
      if (covector({ command: "status" }) === "No changes.") {
        command = "publish";
      } else {
        command = "version";
      }
    }
    const covectored = covector({ command });
    core.setOutput("change", covectored);
    const payload = JSON.stringify(covectored, undefined, 2);
    console.log(`The covector output: ${payload}`);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
