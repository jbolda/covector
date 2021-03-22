import {
  attemptCommands,
  confirmCommandsToRun,
  raceTime,
  ComplexCommand,
} from "@covector/command";
import {
  configFile,
  changeFiles,
  changeFilesToVfile,
  changeFilesRemove,
  ConfigFile,
} from "@covector/files";
import { assemble, mergeIntoConfig, PipeTemplate } from "@covector/assemble";
import { fillChangelogs, pullLastChangelog } from "@covector/changelog";
import {
  apply,
  changesConsideringParents,
  validateApply,
} from "@covector/apply";

export type Covector = {
  [k: string]: {
    precommand: string | false;
    command: string | false;
    postcommand: string | false;
    applied: string | false;
    published?: boolean;
  };
};

export { ConfigFile, PipeTemplate };

export function* covector({
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
}): Generator<any, Covector | string, any> {
  const config = yield modifyConfig(yield configFile({ cwd }));
  const changesPaths = yield changeFiles({
    cwd,
    //@ts-ignore
    changeFolder: config.changeFolder,
  });
  const changesVfiles = changeFilesToVfile({
    cwd,
    //@ts-ignore
    paths: changesPaths,
  });
  const assembledChanges = yield assemble({
    cwd,
    vfiles: changesVfiles,
    //@ts-ignore
    config,
  });

  if (command === "status" || !command) {
    if (changesVfiles.length === 0) {
      console.info("There are no changes.");
      return "No changes.";
    } else {
      // write out all of the changes
      // TODO make it pretty
      console.log("changes:");
      //@ts-ignore
      Object.keys(assembledChanges.releases).forEach((release) => {
        //@ts-ignore
        console.log(`${release} => ${assembledChanges.releases[release].type}`);
        //@ts-ignore
        console.dir(assembledChanges.releases[release].changes);
      });

      const changes = changesConsideringParents({
        //@ts-ignore
        assembledChanges,
        //@ts-ignore
        config,
      });
      const commands = yield mergeIntoConfig({
        assembledChanges: changes,
        //@ts-ignore
        config,
        command,
        dryRun,
        filterPackages,
        cwd,
      });
      //@ts-ignore doesn't like Promise that is yielded?
      const applied = yield validateApply({
        //@ts-ignore
        commands,
        //@ts-ignore
        config,
        cwd,
      });

      return `There are ${
        //@ts-ignore
        Object.keys(assembledChanges.releases).length
        //@ts-ignore
      } changes which include${Object.keys(assembledChanges.releases).map(
        (release) =>
          //@ts-ignore
          ` ${release} with ${assembledChanges.releases[release].type}`
      )}`;
    }
  } else if (command === "config") {
    //@ts-ignore
    delete config.vfile;
    console.dir(config);
    return "config returned";
  } else if (command === "version") {
    //@ts-ignore
    yield raceTime({ t: config.timeout });
    const changes = changesConsideringParents({
      //@ts-ignore
      assembledChanges,
      //@ts-ignore
      config,
    });
    //@ts-ignore
    const commands = yield mergeIntoConfig({
      assembledChanges: changes,
      //@ts-ignore
      config,
      command,
      dryRun,
      filterPackages,
    });

    if (dryRun) {
      console.log("==== commands ready to run ===");
      console.log(commands);
    }

    let pkgCommandsRan: Covector = Object.keys(config.packages).reduce(
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

    //@ts-ignore
    pkgCommandsRan = yield attemptCommands({
      cwd,
      //@ts-ignore
      commands,
      commandPrefix: "pre",
      command,
      pkgCommandsRan,
      dryRun,
    });

    const applied = yield apply({
      //@ts-ignore
      commands,
      //@ts-ignore
      config,
      cwd,
      bump: !dryRun,
    });

    //@ts-ignore
    pkgCommandsRan = applied.reduce(
      //@ts-ignore
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

    //@ts-ignore
    pkgCommandsRan = yield fillChangelogs({
      //@ts-ignore
      applied,
      //@ts-ignore
      assembledChanges: changes,
      //@ts-ignore
      config,
      cwd,
      //@ts-ignore
      pkgCommandsRan,
      create: !dryRun,
    });

    //@ts-ignore
    pkgCommandsRan = yield attemptCommands({
      cwd,
      //@ts-ignore
      commands,
      commandPrefix: "post",
      command,
      pkgCommandsRan,
      dryRun,
    });

    if (command === "version" && !dryRun)
      //@ts-ignore
      yield changeFilesRemove({ cwd, paths: changesPaths });

    if (dryRun) {
      console.log("==== result ===");
      console.log(pkgCommandsRan);
    }

    return pkgCommandsRan;
  } else {
    //@ts-ignore
    yield raceTime({ t: config.timeout });
    const commands = yield mergeIntoConfig({
      //@ts-ignore
      assembledChanges,
      //@ts-ignore
      config,
      command,
      cwd,
      dryRun,
      filterPackages,
    });

    if (dryRun) {
      console.log("==== commands ready to run ===");
      console.log(commands);
    }

    //@ts-ignore
    if (commands.length === 0) {
      console.log(`No commands configured to run on [${command}].`);
      return `No commands configured to run on [${command}].`;
    }

    const commandsToRun: ComplexCommand[] = yield confirmCommandsToRun({
      cwd,
      //@ts-ignore
      commands,
      command,
    });

    let pkgCommandsRan: Covector = commands.reduce(
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

    pkgCommandsRan = yield pullLastChangelog({
      applied: commandsToRun.map((command) => ({
        name: command.pkg,
        version: "",
      })),
      config,
      cwd,
      pkgCommandsRan,
    });

    pkgCommandsRan = yield attemptCommands({
      cwd,
      //@ts-ignore
      commands: commandsToRun,
      commandPrefix: "pre",
      command,
      pkgCommandsRan,
      dryRun,
    });
    pkgCommandsRan = yield attemptCommands({
      cwd,
      //@ts-ignore
      commands: commandsToRun,
      command,
      pkgCommandsRan,
      dryRun,
    });
    pkgCommandsRan = yield attemptCommands({
      cwd,
      //@ts-ignore
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

    return pkgCommandsRan;
  }
}
