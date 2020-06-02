const core = require("@actions/core");
const github = require("@actions/github");
// const { covector } = require("../covector");

function* run() {
  try {
    console.log("place 1");
    const inputCommand = core.getInput("command");
    console.log("place 2");
    let command = inputCommand;
    console.log("place 3");
    // if (inputCommand === "version-or-publish") {
    //   if (yield covector({ command: "status" }) === "No changes.") {
    //     command = "publish";
    //   } else {
    //     command = "version";
    //   }
    // }
    console.log("place 4");
    // const covectored = yield covector({ command });
    const covectored = { stuff: "things" };
    console.log("place 5");
    core.setOutput("change", covectored);
    console.log("place 6");
    const payload = JSON.stringify(covectored, undefined, 2);
    console.log(`The covector output: ${payload}`);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();

export default run;
