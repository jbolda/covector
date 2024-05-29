import { init } from "./init";
import { add } from "./add";
import { status } from "./status";
import { config } from "./config";
import { version } from "./version";
import { preview } from "./preview";
import { publish } from "./publish";
import { arbitrary } from "./arbitrary";
import { ChangeContext } from "../../types/src";

export function* covector({
  // shared
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
  command: string;
  dryRun?: boolean;
  logs?: boolean;
  cwd?: string;
  filterPackages?: string[];
  modifyConfig?: (c: any) => Promise<any>;
  previewVersion?: string;
  branchTag?: string;
  changeFolder?: string;
  yes?: boolean;
  createContext?: ChangeContext;
}): Generator<any, any, any> {
  if (command === "init") {
    return yield init({ cwd, changeFolder, yes });
  } else if (command === "add") {
    return yield add({ cwd, changeFolder, yes });
  } else if (command === "config") {
    return yield config({ cwd, modifyConfig });
  } else if (command === "status") {
    return yield status({
      command,
      dryRun,
      cwd,
      logs,
      filterPackages,
      modifyConfig,
      branchTag,
    });
  } else if (command === "version") {
    return yield version({
      command,
      dryRun,
      cwd,
      filterPackages,
      modifyConfig,
      createContext,
    });
  } else if (command === "preview") {
    return yield preview({
      command,
      dryRun,
      cwd,
      filterPackages,
      modifyConfig,
      previewVersion,
      branchTag,
    });
  } else if (command === "publish") {
    return yield publish({
      command,
      dryRun,
      cwd,
      filterPackages,
      modifyConfig,
    });
  } else {
    return yield arbitrary({
      command,
      dryRun,
      cwd,
      filterPackages,
      modifyConfig,
    });
  }
}
