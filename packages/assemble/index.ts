import unified from "unified";
import { Root, YAML as Frontmatter, Content } from "mdast";
import parse from "remark-parse";
import stringify from "remark-stringify";
import frontmatter from "remark-frontmatter";
import yaml from "js-yaml";
import { template, cloneDeep } from "lodash";
import { readPkgFile, VFile, PackageFile, ConfigFile } from "@covector/files";
import { runCommand } from "@covector/command";

type Changeset = {
  releases?: { [k: string]: CommonBumps } | {};
  summary?: string;
  meta?: {
    filename: string;
    commits?: {
      hashShort: string;
      hashLong: string;
      date: string;
      commitSubject: string;
    }[];
  };
};

export type CommonBumps = "major" | "minor" | "patch" | "prerelease" | "noop";

type Change = {
  releases: { [k: string]: CommonBumps };
  meta?: { filename?: string };
};

type Release = {
  type: string;
  changes: Change[];
  parents?: string[];
};

export type PkgVersion = {
  pkg: string;
  path?: string;
  packageFileName?: string;
  type?: string;
  parents?: string[];
  precommand: string | null;
  command: string | null;
  postcommand: string | null;
  manager?: string;
  dependencies?: string[];
  errorOnVersionRange?: string;
};

type PipeVersionTemplate = {
  release: Release;
  pkg: PkgVersion;
};

export type PkgPublish = {
  pkg: string;
  path?: string;
  packageFileName?: string;
  changelog?: string;
  precommand?: (string | any)[] | null;
  command?: (string | any)[] | null;
  postcommand?: (string | any)[] | null;
  manager: string;
  dependencies?: string[];
  getPublishedVersion?: string;
  assets?: { name: string; path: string }[];
  pkgFile?: PackageFile;
  errorOnVersionRange?: string;
};

type PipePublishTemplate = {
  pkg: PkgPublish;
  pkgFile?: PackageFile;
};

