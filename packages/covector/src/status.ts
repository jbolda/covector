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

import type {
  CovectorStatus,
  Covector,
  PkgPublish,
  PackageFile,
  PkgVersion,
} from "@covector/types";

export function* status({
  command,
  dryRun = false,
  cwd = process.cwd(),
  filterPackages = [],
  modifyConfig = async (c) => c,
  branchTag = "",
  logs = true,
}: {
  command: string;
  dryRun?: boolean;
  cwd?: string;
  filterPackages?: string[];
  modifyConfig?: (c: any) => Promise<any>;
  branchTag?: string;
  logs?: boolean;
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

  if (changeFilesLoaded.length === 0) {
    if (logs) console.info("There are no changes.");

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
      if (logs) console.log(`No commands configured to run on publish.`);
      return {
        response: `No commands configured to run on publish.`,
        pkgReadyToPublish: [],
      };
    }

    const commandsToRun: PkgPublish[] = yield confirmCommandsToRun({
      cwd,
      commands: publishCommands,
      command: "publish",
    });

    if (commandsToRun.length > 0 && logs) {
      console.log(
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
      response: "No changes.",
    };
  } else if (!!pre && assembledChanges?.changes?.length === 0) {
    if (logs) {
      console.info("There are no changes.");
      console.log(
        "We have previously released the changes in these files:",
        changesPaths
      );
    }
    return { pkgReadyToPublish: [], response: "No changes." };
  } else {
    if (logs) {
      // write out all of the changes
      // TODO make it pretty
      console.log("changes:");
      Object.keys(assembledChanges.releases).forEach((release) => {
        console.log(`${release} => ${assembledChanges.releases[release].type}`);
        console.dir(assembledChanges.releases[release].changes, { depth: 4 });
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
        assembledChanges: changes,
        config,
        command,
        dryRun,
        filterPackages,
        cwd,
      });

    // throws if failed validation
    yield validateApply({
      //@ts-expect-error
      commands,
      allPackages,
      prereleaseIdentifier,
    });

    const applied = yield apply({
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
