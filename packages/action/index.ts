import { main } from "effection";
import { run } from "./src/index.ts";
import { pino } from "pino";
import logStream from "./src/logger.ts";

const stream = logStream();
const logger = pino(stream);
await main(function* () {
  run(logger);
});