const parseChange = function* ({
  cwd,
  vfile,
}: {
  cwd?: string;
  vfile: VFile;
}): Generator<any, Changeset, any> {
  const processor = unified()
    .use(parse)
    .use(frontmatter, ["yaml"])
    .use(stringify, {
      bullet: "-",
    });

  const parsed = processor.parse(vfile.contents.trim());
  const processed: Root = yield processor.run(parsed);
  let changeset: Changeset = {};
  const [parsedChanges, ...remaining]: (
    | Frontmatter
    | Content
  )[] = processed.children;
  const parsedYaml = yaml.load(parsedChanges.value as string);
  changeset.releases =
    typeof parsedYaml === "object" && parsedYaml !== null ? parsedYaml : {};
  changeset.summary = processor
    .stringify({
      type: "root",
      children: remaining,
    })
    .trim();

  if (cwd) {
    try {
      let gitInfo = yield runCommand({
        cwd,
        pkgPath: "",
        command: `git log --reverse --format="%h %H %as %s" ${vfile.data.filename}`,
        log: false,
      });
      const commits = gitInfo.split(/\n/).map((commit: string) => {
        const [hashShort, hashLong, date, ...rest] = commit.split(" ");
        return {
          hashShort,
          hashLong,
          date,
          commitSubject: rest.join(" "),
        };
      });

      changeset.meta = {
        ...vfile.data,
        commits,
      };
    } catch (e) {
      changeset.meta = {
        ...vfile.data,
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
        !change.meta ? `` : ` in ${change.meta.filename}`
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
  vfiles,
  config,
  preMode = { on: false, prevFiles: [] },
}: {
  cwd?: string;
  vfiles: VFile[];
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
    const allChanges: Change[] = yield changesParsed({ cwd, vfiles });
    const allMergedRelease = mergeReleases(allChanges, config || {});
    if (preMode.prevFiles.length > 0) {
      const newVfiles = vfiles.reduce((newVFiles: VFile[], vfile) => {
        const prevFile = preMode.prevFiles.find(
          (filename) => vfile.data.filename === filename
        );
        if (!prevFile) {
          return newVFiles.concat([vfile]);
        } else {
          return newVFiles;
        }
      }, []);
      const newChanges: Change[] = yield changesParsed({
        cwd,
        vfiles: newVfiles,
      });
      const newMergedRelease = mergeReleases(newChanges, config || {});

      const oldVfiles = vfiles.reduce((newVFiles: VFile[], vfile) => {
        const prevFile = preMode.prevFiles.find(
          (filename) => vfile.data.filename === filename
        );
        if (prevFile) {
          return newVFiles.concat([vfile]);
        } else {
          return newVFiles;
        }
      }, []);
      const oldChanges: Change[] = yield changesParsed({
        cwd,
        vfiles: oldVfiles,
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
    let changes: Change[] = yield changesParsed({ cwd, vfiles });
    plan.changes = changes;
    plan.releases = mergeReleases(changes, config || {});
  }

  if (config && Object.keys(config).length > 0) {
    for (let pkg of Object.keys(plan.releases)) {
      if (!config.packages[pkg]) {
        let changesContainingError = plan.releases[pkg].changes.reduce(
          (files, file) => {
            files = `${files}${files === "" ? "" : ", "}${
              file.meta && file.meta.filename ? file.meta.filename : ""
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
  vfiles,
}: {
  cwd?: string;
  vfiles: VFile[];
}): Generator<any, Change[], any> {
  const allVfiles = vfiles.map((vfile) => parseChange({ cwd, vfile }));
  let yieldedV: Change[] = [];
  for (let v of allVfiles) {
    yieldedV = [...yieldedV, yield v];
  }
  return yieldedV;
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
      if (bumpMap.get(nextBump) <= bumpMap.get(oldBump)) {
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
}) {
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
  let commands: { [k: string]: string | any }[] = [];
  for (let pkg of Object.keys(
    usePackageSubset(assembledChanges.releases, filterPackages)
  )) {
    if (!pkgCommands[pkg]) continue;

    const pkgs: { [k: string]: Release } = assembledChanges.releases;
    const pipeToTemplate: PipeVersionTemplate = {
      release: pkgs[pkg],
      pkg: pkgCommands[pkg],
    };

    if (dryRun) {
      pipeOutput[pkg] = {};
      pipeOutput[pkg].name = pkg;
      pipeOutput[pkg].pipe = pipeToTemplate;
    }

    const merged = {
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
    console.log("==== data piped into commands ===");
    Object.keys(pipeOutput).forEach((pkg) =>
      console.log(pkg, "pipe", pipeOutput[pkg].pipe)
    );
  }

  return commands;
};

export const mergeIntoConfig = function* ({
  config,
  assembledChanges,
  command,
  cwd,
  dryRun = false,
  filterPackages = [],
  changelogs,
}: {
  config: ConfigFile;
  assembledChanges: { releases: {} };
  command: string;
  cwd: string;
  dryRun: boolean;
  filterPackages: string[];
  changelogs?: { [k: string]: { name: string; changelog: string } };
}): Generator<any, PkgPublish[], any> {
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
                [`getPublishedVersion${publishElements.subPublishCommand}`]: publishElements[
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
      pkg: pkgCommands[pkg],
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

    if (dryRun) {
      pipeOutput[pkg] = {};
      pipeOutput[pkg].name = pkg;
      pipeOutput[pkg].pipe = pipeToTemplate;
    }

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
    };

    commands = [...commands, merged];
  }

  if (dryRun) {
    console.log("==== data piped into commands ===");
    Object.keys(pipeOutput).forEach((pkg) =>
      console.log(pkg, "pipe", pipeOutput[pkg].pipe)
    );
  }

  return commands;
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
  const managerCommand =
    !!pkgManager &&
    !!config.pkgManagers &&
    !!config.pkgManagers[pkgManager] &&
    //@ts-ignore
    !!config.pkgManagers[pkgManager][command]
      ? //@ts-ignore
        config.pkgManagers[pkgManager][command]
      : null;

  const mergedCommand =
    //@ts-ignore
    !config.packages[pkg][command] && config.packages[pkg][command] !== false
      ? managerCommand
      : //@ts-ignore
        config.packages[pkg][command];

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
