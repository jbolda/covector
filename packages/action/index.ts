import { main } from "effection";
import { run } from "./src";
import { pino } from "pino";
import logStream from "./src/logger";

const stream = logStream();
const logger = pino(stream);
main(run(logger));
