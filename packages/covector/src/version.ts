import { attemptCommands, raceTime } from "@covector/command";
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
  CommandsRan,
  CovectorVersion,
  Covector,
  PkgVersion,
  PackageFile,
} from "@covector/types";
import { Operation } from "effection";

export function* version({
  command,
  dryRun = false,
  cwd = process.cwd(),
  filterPackages = [],
  modifyConfig = async (c) => c,
}: {
  command: string;
  dryRun?: boolean;
  cwd?: string;
  filterPackages?: string[];
  modifyConfig?: (c: any) => Promise<any>;
}): Operation<Covector> {
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
  const allPackages: Record<string, PackageFile> = yield readAllPkgFiles({
    config,
    cwd,
  });

  yield raceTime({ t: config.timeout });
  const changes = changesConsideringParents({
    assembledChanges,
    config,
    allPackages,
    prereleaseIdentifier,
  });

  const {
    commands,
    pipeTemplate,
  }: {
    commands: PkgVersion[];
    pipeTemplate: any;
  } = yield mergeChangesToConfig({
    assembledChanges: changes,
    config,
    command,
    dryRun,
    filterPackages,
    cwd,
  });
  if (dryRun) {
    console.log("==== commands ready to run ===");
    console.log(commands);
  }

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
    commands,
    commandPrefix: "pre",
    command,
    pkgCommandsRan,
    dryRun,
  });

  const applied = yield apply({
    //@ts-ignore
    commands,
    config,
    allPackages,
    cwd,
    bump: !dryRun,
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

  pkgCommandsRan = yield fillChangelogs({
    applied,
    //@ts-ignore
    assembledChanges: changes,
    config,
    cwd,
    pkgCommandsRan,
    create: !dryRun,
  });

  pkgCommandsRan = yield attemptCommands({
    cwd,
    commands,
    commandPrefix: "post",
    command,
    pkgCommandsRan,
    dryRun,
  });
  console.dir({ applied, pkgCommandsRan }, { depth: 6 });

  if (command === "version" && !dryRun) {
    if (pre) {
      pre.changes = changesPaths;
      yield writePreFile({ preFile: pre, cwd });
    } else {
      yield changeFilesRemove({ cwd, paths: changesPaths });
    }
  }

  if (dryRun) {
    console.log("==== result ===");
    console.dir(pkgCommandsRan);
  }

  return <CovectorVersion>{ commandsRan: pkgCommandsRan, pipeTemplate };
}
