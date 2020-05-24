const { cli } = require("./cli");
const { main } = require("@effection/node");

main(function* boot() {
  yield cli(process.argv.slice(2));
});
