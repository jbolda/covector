import { type Logger } from "@covector/types";
import { configFile } from "@covector/files";

import type { Covector } from "@covector/types";
import { call } from "effection";

export function* config({
  logger,
  cwd = process.cwd(),
  modifyConfig = async (c) => c,
}: {
  logger: Logger;
  cwd?: string;
  modifyConfig?: (c: any) => Promise<any>;
}): Generator<any, Covector, any> {
  const rawConfig = yield* configFile({ cwd });
  const config = yield* call(() => modifyConfig(rawConfig));
  delete config.file;
  logger.info({ renderAsYAML: config });
  return { response: "config returned" };
}
