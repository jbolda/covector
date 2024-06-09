import { type Logger } from "@covector/types";
import {
  attemptCommands,
  confirmCommandsToRun,
  raceTime,
} from "@covector/command";
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
}): Generator<any, Covector, any> {
  const config = yield modifyConfig(yield configFile({ cwd }));
  const pre = yield readPreFile({ cwd, changeFolder: config.changeFolder });
  const prereleaseIdentifier = !pre ? null : pre.tag;

  const changesPaths = yield changeFiles({
    cwd,
    changeFolder: config.changeFolder,
  });
  const changeFilesLoaded = yield loadChangeFiles({
    cwd,
    paths: changesPaths,
  });
  const assembledChanges = yield assemble({
    logger,
    cwd,
    files: changeFilesLoaded,
    config,
    preMode: { on: !!pre, prevFiles: !pre ? [] : pre.changes },
  });
  const allPackages: Record<string, PackageFile> = yield readAllPkgFiles({
    config,
    cwd,
  });

  yield raceTime({ t: config.timeout });

  const versionChanges = changesConsideringParents({
    assembledChanges,
    config,
    allPackages,
    prereleaseIdentifier,
  });

  const { commands: versionCommands }: { commands: PkgVersion[] } =
    yield mergeChangesToConfig({
      logger,
      assembledChanges: versionChanges,
      config,
      command: "version",
      dryRun,
      filterPackages,
      cwd,
    });

  let pkgCommandsRan: CommandsRan = Object.keys(config.packages).reduce(
    (
      pkgs: {
        [k: string]: {
          precommand: string | false;
          command: string | false;
          postcommand: string | false;
          applied: string | false;
        };
      },
      pkg: string
    ) => {
      pkgs[pkg] = {
        precommand: false,
        command: false,
        postcommand: false,
        applied: false,
      };
      return pkgs;
    },
    {}
  );

  pkgCommandsRan = yield attemptCommands({
    logger,
    cwd,
    commands: versionCommands,
    commandPrefix: "pre",
    command: "version",
    pkgCommandsRan,
    dryRun,
  });

  const applied = yield apply({
    //@ts-expect-error
    commands: versionCommands,
    allPackages,
    cwd,
    bump: !dryRun,
    previewVersion,
    prereleaseIdentifier,
  });

  pkgCommandsRan = applied.reduce(
    (
      pkgs: {
        [k: string]: {
          precommand: boolean;
          command: boolean;
          postcommand: boolean;
          applied: object;
        };
      },
      result: { name: string }
    ) => {
      pkgs[result.name].applied = result;
      return pkgs;
    },
    pkgCommandsRan
  );

  pkgCommandsRan = yield attemptCommands({
    logger,
    cwd,
    commands: versionCommands,
    commandPrefix: "post",
    command: "version",
    pkgCommandsRan,
    dryRun,
  });

  const { commands: publishCommands }: { commands: PkgPublish[] } =
    yield mergeIntoConfig({
      logger,
      assembledChanges,
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

  const commandsToRun: PkgPublish[] = yield confirmCommandsToRun({
    logger,
    cwd,
    commands: publishCommands,
    command: "publish",
  });

  pkgCommandsRan = publishCommands.reduce(
    (pkgs: any, pkg: { pkg: string }): object => {
      pkgs[pkg.pkg] = {
        precommand: false,
        command: false,
        postcommand: false,
        pkg,
      };
      return pkgs;
    },
    {}
  );

  pkgCommandsRan = yield attemptCommands({
    logger,
    cwd,
    commands: commandsToRun,
    commandPrefix: "pre",
    command: "publish",
    pkgCommandsRan,
    dryRun,
  });

  pkgCommandsRan = yield attemptCommands({
    logger,
    cwd,
    commands: commandsToRun,
    command: "publish",
    pkgCommandsRan,
    dryRun,
  });

  return { commandsRan: pkgCommandsRan, pipeTemplate: publishCommands };
}
