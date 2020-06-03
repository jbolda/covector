#!/usr/bin/env node
const { main } = require("@effection/node");
const { cli, run } = require("covector");

main(function* start() {
  yield cli(process.argv.slice(2), run);
});
