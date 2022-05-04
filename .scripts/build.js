const { run } = require("effection");
const { exec } = require("@effection/process");

module.exports = async () => {
  await run(execBuild());
};

function* execBuild() {
  yield exec("npm run build").expect();
}
