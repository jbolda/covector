import { attemptCommands } from "@covector/command";
import {
  configFile,
  readPreFile,
  changeFiles,
  loadChangeFiles,
  changeFilesRemove,
  writePreFile,
  readAllPkgFiles,
} from "@covector/files";
import { assemble, mergeChangesToConfig } from "@covector/assemble";
import { fillChangelogs } from "@covector/changelog";
import { apply, changesConsideringParents } from "@covector/apply";

import type {
  Logger,
  Covector,
  CommandsRan,
  ChangeContext,
  ConfigFile,
} from "@covector/types";
import { call, Operation } from "effection";

export function* version({
  logger,
  command,
  dryRun = false,
  cwd = process.cwd(),
  filterPackages = [],
  modifyConfig = async (c) => c,
  createContext,
}: {
  logger: Logger;
  command: string;
  dryRun?: boolean;
  cwd?: string;
  filterPackages?: string[];
  modifyConfig?: (c: ConfigFile) => Promise<ConfigFile>;
  createContext?: ChangeContext<any>;
}): Operation<Covector["version"]> {
  const rawConfig = yield* configFile({ cwd });
  const config = yield* call(() => modifyConfig(rawConfig));
  const pre = yield* readPreFile({ cwd, changeFolder: config.changeFolder });
  const prereleaseIdentifier = !pre ? undefined : pre.tag;

  const changesPaths = yield* changeFiles({
    cwd,
    changeFolder: config.changeFolder,
  });
  const changeFilesLoaded = yield* loadChangeFiles({
    cwd,
    paths: changesPaths,
  });
  const assembledPlan = yield* assemble({
    logger,
    cwd,
    files: changeFilesLoaded,
    config,
    preMode: { on: !!pre, prevFiles: !pre ? [] : pre.changes },
  });
  const allPackages = yield* readAllPkgFiles({
    config,
    cwd,
  });

  // yield* raceTime({ t: config.timeout });
  const changes = changesConsideringParents({
    assembledPlan,
    config,
    allPackages,
    prereleaseIdentifier,
  });

  const { commands, pipeTemplate } = yield* mergeChangesToConfig({
    logger,
    assembledChanges: changes,
    config,
    command,
    dryRun,
    filterPackages,
  });
  if (dryRun) {
    yield* logger.info({
      msg: "==== commands ready to run ===",
      renderAsYAML: commands,
    });
  }

  const pkgCommandsRan = Object.keys(config.packages).reduce((pkgs, pkg) => {
    pkgs[pkg] = {
      precommand: false,
      command: false,
      postcommand: false,
      applied: false,
    };
    return pkgs;
  }, {} as CommandsRan);

  const pkgCommandsAttempted = yield* attemptCommands({
    logger,
    cwd,
    commands,
    commandPrefix: "pre",
    command,
    pkgCommandsRan,
    dryRun,
  });

  const applied = yield* apply({
    logger,
    commands,
    allPackages,
    cwd,
    bump: !dryRun,
    prereleaseIdentifier,
  });

  const pkgCommandsWithResults = applied.reduce((pkgs, result) => {
    if (result?.name) pkgs[result.name].applied = result;
    return pkgs;
  }, pkgCommandsAttempted);

  const commandsWithChangelogs = yield* fillChangelogs({
    logger,
    applied,
    assembledChanges: changes,
    config,
    cwd,
    pkgCommandsRan: pkgCommandsWithResults,
    createContext,
    create: !dryRun,
  });

  const commandsRan = yield* attemptCommands({
    logger,
    cwd,
    commands,
    commandPrefix: "post",
    command,
    pkgCommandsRan: commandsWithChangelogs,
    dryRun,
  });

  if (command === "version" && !dryRun) {
    if (pre) {
      pre.changes = changesPaths;
      yield* writePreFile({ preFile: pre, cwd });
    } else {
      yield* changeFilesRemove({ logger, cwd, paths: changesPaths });
    }
  }

  if (dryRun) {
    yield* logger.info({
      msg: "==== result ===",
      renderAsYAML: pkgCommandsRan,
    });
  }

  return { commandsRan, pipeTemplate, response: "complete" };
}
