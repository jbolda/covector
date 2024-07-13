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
import { cloneDeep } from "lodash";

import type {
  CovectorStatus,
  Covector,
  PkgPublish,
  PackageFile,
  PkgVersion,
  Config,
} from "@covector/types";

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
}): Generator<any, Covector, any> {
  const config: Config = yield modifyConfig(yield configFile({ cwd }));
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
    logger: logger.child({ step: "assemble changes" }),
    cwd,
    files: changeFilesLoaded,
    config,
    preMode: { on: !!pre, prevFiles: !pre ? [] : pre.changes },
  });

  if (changeFilesLoaded.length === 0) {
    if (logs) logger.info("There are no changes.");

    const { commands: publishCommands }: { commands: PkgPublish[] } =
      yield mergeIntoConfig({
        logger: logger.child({ step: "assemble changes" }),
        assembledChanges,
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
        response: `No commands configured to run on publish.`,
        pkgReadyToPublish: [],
      };
    }

    const commandsToRun: PkgPublish[] = yield confirmCommandsToRun({
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

    return <CovectorStatus>{
      pkgReadyToPublish: commandsToRun,
      config,
      response: "No changes.",
    };
  } else if (!!pre && assembledChanges?.changes?.length === 0) {
    if (logs) {
      logger.info("There are no changes.");
      logger.info({
        msg: "We have previously released the changes in these files:",
        renderAsYAML: changesPaths,
      });
    }
    return { pkgReadyToPublish: [], response: "No changes." };
  } else {
    if (logs) {
      logger.info("changes:");
      Object.keys(assembledChanges.releases).forEach((release) => {
        logger.info({
          msg: `${release} => ${assembledChanges.releases[release].type}`,
          renderAsYAML: assembledChanges.releases[release].changes,
        });
      });
    }

    const allPackages: Record<string, PackageFile> = yield readAllPkgFiles({
      config,
      cwd,
    });

    const changes = changesConsideringParents({
      assembledChanges,
      config,
      allPackages,
      prereleaseIdentifier,
    });

    const {
      commands,
      pipeTemplate,
    }: { commands: PkgVersion[]; pipeTemplate: any } =
      yield mergeChangesToConfig({
        logger: logger.child({ step: "compile changes" }),
        assembledChanges: changes,
        config,
        command,
        dryRun,
        filterPackages,
        cwd,
      });

    // throws if failed validation
    yield validateApply({
      logger: logger.child({ step: "apply changes" }),
      //@ts-expect-error
      commands,
      // as the validate ends up mutating
      allPackages: cloneDeep(allPackages),
      prereleaseIdentifier,
    });

    const applied = yield apply({
      logger: logger.child({ step: "apply changes" }),
      //@ts-expect-error
      commands,
      config,
      allPackages,
      cwd,
      bump: false,
      prereleaseIdentifier,
      logs,
    });

    return <CovectorStatus>{
      pkgVersion: commands,
      config,
      applied,
      pipeTemplate: pipeTemplate,
      response: `There are ${
        Object.keys(assembledChanges.releases).length
      } changes which include${Object.keys(assembledChanges.releases).map(
        (release) =>
          ` ${release} with ${assembledChanges.releases[release].type}`
      )}`,
    };
  }
}
