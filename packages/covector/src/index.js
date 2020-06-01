const { cli } = require("./cli");
const { main } = require("@effection/node");

const run = require("./run");

main(function* start() {
  yield cli(process.argv.slice(2), run);
});

module.exports.convector = run;
