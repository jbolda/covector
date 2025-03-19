#!/usr/bin/env node
import { main } from "effection";
import { cli } from "covector";

main(function* start() {
  yield* cli(process.argv.slice(2));
});
