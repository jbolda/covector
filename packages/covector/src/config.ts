import { configFile } from "@covector/files";
import type { Logger, Covector } from "@covector/types";
import { until, type Operation } from "effection";

export function* config({
  logger,
  cwd = process.cwd(),
  modifyConfig = async (c) => c,
}: {
  logger: Logger;
  cwd?: string;
  modifyConfig?: (c: any) => Promise<any>;
}): Operation<Covector["config"]> {
  const rawConfig = yield* configFile({ cwd });
  const config = yield* until(modifyConfig(rawConfig));
  delete config.file;
  yield* logger.info({ renderAsYAML: config });
  return { response: "config returned" };
}
