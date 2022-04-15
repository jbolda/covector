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
} from "@covector/files";
import {
  assemble,
  mergeIntoConfig,
  mergeChangesToConfig,
} from "@covector/assemble";
import { apply, changesConsideringParents } from "@covector/apply";

import type { CommandsRan, Covector, PkgPublish } from "@covector/types";

export function* preview({
  command,
  dryRun = false,
  cwd = process.cwd(),
  filterPackages = [],
  modifyConfig = async (c) => c,
  previewVersion = "",
  branchTag = "",
}: {
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
    cwd,
    files: changeFilesLoaded,
    config,
    preMode: { on: !!pre, prevFiles: !pre ? [] : pre.changes },
  });

  yield raceTime({ t: config.timeout });

  const versionChanges = changesConsideringParents({
    assembledChanges,
    config,
    prereleaseIdentifier,
  });

  const { commands: versionCommands } = yield mergeChangesToConfig({
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
    cwd,
    commands: versionCommands,
    commandPrefix: "pre",
    command: "version",
    pkgCommandsRan,
    dryRun,
  });

  const applied = yield apply({
    commands: versionCommands,
    config,
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
    cwd,
    commands: versionCommands,
    commandPrefix: "post",
    command: "version",
    pkgCommandsRan,
    dryRun,
  });

  const { commands: publishCommands }: { commands: PkgPublish[] } =
    yield mergeIntoConfig({
      assembledChanges,
      config,
      command: "publish",
      cwd,
      dryRun,
      filterPackages,
      tag: branchTag,
    });

  if (publishCommands.length === 0) {
    console.log(`No commands configured to run on publish.`);
    return {
      response: `No commands configured to run on publish.`,
    };
  }

  const commandsToRun: PkgPublish[] = yield confirmCommandsToRun({
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
    cwd,
    commands: commandsToRun,
    commandPrefix: "pre",
    command: "publish",
    pkgCommandsRan,
    dryRun,
  });

  pkgCommandsRan = yield attemptCommands({
    cwd,
    commands: commandsToRun,
    command: "publish",
    pkgCommandsRan,
    dryRun,
  });

  return { commandsRan: pkgCommandsRan, pipeTemplate: publishCommands };
}
