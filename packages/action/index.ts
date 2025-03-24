import { main, type Operation } from "effection";
import { run } from "./src/index.ts";
import { pino } from "pino";
import logStream from "./src/logger.ts";

const stream = logStream();
const logger = pino(stream);
await main(() => run(logger) as Operation<void>);
