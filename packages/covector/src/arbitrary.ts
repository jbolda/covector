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
import { call } from "effection";

export function* arbitrary({
  logger,
  command,
  dryRun = false,
  cwd = process.cwd(),
  filterPackages = [],
  modifyConfig = async (c) => c,
}: {
  logger: Logger;
  command: string;
  dryRun?: boolean;
  cwd?: string;
  filterPackages?: string[];
  modifyConfig?: (c: any) => Promise<any>;
}): Generator<any, Covector, any> {
  const rawConfig = yield* configFile({ cwd });
  const config = yield* call(() => modifyConfig(rawConfig));
  const pre = yield* readPreFile({ cwd, changeFolder: config.changeFolder });

  const changesPaths = yield* changeFiles({
    cwd,
    changeFolder: config.changeFolder,
  });
  const changeFilesLoaded = yield* loadChangeFiles({
    cwd,
    paths: changesPaths,
  });
  const assembledChanges = yield* assemble({
    logger,
    cwd,
    files: changeFilesLoaded,
    config,
    preMode: { on: !!pre, prevFiles: !pre ? [] : pre.changes },
  });

  yield* raceTime({ t: config.timeout });
  const changelogs = yield* pullLastChangelog({
    logger,
    config,
    cwd,
  });

  const {
    commands,
    pipeTemplate,
  }: { commands: PkgPublish[]; pipeTemplate: any } = yield* mergeIntoConfig({
    logger,
    assembledChanges,
    config,
    command,
    cwd,
    dryRun,
    filterPackages,
    changelogs,
  });

  if (dryRun) {
    logger.info({
      msg: "==== commands ready to run ===",
      renderAsYAML: commands,
    });
  }

  if (commands.length === 0) {
    logger.info(`No commands configured to run on [${command}].`);
    return {
      response: `No commands configured to run on [${command}].`,
    };
  }

  const commandsToRun: PkgPublish[] = yield* confirmCommandsToRun({
    logger,
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

  pkgCommandsRan = yield* pipeChangelogToCommands({
    changelogs,
    pkgCommandsRan,
  });

  pkgCommandsRan = yield* attemptCommands({
    logger,
    cwd,
    commands: commandsToRun,
    commandPrefix: "pre",
    command,
    pkgCommandsRan,
    dryRun,
  });
  pkgCommandsRan = yield* attemptCommands({
    logger,
    cwd,
    commands: commandsToRun,
    command,
    pkgCommandsRan,
    dryRun,
  });
  pkgCommandsRan = yield* attemptCommands({
    logger,
    cwd,
    commands: commandsToRun,
    commandPrefix: "post",
    command,
    pkgCommandsRan,
    dryRun,
  });

  if (dryRun) {
    logger.info({ msg: "==== result ===", renderAsYAML: pkgCommandsRan });
  }

  return <CovectorPublish>{ commandsRan: pkgCommandsRan, pipeTemplate };
}
