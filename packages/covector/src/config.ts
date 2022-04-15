import { configFile } from "@covector/files";

import type { Covector } from "@covector/types";

export function* config({
  cwd = process.cwd(),
  modifyConfig = async (c) => c,
}: {
  cwd?: string;
  modifyConfig?: (c: any) => Promise<any>;
}): Generator<any, Covector, any> {
  let config = yield modifyConfig(yield configFile({ cwd }));
  delete config.file;
  console.dir(config);
  return { response: "config returned" };
}
