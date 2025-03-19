import { type Logger } from "@covector/types";
import { confirmCommandsToRun } from "@covector/command";
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
import {
  apply,
  changesConsideringParents,
  validateApply,
} from "@covector/apply";

import type { CovectorStatus, PackageFile } from "@covector/types";
import { call, type Operation } from "effection";

export function* status({
  logger,
  command,
  dryRun = false,
  cwd = process.cwd(),
  filterPackages = [],
  modifyConfig = async (c) => c,
  branchTag = "",
  logs = true,
}: {
  logger: Logger;
  command: string;
  dryRun?: boolean;
  cwd?: string;
  filterPackages?: string[];
  modifyConfig?: (c: any) => Promise<any>;
  branchTag?: string;
  logs?: boolean;
}): Operation<CovectorStatus> {
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
    logger: logger.child({ step: "assemble changes" }),
    cwd,
    files: changeFilesLoaded,
    config,
    preMode: { on: !!pre, prevFiles: !pre ? [] : pre.changes },
  });

  if (changeFilesLoaded.length === 0) {
    if (logs) logger.info("There are no changes.");

    const { commands: publishCommands } = yield* mergeIntoConfig({
      logger: logger.child({ step: "assemble changes" }),
      assembledPlan,
      config,
      command: "publish",
      cwd,
      dryRun,
      filterPackages,
      tag: branchTag,
    });

    if (publishCommands.length === 0) {
      if (logs) logger.info(`No commands configured to run on publish.`);
      return {
        config,
        response: `No commands configured to run on publish.`,
        pkgReadyToPublish: [],
        pkgVersion: [],
      };
    }

    const commandsToRun = yield* confirmCommandsToRun({
      logger: logger.child({ step: "assemble changes" }),
      cwd,
      commands: publishCommands,
      command: "publish",
    });

    if (commandsToRun.length > 0 && logs) {
      logger.info(
        `There ${
          commandsToRun.length === 1
            ? `is 1 package`
            : `is ${commandsToRun.length} packages`
        } ready to publish which includes${commandsToRun.map(
          (pkg) => ` ${pkg.pkg}@${pkg.pkgFile?.version}`
        )}`
      );
    }

    return {
      pkgReadyToPublish: commandsToRun,
      pkgVersion: [],
      config,
      response: "No changes.",
    };
  } else if (!!pre && assembledPlan?.changes?.length === 0) {
    if (logs) {
      logger.info("There are no changes.");
      logger.info({
        msg: "We have previously released the changes in these files:",
        renderAsYAML: changesPaths,
      });
    }
    return {
      pkgReadyToPublish: [],
      pkgVersion: [],
      config,
      response: "No changes.",
    };
  } else {
    if (logs) {
      logger.info("changes:");
      Object.keys(assembledPlan?.releases ?? {}).forEach((release) => {
        logger.info({
          msg: `${release} => ${assembledPlan?.releases?.[release].type}`,
          renderAsYAML: assembledPlan?.releases?.[release].changes,
        });
      });
    }

    const allPackages: Record<string, PackageFile> = yield* readAllPkgFiles({
      config,
      cwd,
    });

    const changes = changesConsideringParents({
      assembledPlan,
      config,
      allPackages,
      prereleaseIdentifier,
    });

    const { commands, pipeTemplate } = yield* mergeChangesToConfig({
      logger: logger.child({ step: "compile changes" }),
      assembledChanges: changes,
      config,
      command,
      dryRun,
      filterPackages,
    });

    // throws if failed validation
    yield* validateApply({
      logger: logger.child({ step: "apply changes" }),
      commands,
      // as the validate ends up mutating
      allPackages: structuredClone(allPackages),
      prereleaseIdentifier,
    });

    const applied = yield* apply({
      logger: logger.child({ step: "apply changes" }),
      commands,
      allPackages,
      cwd,
      bump: false,
      prereleaseIdentifier,
      logs,
    });

    return {
      pkgVersion: commands,
      config,
      applied,
      pipeTemplate: pipeTemplate,
      response: `There are ${
        Object.keys(assembledPlan.releases).length
      } changes which include${Object.keys(assembledPlan.releases).map(
        (release) => ` ${release} with ${assembledPlan.releases[release].type}`
      )}`,
    };
  }
}
