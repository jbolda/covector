import { Operation } from "effection";
import unified from "unified";
import { Root, YAML as Frontmatter, Content } from "mdast";
import parse from "remark-parse";
import stringify from "remark-stringify";
import frontmatter from "remark-frontmatter";
import yaml from "js-yaml";
import { template, cloneDeep } from "lodash";
import { readPkgFile } from "@covector/files";
import { runCommand } from "@covector/command";

import type {
  File,
  ConfigFile,
  Changeset,
  CommonBumps,
  Change,
  Release,
  PkgVersion,
  PipeVersionTemplate,
  PkgPublish,
  PipePublishTemplate,
} from "@covector/types";

export const parseChange = function* ({
  cwd,
  file,
}: {
  cwd?: string;
  file: File;
}): Operation<Changeset> {
  const processor = unified()
    .use(parse)
    .use(frontmatter, ["yaml"])
    .use(stringify, {
      bullet: "-",
    });

  const parsed = processor.parse(file.content.trim());
  const processed: Root = yield processor.run(parsed);
  let changeset: Changeset = {};
  const [parsedChanges, ...remaining]: (Frontmatter | Content)[] =
    processed.children;
  //@ts-ignore
  const parsedYaml = yaml.load(parsedChanges.value as string);
  changeset.releases =
    typeof parsedYaml === "object" && parsedYaml !== null ? parsedYaml : {};
  if (Object.keys(changeset.releases).length === 0)
    throw new Error(
      `${file.path} didn't have any packages bumped. Please add a package bump.`
    );
  changeset.summary = processor
    .stringify({
      type: "root",
      //@ts-ignore
      children: remaining,
    })
    .trim();

  if (cwd) {
    try {
      const gitInfo = yield runCommand({
        cwd,
        pkgPath: ".",
        command: `git --no-pager log --reverse --format="%h %H %as %s" ${file.path}`,
        log: false,
      });
      const commits = gitInfo.split("\n").map((commit: string) => {
        const [hashShort, hashLong, date, ...rest] = commit.split(" ");
        return {
          hashShort,
          hashLong,
          date,
          commitSubject: rest.join(" "),
        };
      });

      changeset.meta = {
        ...file,
        commits,
      };
    } catch (e) {
      changeset.meta = {
        ...file,
        commits: [],
      };
    }
  }
  return changeset;
};

// major, minor, or patch
// enum and use Int to compare
const bumpMap = new Map<CommonBumps, number>([
  ["major", 1],
  ["minor", 2],
  ["patch", 3],
  ["prerelease", 4],
  ["noop", 5],
]);

export const compareBumps = (bumpOne: CommonBumps, bumpTwo: CommonBumps) => {
  return bumpMap.get(bumpOne)! < bumpMap.get(bumpTwo)! ? bumpOne : bumpTwo;
};

const mergeReleases = (
  changes: Change[],
  { additionalBumpTypes = [] }: { additionalBumpTypes?: string[] }
) => {
  return changes.reduce((release: { [k: string]: Release }, change) => {
    Object.keys(change.releases).forEach((pkg) => {
      const bumpOptions = ["major", "minor", "patch", "noop"].concat(
        additionalBumpTypes
      );

      assertBumpType(
        pkg,
        change.releases[pkg],
        bumpOptions,
        !change.meta ? `` : ` in ${change.meta.path}`
      );

      const bumpType = additionalBumpTypes.includes(change.releases[pkg])
        ? "noop"
        : change.releases[pkg];
      if (!release[pkg]) {
        release[pkg] = {
          type: bumpType,
          changes: cloneDeep([change]),
        };
      } else {
        release[pkg] = {
          type: compareBumps(release[pkg].type, bumpType),
          changes: cloneDeep([...release[pkg].changes, change]),
        };
      }
    });
    return release;
  }, {});
};

