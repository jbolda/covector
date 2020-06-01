const core = require("@actions/core");
const github = require("@actions/github");
const { covector } = require("../covector");

try {
  const command = core.getInput("command");
  //   const c = covector({ command });
  core.setOutput("change", c);
  // Get the JSON webhook payload for the event that triggered the workflow
  const payload = JSON.stringify(github.context.payload, undefined, 2);
  console.log(`The event payload: ${payload}`);
} catch (error) {
  core.setFailed(error.message);
}
