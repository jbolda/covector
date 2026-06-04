import { attemptCommands, confirmCommandsToRun } from "@covector/command";
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

import type { Logger, Covector, CommandsRan } from "@covector/types";
import { call, type Operation } from "effection";

export function* publish({
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
}): Operation<Covector["publish"]> {
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
  const assembledPlan = yield* assemble({
    logger,
    cwd,
    files: changeFilesLoaded,
    config,
    preMode: { on: !!pre, prevFiles: !pre ? [] : pre.changes },
  });

  // yield* raceTime({ t: config.timeout });
  const changelogs = yield* pullLastChangelog({
    logger,
    config,
    cwd,
  });

  const { commands, pipeTemplate } = yield* mergeIntoConfig({
    logger,
    assembledPlan,
    config,
    command,
    cwd,
    dryRun,
    filterPackages,
    changelogs,
  });

  if (dryRun) {
    yield* logger.info({
      msg: "==== commands ready to run ===",
      renderAsYAML: commands,
    });
  }

  if (commands.length === 0) {
    yield* logger.info(`No commands configured to run on [${command}].`);
    return {
      response: `No commands configured to run on [${command}].`,
      commandsRan: {},
      pipeTemplate,
    };
  }

  const commandsToRun = yield* confirmCommandsToRun({
    logger,
    cwd,
    commands,
    command,
  });

  const pkgCommandsRan = commands.reduce((pkgs, pkg) => {
    pkgs[pkg.pkg] = {
      precommand: false,
      command: false,
      postcommand: false,
      pkg,
    };
    return pkgs;
  }, {} as CommandsRan);

  const pkgCommandsPiped = yield* pipeChangelogToCommands({
    changelogs,
    pkgCommandsRan,
  });

  const preCommandsAttempted = yield* attemptCommands({
    logger,
    cwd,
    commands: commandsToRun,
    commandPrefix: "pre",
    command,
    pkgCommandsRan: pkgCommandsPiped,
    dryRun,
  });
  const commandsAttempted = yield* attemptCommands({
    logger,
    cwd,
    commands: commandsToRun,
    command,
    pkgCommandsRan: preCommandsAttempted,
    dryRun,
  });
  const postCommandsRan = yield* attemptCommands({
    logger,
    cwd,
    commands: commandsToRun,
    commandPrefix: "post",
    command,
    pkgCommandsRan: commandsAttempted,
    dryRun,
  });

  if (dryRun) {
    yield* logger.info({ msg: "==== result ===", renderAsYAML: pkgCommandsRan });
  }

  return { response: "complete", commandsRan: postCommandsRan, pipeTemplate };
}
