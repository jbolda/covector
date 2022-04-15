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
import { assemble, mergeIntoConfig } from "@covector/assemble";
import {
  pullLastChangelog,
  pipeChangelogToCommands,
} from "@covector/changelog";

import type {
  CommandsRan,
  CovectorPublish,
  Covector,
  PkgPublish,
} from "@covector/types";

export function* publish({
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
}): Generator<any, Covector, any> {
  const config = yield modifyConfig(yield configFile({ cwd }));
  const pre = yield readPreFile({ cwd, changeFolder: config.changeFolder });

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
  const changelogs = yield pullLastChangelog({
    config,
    cwd,
  });

  const {
    commands,
    pipeTemplate,
  }: { commands: PkgPublish[]; pipeTemplate: any } = yield mergeIntoConfig({
    assembledChanges,
    config,
    command,
    cwd,
    dryRun,
    filterPackages,
    changelogs,
  });

  if (dryRun) {
    console.log("==== commands ready to run ===");
    console.log(commands);
  }

  if (commands.length === 0) {
    console.log(`No commands configured to run on [${command}].`);
    return {
      response: `No commands configured to run on [${command}].`,
    };
  }

  const commandsToRun: PkgPublish[] = yield confirmCommandsToRun({
    cwd,
    commands,
    command,
  });

  let pkgCommandsRan: CommandsRan = commands.reduce(
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

  pkgCommandsRan = yield pipeChangelogToCommands({
    changelogs,
    pkgCommandsRan,
  });

  pkgCommandsRan = yield attemptCommands({
    cwd,
    commands: commandsToRun,
    commandPrefix: "pre",
    command,
    pkgCommandsRan,
    dryRun,
  });
  pkgCommandsRan = yield attemptCommands({
    cwd,
    commands: commandsToRun,
    command,
    pkgCommandsRan,
    dryRun,
  });
  pkgCommandsRan = yield attemptCommands({
    cwd,
    commands: commandsToRun,
    commandPrefix: "post",
    command,
    pkgCommandsRan,
    dryRun,
  });

  if (dryRun) {
    console.log("==== result ===");
    console.log(pkgCommandsRan);
  }

  return <CovectorPublish>{ commandsRan: pkgCommandsRan, pipeTemplate };
}
