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
import { changesConsideringParents, validateApply } from "@covector/apply";

import type {
  CovectorStatus,
  Covector,
  PkgPublish,
  PackageFile,
} from "@covector/types";

export function* status({
  command,
  dryRun = false,
  cwd = process.cwd(),
  filterPackages = [],
  modifyConfig = async (c) => c,
  branchTag = "",
}: {
  command: string;
  dryRun?: boolean;
  cwd?: string;
  filterPackages?: string[];
  modifyConfig?: (c: any) => Promise<any>;
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

  if (changeFilesLoaded.length === 0) {
    console.info("There are no changes.");

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
        pkgReadyToPublish: [],
      };
    }

    const commandsToRun: PkgPublish[] = yield confirmCommandsToRun({
      cwd,
      commands: publishCommands,
      command: "publish",
    });

    if (commandsToRun.length > 0) {
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
    console.info("There are no changes.");
    console.log(
      "We have previously released the changes in these files:",
      changesPaths
    );
    return { pkgReadyToPublish: [], response: "No changes." };
  } else {
    // write out all of the changes
    // TODO make it pretty
    console.log("changes:");
    Object.keys(assembledChanges.releases).forEach((release) => {
      console.log(`${release} => ${assembledChanges.releases[release].type}`);
      console.dir(assembledChanges.releases[release].changes, { depth: 4 });
    });

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

    const { commands } = yield mergeChangesToConfig({
      assembledChanges: changes,
      config,
      command,
      dryRun,
      filterPackages,
      cwd,
    });

    const applied = yield validateApply({
      commands,
      allPackages,
      prereleaseIdentifier,
    });

    return <CovectorStatus>{
      response: `There are ${
        Object.keys(assembledChanges.releases).length
      } changes which include${Object.keys(assembledChanges.releases).map(
        (release) =>
          ` ${release} with ${assembledChanges.releases[release].type}`
      )}`,
    };
  }
}
