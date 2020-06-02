const core = require("@actions/core");
const github = require("@actions/github");
const { covector } = require("../covector");

try {
  const command = core.getInput("command");
  console.log = core.debug;
  let commandToRun = command;
  if (command === "version-or-publish") {
    if (covector({ command: "status" }) === "No changes.") {
      commandToRun = "publish";
    } else {
      commandToRun = "version";
    }
  }
  const covectored = covector({ command: commandToRun });
  core.setOutput("change", covectored);
  const payload = JSON.stringify(c, undefined, 2);
  console.log(`The covector output: ${payload}`);
} catch (error) {
  core.setFailed(error.message);
}