function assertBumpType(
  pkgName: string,
  bumpType: string,
  bumpOptions: string[],
  filenameRef: string
) {
  const satisfiesAssertion = bumpOptions.includes(bumpType);
  if (!satisfiesAssertion) {
    throw new Error(
      `${bumpType} specified for ${pkgName} is invalid.\n` +
        `Try one of the following${filenameRef}: ` +
        `${bumpOptions.filter((option) => option !== "noop").join(", ")}.\n`
    );
  }
}

export const assemble = function* ({
  cwd,
  files,
  config,
  preMode = { on: false, prevFiles: [] },
}: {
  cwd?: string;
  files: File[];
  config?: ConfigFile;
  preMode?: { on: boolean; prevFiles: string[] };
}) {
  let plan: {
    changes?: Change[];
    releases?: {
      [k: string]: {
        type: CommonBumps;
        changes: Change[];
      };
    };
  } = {};

  // if in prerelease mode, we only make bumps if the new one is "larger" than the last
  // otherwise we only want a prerelease bump (which just increments the ending number)
  if (preMode.on) {
    const allChanges: Change[] = yield changesParsed({ cwd, files });
    const allMergedRelease = mergeReleases(allChanges, config || {});
    if (preMode.prevFiles.length > 0) {
      const newFiles = files.reduce((newFiles: File[], file) => {
        const prevFile = preMode.prevFiles.find(
          (filename) => file.path === filename
        );
        if (!prevFile) {
          return newFiles.concat([file]);
        } else {
          return newFiles;
        }
      }, []);
      const newChanges: Change[] = yield changesParsed({
        cwd,
        files: newFiles,
      });
      const newMergedRelease = mergeReleases(newChanges, config || {});

      const oldFiles = files.reduce((newFiles: File[], file) => {
        const prevFile = preMode.prevFiles.find(
          (filename) => file.path === filename
        );
        if (prevFile) {
          return newFiles.concat([file]);
        } else {
          return newFiles;
        }
      }, []);
      const oldChanges: Change[] = yield changesParsed({
        cwd,
        files: oldFiles,
      });
      const oldMergedRelease = mergeReleases(oldChanges, config || {});

      const diffed = changeDiff({
        allMergedRelease,
        newMergedRelease,
        oldMergedRelease,
      });
      plan.changes = newChanges;
      plan.releases = diffed;
    } else {
      plan.changes = allChanges;
      plan.releases = changeDiff({
        allMergedRelease,
      });
    }
  } else {
    let changes: Change[] = yield changesParsed({ cwd, files });
    plan.changes = changes;
    plan.releases = mergeReleases(changes, config || {});
  }

  // check that plan only includes pkgs that exist
  if (config && Object.keys(config).length > 0) {
    for (let pkg of Object.keys(plan.releases)) {
      if (!config.packages[pkg]) {
        let changesContainingError = plan.releases[pkg].changes.reduce(
          (files, file) => {
            files = `${files}${files === "" ? "" : ", "}${
              file.meta && file.meta.path ? file.meta.path : ""
            }`;
            return files;
          },
          ""
        );
        throw Error(
          `${pkg} listed in ${changesContainingError} does not exist in the .changes/config.json`
        );
      }
    }
  }

  return plan;
};

const changesParsed = function* ({
  cwd,
  files,
}: {
  cwd?: string;
  files: File[];
}): Operation<Change[]> {
  const allChangesParsed = [];

  for (let file of files) {
    const parsed = yield parseChange({ cwd, file });
    allChangesParsed.push(parsed);
  }

  return allChangesParsed;
};

