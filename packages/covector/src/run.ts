import {
  attemptCommands,
  confirmCommandsToRun,
  raceTime,
} from "@covector/command";
import {
  configFile,
  readPreFile,
  changeFiles,
  changeFilesToVfile,
  changeFilesRemove,
  ConfigFile,
  writePreFile,
} from "@covector/files";
import {
  assemble,
  mergeIntoConfig,
  mergeChangesToConfig,
  PkgVersion,
  PkgPublish,
} from "@covector/assemble";
import {
  fillChangelogs,
  pullLastChangelog,
  pipeChangelogToCommands,
} from "@covector/changelog";
import {
  apply,
  changesConsideringParents,
  validateApply,
} from "@covector/apply";

export type PkgCommandsRan = {
  precommand: string | false;
  command: string | false;
  postcommand: string | false;
  applied: string | false;
  published?: boolean;
};

export type CommandsRan = {
  [k: string]: PkgCommandsRan;
};

export interface CovectorStatus {
  response: string;
  pipeTemplate?: object;
  pkgReadyToPublish: PkgPublish[];
}

export interface CovectorVersion {
  commandsRan: CommandsRan;
  pipeTemplate: object;
}
export interface CovectorPublish {
  commandsRan: CommandsRan;
  pipeTemplate: object;
  response: string;
}

export type Covector =
  | CovectorStatus
  | CovectorVersion
  | CovectorPublish
  | { response: string };

export interface FunctionPipe extends PkgPublish {
  pkgCommandsRan: PkgCommandsRan;
}

export { ConfigFile };

export function* covector({
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
  const changesVfiles = changeFilesToVfile({
    cwd,
    paths: changesPaths,
  });
  const assembledChanges = yield assemble({
    cwd,
    vfiles: changesVfiles,
    config,
    preMode: { on: !!pre, prevFiles: !pre ? [] : pre.changes },
  });

  if (command === "status" || !command) {
    if (changesVfiles.length === 0) {
      console.info("There are no changes.");

      const {
        commands: publishCommands,
      }: { commands: PkgPublish[] } = yield mergeIntoConfig({
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
        console.dir(assembledChanges.releases[release].changes);
      });

      const changes = changesConsideringParents({
        assembledChanges,
        config,
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
        config,
        cwd,
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
  } else if (command === "config") {
    delete config.vfile;
    console.dir(config);
    return { response: "config returned" };
  } else if (command === "version") {
    yield raceTime({ t: config.timeout });
    const changes = changesConsideringParents({
      assembledChanges,
      config,
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

    if (command === "version" && !dryRun) {
      if (pre) {
        pre.changes = changesPaths;
        yield writePreFile({ preFile: pre });
      } else {
        yield changeFilesRemove({ cwd, paths: changesPaths });
      }
    }

    if (dryRun) {
      console.log("==== result ===");
      console.log(pkgCommandsRan);
    }

    return <CovectorVersion>{ commandsRan: pkgCommandsRan, pipeTemplate };
  } else if (command === "preview") {
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

    const {
      commands: publishCommands,
    }: { commands: PkgPublish[] } = yield mergeIntoConfig({
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
  } else {
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
}
