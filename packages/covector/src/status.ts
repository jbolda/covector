import type { Logger, Covector } from "@covector/types";
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

import { until, type Operation } from "effection";
import { useAttributes } from "./logger.ts";

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
}): Operation<Covector["status"]> {
  const rawConfig = yield* configFile({ cwd });
  const config = yield* until(modifyConfig(rawConfig));
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
  yield* useAttributes({ step: "assemble changes" });
  const assembledPlan = yield* assemble({
    logger,
    cwd,
    files: changeFilesLoaded,
    config,
    preMode: { on: !!pre, prevFiles: !pre ? [] : pre.changes },
  });
  yield* useAttributes({ step: "" });

  if (changeFilesLoaded.length === 0) {
    if (logs) yield* logger.info("There are no changes.");

    yield* useAttributes({ step: "assemble changes" });
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
    yield* useAttributes({ step: "" });

    if (publishCommands.length === 0) {
      if (logs) yield* logger.info(`No commands configured to run on publish.`);
      return {
        config,
        response: `No commands configured to run on publish.`,
        pkgReadyToPublish: [],
        pkgVersion: [],
      };
    }

    yield* useAttributes({ step: "assemble changes" });
    const commandsToRun = yield* confirmCommandsToRun({
      logger,
      cwd,
      commands: publishCommands,
      command: "publish",
    });
    yield* useAttributes({ step: "" });

    if (commandsToRun.length > 0 && logs) {
      yield* logger.info(
        `There ${
          commandsToRun.length === 1
            ? `is 1 package`
            : `is ${commandsToRun.length} packages`
        } ready to publish which includes${commandsToRun.map(
          (pkg: any) => ` ${pkg.pkg}@${pkg.pkgFile?.version}`,
        )}`,
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
      yield* logger.info("There are no changes.");
      yield* logger.info({
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
      yield* logger.info("changes:");
      for (const release of Object.keys(assembledPlan?.releases ?? {})) {
        yield* logger.info({
          msg: `${release} => ${assembledPlan?.releases?.[release].type}`,
          renderAsYAML: assembledPlan?.releases?.[release].changes,
        });
      }
    }

    const allPackages = yield* readAllPkgFiles({
      config,
      cwd,
    });
    const allPackagesForValidation = yield* readAllPkgFiles({
      config,
      cwd,
    });

    const changes = changesConsideringParents({
      assembledPlan,
      config,
      allPackages,
      prereleaseIdentifier,
    });

    yield* useAttributes({ step: "compile changes" });
    const { commands, pipeTemplate } = yield* mergeChangesToConfig({
      logger,
      assembledChanges: changes,
      config,
      command,
      dryRun,
      filterPackages,
    });
    yield* useAttributes({ step: "" });

    // throws if failed validation
    yield* useAttributes({ step: "apply changes" });
    yield* validateApply({
      logger,
      commands,
      // as the validate ends up mutating
      allPackages: allPackagesForValidation,
      prereleaseIdentifier,
    });

    const applied = yield* apply({
      logger,
      commands,
      allPackages,
      cwd,
      bump: false,
      prereleaseIdentifier,
      logs,
    });
    yield* useAttributes({ step: "" });

    return {
      pkgVersion: commands,
      config,
      applied,
      pipeTemplate: pipeTemplate,
      response: `There are ${
        Object.keys(assembledPlan.releases).length
      } changes which include${Object.keys(assembledPlan.releases).map(
        (release) => ` ${release} with ${assembledPlan.releases[release].type}`,
      )}`,
    };
  }
}