const changeDiff = ({
  allMergedRelease,
  newMergedRelease,
  oldMergedRelease,
}: {
  allMergedRelease: { [k: string]: Release };
  newMergedRelease?: { [k: string]: Release };
  oldMergedRelease?: { [k: string]: Release };
}) => {
  if (newMergedRelease && oldMergedRelease) {
    let diffed = { ...newMergedRelease };
    Object.keys(newMergedRelease).forEach((pkg: string) => {
      const nextBump = newMergedRelease[pkg]?.type || "noop";
      const oldBump = oldMergedRelease[pkg]?.type || "noop";
      //@ts-ignore bumpMap could be undefined?
      if (bumpMap.get(nextBump) < bumpMap.get(oldBump)) {
        //@ts-ignore TODO template string doesn't play nice with the type
        diffed[pkg].type = `pre${nextBump}`;
      } else {
        diffed[pkg].type = "prerelease";
      }
    });
    return diffed;
  } else {
    return Object.keys(allMergedRelease).reduce(
      (diffed: { [k: string]: Release }, pkg: string) => {
        diffed[pkg] = { ...allMergedRelease[pkg] };
        //@ts-ignore TODO template string doesn't play nice with the type
        diffed[pkg].type = `pre${allMergedRelease[pkg].type}`;
        return diffed;
      },
      {}
    );
  }
};

export const mergeChangesToConfig = function* ({
  config,
  assembledChanges,
  command,
  cwd,
  dryRun = false,
  filterPackages = [],
}: {
  config: ConfigFile;
  assembledChanges: { releases: {} };
  command: string;
  cwd: string;
  dryRun: boolean;
  filterPackages: string[];
}): Generator<any, { commands: PkgVersion[]; pipeTemplate: any }, any> {
  // build in assembledChanges to only issue commands with ones with changes
  // and pipe in data to template function
  const pkgCommands = Object.keys(config.packages).reduce(
    (pkged: { [k: string]: PkgVersion }, pkg) => {
      const pkgManager = config.packages[pkg].manager;
      const commandItems = { pkg, pkgManager, config };
      const mergedCommand = mergeCommand({ ...commandItems, command });

      if (!!mergedCommand || command === "status") {
        pkged[pkg] = {
          pkg: pkg,
          path: config.packages[pkg].path,
          ...(!config.packages[pkg]?.packageFileName
            ? {}
            : { packageFileName: config.packages[pkg]?.packageFileName }),
          precommand: mergeCommand({
            ...commandItems,
            command: `pre${command}`,
          }),
          command: mergedCommand,
          postcommand: mergeCommand({
            ...commandItems,
            command: `post${command}`,
          }),
          manager: config.packages[pkg].manager,
          dependencies: config.packages[pkg].dependencies,
          errorOnVersionRange: mergeCommand({
            ...commandItems,
            command: `errorOnVersionRange`,
          }),
        };
      }

      return pkged;
    },
    {}
  );

  const pipeOutput: {
    [k: string]: { name?: string; pipe?: PipeVersionTemplate };
  } = {};
  let commands: PkgVersion[] = [];
  for (let pkg of Object.keys(
    usePackageSubset(assembledChanges.releases, filterPackages)
  )) {
    if (!pkgCommands[pkg]) continue;

    const pkgs: { [k: string]: Release } = assembledChanges.releases;
    const pipeToTemplate: PipeVersionTemplate = {
      release: pkgs[pkg],
      pkg: pkgCommands[pkg],
    };

    pipeOutput[pkg] = {};
    pipeOutput[pkg].name = pkg;
    pipeOutput[pkg].pipe = pipeToTemplate;

    const merged: PkgVersion = {
      pkg,
      ...(!pkgs[pkg].parents ? {} : { parents: pkgs[pkg].parents }),
      path: pkgCommands[pkg].path,
      type: pkgs[pkg].type || null,
      manager: pkgCommands[pkg].manager,
      dependencies: pkgCommands[pkg].dependencies,
      precommand: templateCommands(
        pkgCommands[pkg].precommand,
        pipeToTemplate,
        ["command", "dryRunCommand", "runFromRoot"]
      ),
      command: templateCommands(pkgCommands[pkg].command, pipeToTemplate, [
        "command",
        "dryRunCommand",
      ]),
      postcommand: templateCommands(
        pkgCommands[pkg].postcommand,
        pipeToTemplate,
        ["command", "dryRunCommand", "runFromRoot"]
      ),
      errorOnVersionRange: pkgCommands[pkg].errorOnVersionRange,
    };

    commands = [...commands, merged];
  }

  if (dryRun) {
    console.dir("==== data piped into commands ===");
    Object.keys(pipeOutput).forEach((pkg) =>
      console.dir({ pkg, pipe: pipeOutput[pkg].pipe }, { depth: 5 })
    );
  }

  return { commands, pipeTemplate: pipeOutput };
};

