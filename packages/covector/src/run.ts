import type { ChangeContext, Covector } from "@covector/types";
import { type Operation } from "effection";
import type { Logger } from "@covector/types";
import { init } from "./init.ts";
import { add } from "./add.ts";
import { status } from "./status.ts";
import { config } from "./config.ts";
import { version } from "./version.ts";
import { preview } from "./preview.ts";
import { publish } from "./publish.ts";
import { arbitrary } from "./arbitrary.ts";
import { useAttributes } from "./logger.ts";

export function* covector<C extends keyof Covector>({
  // shared
  logger,
  command,
  cwd = process.cwd(),
  logs = true,
  // usage inputs
  dryRun = false,
  filterPackages = [],
  modifyConfig = async (c) => c,
  previewVersion = "",
  branchTag = "",
  // setup inputs
  changeFolder = ".changes",
  yes = false,
  createContext,
}: {
  logger: Logger;
  command: C;
  dryRun?: boolean;
  logs?: boolean;
  cwd?: string;
  filterPackages?: string[];
  modifyConfig?: (c: any) => Promise<any>;
  previewVersion?: string;
  branchTag?: string;
  changeFolder?: string;
  yes?: boolean;
  createContext?: ChangeContext<any>;
}): Operation<Covector[C]> {
  // TS isn't playing nice with the intesection, this return type is appropriate for downstream consumers
  // but TS is not happy with it. It expects the returns of each function to match the full intersection
  // of Covector[C], but they don't. So we cast to unknown and then to the appropriate type.
  // The cast hurts type safety, but we ensure the types at the function level, so it's okay.
  if (command === "init") {
    yield* useAttributes({ name: "init" });
    return yield* init({
      logger,
      cwd,
      changeFolder,
      yes,
    }) as unknown as Operation<Covector[C]>;
  } else if (command === "add") {
    yield* useAttributes({ name: "add" });
    return yield* add({
      logger,
      cwd,
      changeFolder,
      yes,
    }) as unknown as Operation<Covector[C]>;
  } else if (command === "config") {
    yield* useAttributes({ name: "config" });
    return yield* config({
      logger,
      cwd,
      modifyConfig,
    }) as unknown as Operation<Covector[C]>;
  } else if (command === "status") {
    yield* useAttributes({ name: "status" });
    return yield* status({
      logger,
      command,
      dryRun,
      cwd,
      logs,
      filterPackages,
      modifyConfig,
      branchTag,
    }) as unknown as Operation<Covector[C]>;
  } else if (command === "version") {
    yield* useAttributes({ name: "version" });
    return yield* version({
      logger,
      command,
      dryRun,
      cwd,
      filterPackages,
      modifyConfig,
      createContext,
    }) as unknown as Operation<Covector[C]>;
  } else if (command === "preview") {
    yield* useAttributes({ name: "preview" });
    return yield* preview({
      logger,
      command,
      dryRun,
      cwd,
      filterPackages,
      modifyConfig,
      previewVersion,
      branchTag,
    }) as unknown as Operation<Covector[C]>;
  } else if (command === "publish") {
    yield* useAttributes({ name: "publish" });
    return yield* publish({
      logger,
      command,
      dryRun,
      cwd,
      filterPackages,
      modifyConfig,
    }) as unknown as Operation<Covector[C]>;
  } else {
    yield* useAttributes({ name: "arbitrary" });
    return yield* arbitrary({
      logger,
      command,
      dryRun,
      cwd,
      filterPackages,
      modifyConfig,
    }) as unknown as Operation<Covector[C]>;
  }
}
