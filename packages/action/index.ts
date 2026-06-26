import { main, type Operation } from "effection";
import { run } from "./src/index.ts";
import { logger } from "covector";
import { actionAround } from "./src/logger.ts";

await main(function* (): Operation<void> {
  yield* logger.around(actionAround, { at: "min" });
  yield* run(logger.operations);
});