export const mergeIntoConfig = function* ({
  config,
  assembledChanges,
  command,
  cwd,
  dryRun = false,
  filterPackages = [],
  changelogs,
  tag = "",
}: {
  config: ConfigFile;
  assembledChanges: { releases: {} };
  command: string;
  cwd: string;
  dryRun: boolean;
  filterPackages: string[];
  changelogs?: { [k: string]: { name: string; changelog: string } };
  tag?: string;
}): Generator<any, { commands: PkgPublish[]; pipeTemplate: any }, any> {
  // build in assembledChanges to only issue commands with ones with changes
  // and pipe in data to template function

  const pkgCommands = Object.keys(config.packages).reduce(
    (pkged: { [k: string]: PkgPublish }, pkg) => {
      const pkgManager = config.packages[pkg].manager;
      const commandItems = { pkg, pkgManager, config };
      const mergedCommand = mergeCommand({ ...commandItems, command });

      let publishElements: {
        [k: string]: any;
      } = {};
      publishElements.subPublishCommand = command.slice(7, 999);
      if (command === "publish") {
        publishElements[
          `getPublishedVersion${publishElements.subPublishCommand}`
        ] = mergeCommand({
          ...commandItems,
          command: `getPublishedVersion${publishElements.subPublishCommand}`,
        });
        publishElements["assets"] = mergeCommand({
          ...commandItems,
          command: "assets",
        });
      }

      if (!!mergedCommand) {
        pkged[pkg] = {
          pkg: pkg,
          path: config.packages[pkg].path,
          ...(!config.packages[pkg]?.packageFileName
            ? {}
            : { packageFileName: config.packages[pkg]?.packageFileName }),
          ...(!changelogs || !changelogs[pkg]
            ? {}
            : { changelog: changelogs[pkg].changelog }),
          precommand: mergeCommand({
            ...commandItems,
            command: `pre${command}`,
          }),
          command: mergedCommand,
          postcommand: mergeCommand({
            ...commandItems,
            command: `post${command}`,
          }),
          ...(!publishElements[
            `getPublishedVersion${publishElements.subPublishCommand}`
          ]
            ? {}
            : {
                [`getPublishedVersion${publishElements.subPublishCommand}`]:
                  publishElements[
                    `getPublishedVersion${publishElements.subPublishCommand}`
                  ],
              }),
          ...(!publishElements.assets
            ? {}
            : { assets: publishElements.assets }),
          manager: config.packages[pkg].manager || "",
          dependencies: config.packages[pkg].dependencies,
          errorOnVersionRange: mergeCommand({
            ...commandItems,
            command: `errorOnVersionRange`,
          }),
          releaseTag: mergeCommand({
            ...commandItems,
            command: `releaseTag`,
          }),
        };
      }

      return pkged;
    },
    {}
  );

  const pipeOutput: {
    [k: string]: { name?: string; pipe?: PipePublishTemplate };
  } = {};
  let commands: PkgPublish[] = [];
  for (let pkg of Object.keys(usePackageSubset(pkgCommands, filterPackages))) {
    if (!pkgCommands[pkg]) continue;

    const pipeToTemplate: PipePublishTemplate = {
      pkg: { ...pkgCommands[pkg], tag },
    };

    let extraPublishParams = {
      pkgFile: yield readPkgFile({
        cwd,
        pkgConfig: pkgCommands[pkg],
        nickname: pkg,
      }),
    };

    pipeToTemplate.pkgFile = {
      name: extraPublishParams.pkgFile.name,
      version: extraPublishParams.pkgFile.version,
      versionMajor: extraPublishParams.pkgFile.versionMajor,
      versionMinor: extraPublishParams.pkgFile.versionMinor,
      versionPatch: extraPublishParams.pkgFile.versionPatch,
      deps: extraPublishParams.pkgFile.deps,
      pkg: extraPublishParams.pkgFile.pkg,
    };

    let subPublishCommand = command.slice(7, 999);
    // add these after that they can use pkgFile
    extraPublishParams = {
      ...extraPublishParams,
      //@ts-ignore no index type string
      ...(!pkgCommands[pkg][`getPublishedVersion${subPublishCommand}`]
        ? {}
        : {
            [`getPublishedVersion${subPublishCommand}`]: template(
              //@ts-ignore no index type string
              pkgCommands[pkg][`getPublishedVersion${subPublishCommand}`]
            )(pipeToTemplate),
          }),
      ...(!pkgCommands[pkg].assets
        ? {}
        : {
            assets: templateCommands(pkgCommands[pkg].assets, pipeToTemplate, [
              "path",
              "name",
            ]),
          }),
    };

    pipeOutput[pkg] = {};
    pipeOutput[pkg].name = pkg;
    pipeOutput[pkg].pipe = pipeToTemplate;

    const merged: PkgPublish = {
      pkg,
      ...extraPublishParams,
      path: pkgCommands[pkg].path,
      manager: pkgCommands[pkg].manager,
      dependencies: pkgCommands[pkg].dependencies,
      precommand: templateCommands(
        pkgCommands[pkg].precommand,
        pipeToTemplate,
        ["command", "dryRunCommand", "runFromRoot"]
      ),
      command: templateCommands(pkgCommands[pkg].command, pipeToTemplate, [
        "command",
        "dryRunCommand",
      ]),
      postcommand: templateCommands(
        pkgCommands[pkg].postcommand,
        pipeToTemplate,
        ["command", "dryRunCommand", "runFromRoot"]
      ),
      errorOnVersionRange: pkgCommands[pkg].errorOnVersionRange,
      releaseTag:
        pkgCommands[pkg].releaseTag === false
          ? false
          : templateCommands(
              [
                pkgCommands[pkg].releaseTag ??
                  "${ pkg.pkg }-v${ pkgFile.version }",
              ],
              pipeToTemplate,
              ["releaseTag"]
            )![0],
    };

    commands = [...commands, merged];
  }

  if (dryRun) {
    console.dir("==== data piped into commands ===");
    Object.keys(pipeOutput).forEach((pkg) =>
      console.dir({ pkg, pipe: pipeOutput[pkg].pipe }, { depth: 5 })
    );
  }

  return { commands, pipeTemplate: pipeOutput };
};

