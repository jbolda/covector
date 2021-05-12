import unified from "unified";
import parse from "remark-parse";
import stringify from "remark-stringify";
import frontmatter from "remark-frontmatter";
import yaml from "js-yaml";
import { template, cloneDeep } from "lodash";
import { readPkgFile, VFile, PackageFile, ConfigFile } from "@covector/files";
import { runCommand } from "@covector/command";

type Changeset = {
  //TODO can we narrow this more?
  releases?: { [k: string]: string } | {};
  summary?: {};
  meta?: { filename: string; commits?: string[] };
};

const parseChange = function* ({ cwd, vfile }: { cwd?: string; vfile: VFile }) {
  const processor = unified()
    .use(parse)
    .use(frontmatter, ["yaml"])
    .use(stringify, {
      bullet: "-",
    });

  const parsed = processor.parse(vfile.contents.trim());
  //@ts-ignore
  const processed = yield processor.run(parsed);
  let changeset: Changeset = {};
  const [parsedChanges, ...remaining] = processed.children;
  const parsedYaml = yaml.load(parsedChanges.value);
  changeset.releases =
    typeof parsedYaml === "object" && parsedYaml !== null ? parsedYaml : {};
  if (Object.keys(changeset.releases).length === 0)
    throw new Error(
      `${vfile.data.filename} didn't have any packages bumped. Please add a package bump.`
    );
  changeset.summary = processor
    .stringify({
      type: "root",
      children: remaining,
    })
    .trim();

  if (cwd) {
    try {
      //@ts-ignore TODO generator error
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

export type CommonBumps = "major" | "minor" | "patch" | "noop";

export const compareBumps = (bumpOne: CommonBumps, bumpTwo: CommonBumps) => {
  // major, minor, or patch
  // enum and use Int to compare
  let bumps = new Map<CommonBumps, number>([
    ["major", 1],
    ["minor", 2],
    ["patch", 3],
    ["noop", 4],
  ]);
  return bumps.get(bumpOne)! < bumps.get(bumpTwo)! ? bumpOne : bumpTwo;
};

type Change = {
  releases: { [k: string]: CommonBumps };
  meta?: { filename?: string };
};

const mergeReleases = (
  changes: Change[],
  { additionalBumpTypes = [] }: { additionalBumpTypes?: string[] }
) => {
  return changes.reduce(
    (
      release: { [k: string]: { type: CommonBumps; changes: Change[] } },
      change
    ) => {
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
    },
    {}
  );
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
}: {
  cwd?: string;
  vfiles: VFile[];
  config?: ConfigFile;
}) {
  let plan: {
    changes?: {};
    releases?: {
      [k: string]: {
        type: CommonBumps;
        changes: Change[];
      };
    };
  } = {};
  let changes: Change[] = yield function* () {
    let allVfiles = vfiles.map((vfile) => parseChange({ cwd, vfile }));
    let yieldedV: Change[] = [];
    for (let v of allVfiles) {
      yieldedV = [...yieldedV, yield v];
    }
    return yieldedV;
  };
  plan.changes = changes;
  plan.releases = mergeReleases(changes, config || {});

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
};

type Release = {
  type: string;
  changes: { type: string; parents?: string[] }[];
  parents?: string[];
};

type PipeVersionTemplate = {
  release: Release;
  pkg: PkgVersion;
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

      if (!!mergedCommand) {
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
};

type PipePublishTemplate = {
  pkg: PkgPublish;
  pkgFile?: PackageFile;
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
