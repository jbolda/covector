import { pino } from "pino";
import { init } from "./init";
import { add } from "./add";
import { status } from "./status";
import { config } from "./config";
import { version } from "./version";
import { preview } from "./preview";
import { publish } from "./publish";
import { arbitrary } from "./arbitrary";
import { ChangeContext } from "../../types/src";
import { ensure, sleep } from "effection";

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
  const logger = pino(
    {
      name: "covector",
      transport: {
        target: "./logger.mjs",
      },
    }
    // pino.destination({ dest: 1, sync: true })
  );

  if (command === "init") {
    yield init({
      logger: logger.child({ command: "init" }),
      cwd,
      changeFolder,
      yes,
    });
  } else if (command === "add") {
    yield add({
      logger: logger.child({ command: "add" }),
      cwd,
      changeFolder,
      yes,
    });
  } else if (command === "config") {
    yield config({
      logger: logger.child({ command: "config" }),
      cwd,
      modifyConfig,
    });
  } else if (command === "status") {
    yield status({
      logger: logger.child({ command: "status" }),
      command,
      dryRun,
      cwd,
      logs,
      filterPackages,
      modifyConfig,
      branchTag,
    });
  } else if (command === "version") {
    yield version({
      logger: logger.child({ command: "version" }),
      command,
      dryRun,
      cwd,
      filterPackages,
      modifyConfig,
      createContext,
    });
  } else if (command === "preview") {
    yield preview({
      logger: logger.child({ command: "preview" }),
      command,
      dryRun,
      cwd,
      filterPackages,
      modifyConfig,
      previewVersion,
      branchTag,
    });
  } else if (command === "publish") {
    yield publish({
      logger: logger.child({ command: "publish" }),
      command,
      dryRun,
      cwd,
      filterPackages,
      modifyConfig,
    });
  } else {
    yield arbitrary({
      logger: logger.child({ command: "arbitrary" }),
      command,
      dryRun,
      cwd,
      filterPackages,
      modifyConfig,
    });
  }

  yield ensure(() => logger.flush());
  // to ensure all logs are properly flushed
  // (no other method we can await currently)
  yield sleep(200);
}