const mergeCommand = ({
  pkg,
  pkgManager,
  command,
  config,
}: {
  pkg: any;
  pkgManager: any;
  command: any;
  config: ConfigFile;
}) => {
  //@ts-ignore
  const managerCommand = config.pkgManagers?.[pkgManager]?.[command] ?? null;
  //@ts-ignore
  const mergedCommand = config.packages?.[pkg]?.[command] ?? managerCommand;

  return mergedCommand;
};

const usePackageSubset = (commands: any, subset: string[] = []) =>
  !!subset && subset.length === 0
    ? commands
    : subset.reduce((pkgCommands: { [k: string]: any }, pkg) => {
        if (!commands[pkg]) {
          return pkgCommands;
        } else {
          pkgCommands[pkg] = commands[pkg];
          return pkgCommands;
        }
      }, {});

const templateCommands = (
  command: any,
  pipe: PipePublishTemplate | PipeVersionTemplate,
  complexCommands: string[]
) => {
  if (!command) return null;
  const commands = !Array.isArray(command) ? [command] : command;
  return commands.map((c) => {
    if (typeof c === "object") {
      return {
        ...c,
        ...complexCommands.reduce(
          (templated: { [k: string]: any }, complex) => {
            templated[complex] =
              typeof c[complex] === "string"
                ? template(c[complex])(pipe)
                : c[complex];
            return templated;
          },
          {}
        ),
      };
    } else {
      // if it is a function, we pipe when we run the function
      return typeof c === "function" ? c : template(c)(pipe);
    }
  });
};
