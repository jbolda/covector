import { type Logger } from "@covector/types";
import { attemptCommands, confirmCommandsToRun } from "@covector/command";
import {
  configFile,
  readPreFile,
  changeFiles,
  loadChangeFiles,
  readAllPkgFiles,
} from "@covector/files";
import {
  assemble,
  mergeIntoConfig,
  mergeChangesToConfig,
} from "@covector/assemble";
import { apply, changesConsideringParents } from "@covector/apply";

import type {
  CommandsRan,
  Covector,
  PackageFile,
  PkgPublish,
  PkgVersion,
} from "@covector/types";
import { call, type Operation } from "effection";

export function* preview({
  logger,
  command,
  dryRun = false,
  cwd = process.cwd(),
  filterPackages = [],
  modifyConfig = async (c) => c,
  previewVersion = "",
  branchTag = "",
}: {
  logger: Logger;
  command: string;
  dryRun?: boolean;
  cwd?: string;
  filterPackages?: string[];
  modifyConfig?: (c: any) => Promise<any>;
  previewVersion?: string;
  branchTag?: string;
}): Operation<Covector> {
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

  const versionChanges = changesConsideringParents({
    assembledPlan,
    config,
    allPackages,
    prereleaseIdentifier,
  });

  const { commands: versionCommands }: { commands: PkgVersion[] } =
    yield* mergeChangesToConfig({
      logger,
      assembledChanges: versionChanges,
      config,
      command: "version",
      dryRun,
      filterPackages,
    });

  const pkgCommandsRan = Object.keys(config.packages).reduce((pkgs, pkg) => {
    pkgs[pkg] = {
      precommand: false,
      command: false,
      postcommand: false,
      applied: false,
    };
    return pkgs;
  }, {} as CommandsRan);

  const versionpreCommandsRan = yield* attemptCommands({
    logger,
    cwd,
    commands: versionCommands,
    commandPrefix: "pre",
    command: "version",
    pkgCommandsRan,
    dryRun,
  });

  const applied = yield* apply({
    logger,
    commands: versionCommands,
    allPackages,
    cwd,
    bump: !dryRun,
    previewVersion,
    prereleaseIdentifier,
  });

  const pkgCommandsWithResults = applied.reduce((pkgs, result) => {
    if (result?.name) pkgs[result.name].applied = result;
    return pkgs;
  }, versionpreCommandsRan);

  const versionPostCommandsRan = yield* attemptCommands({
    logger,
    cwd,
    commands: versionCommands,
    commandPrefix: "post",
    command: "version",
    pkgCommandsRan: pkgCommandsWithResults,
    dryRun,
  });

  const { commands: publishCommands } = yield* mergeIntoConfig({
    logger,
    assembledPlan,
    config,
    command: "publish",
    cwd,
    dryRun,
    filterPackages,
    tag: branchTag,
  });

  if (publishCommands.length === 0) {
    logger.info(`No commands configured to run on publish.`);
    return {
      response: `No commands configured to run on publish.`,
    };
  }

  const commandsToRun = yield* confirmCommandsToRun({
    logger,
    cwd,
    commands: publishCommands,
    command: "publish",
  });

  const publishCommandsRan = publishCommands.reduce((pkgs, pkg) => {
    pkgs[pkg.pkg] = {
      precommand: false,
      command: false,
      postcommand: false,
      pkg,
    };
    return pkgs;
  }, {} as CommandsRan);

  const preCommandsAttempted = yield* attemptCommands({
    logger,
    cwd,
    commands: commandsToRun,
    commandPrefix: "pre",
    command: "publish",
    pkgCommandsRan: publishCommandsRan,
    dryRun,
  });

  const commandsAttempted = yield* attemptCommands({
    logger,
    cwd,
    commands: commandsToRun,
    command: "publish",
    pkgCommandsRan: preCommandsAttempted,
    dryRun,
  });

  return { commandsRan: commandsAttempted, pipeTemplate: publishCommands };
}
