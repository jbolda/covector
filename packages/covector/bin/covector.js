#!/usr/bin/env node
const { main } = require("effection");
const { cli, covector } = require("covector");

main(function* start() {
  yield cli(process.argv.slice(2), covector);
});
