const unified = require("unified");
const parse = require("remark-parse");
const stringify = require("remark-stringify");
const frontmatter = require("remark-frontmatter");
const parseFrontmatter = require("remark-parse-yaml");
const template = require("lodash.template");
const { readPkgFile } = require("@covector/files");
const { runCommand } = require("@covector/command");
const path = require("path");

const processor = unified().use(parse).use(frontmatter).use(parseFrontmatter);

const parseChange = function* ({ cwd, vfile }) {
  const parsed = processor.parse(vfile.contents);
  const processed = processor.runSync(parsed);
  let changeset = {};
  changeset.releases = processed.children[0].data.parsedValue;
  changeset.summary = processed.children.reduce((summary, element) => {
    if (element.type === "paragraph") {
      return `${element.children.reduce(
        (text, item) => `${text}${item.value}`,
        ""
      )}`;
    } else {
      return summary;
    }
  }, "");
  if (cwd) {
    try {
      let gitInfo = yield runCommand({
        cwd,
        pkgPath: "",
        command: `git log --reverse --format="%h %H %as %s" ${vfile.data.filename}`,
        log: false,
      });
      const commits = gitInfo.split(/\n/).map((commit) => {
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

const compareBumps = (bumpOne, bumpTwo) => {
  // major, premajor, minor, preminor, patch, prepatch, or prerelease
  // enum and use Int to compare
  let bumps = new Map([
    ["major", 1],
    ["premajor", 2],
    ["minor", 3],
    ["preminor", 4],
    ["patch", 5],
    ["prepatch", 6],
    ["prerelease", 7],
  ]);
  return bumps.get(bumpOne) < bumps.get(bumpTwo) ? bumpOne : bumpTwo;
};

module.exports.compareBumps = compareBumps;

const mergeReleases = (changes) => {
  return changes.reduce((release, change) => {
    Object.keys(change.releases).forEach((pkg) => {
      if (!release[pkg]) {
        release[pkg] = {
          type: change.releases[pkg],
          changes: [change],
        };
      } else {
        release[pkg] = {
          type: compareBumps(release[pkg].type, change.releases[pkg]),
          changes: [...release[pkg].changes, change],
        };
      }
    });
    return release;
  }, {});
};

module.exports.assemble = function* ({ cwd, vfiles }) {
  let plan = {};
  let changes = yield function* () {
    let allVfiles = vfiles.map((vfile) => parseChange({ cwd, vfile }));
    let yieldedV = [];
    for (let v of allVfiles) {
      yieldedV = [...yieldedV, yield v];
    }
    return yieldedV;
  };
  plan.changes = changes;
  plan.releases = mergeReleases(changes);
  return plan;
};

module.exports.mergeIntoConfig = function* ({
  config,
  assembledChanges,
  command,
  cwd,
  dryRun = false,
}) {
  // build in assembledChanges to only issue commands with ones with changes
  // and pipe in data to template function
  const pkgCommands = Object.keys(config.packages).reduce((pkged, pkg) => {
    const pkgManager = config.packages[pkg].manager;
    const commandItems = { pkg, pkgManager, config };
    const mergedCommand = mergeCommand({ ...commandItems, command });

    let getPublishedVersion;
    let assets;
    if (command === "publish") {
      getPublishedVersion = mergeCommand({
        ...commandItems,
        command: "getPublishedVersion",
      });
      assets = mergeCommand({ ...commandItems, command: "assets" });
    }

    if (!!mergedCommand) {
      pkged[pkg] = {
        pkg: pkg,
        path: config.packages[pkg].path,
        precommand: mergeCommand({ ...commandItems, command: `pre${command}` }),
        command: mergedCommand,
        postcommand: mergeCommand({
          ...commandItems,
          command: `post${command}`,
        }),
        ...(!getPublishedVersion ? {} : { getPublishedVersion }),
        ...(!assets ? {} : { assets }),
        manager: config.packages[pkg].manager,
        dependencies: config.packages[pkg].dependencies,
      };
    }

    return pkged;
  }, {});

  const pipeOutput = {};
  let commands = [];
  for (let pkg of Object.keys(
    command !== "version" ? pkgCommands : assembledChanges.releases
  )) {
    if (!pkgCommands[pkg]) continue;

    const pkgs =
      command !== "version" ? config.packages : assembledChanges.releases;
    const pipeToTemplate = {
      release: pkgs[pkg],
      pkg: pkgCommands[pkg],
    };

    let extraPublishParams =
      command == "version"
        ? {}
        : {
            pkgFile: yield readPkgFile({
              file: path.join(
                cwd,
                config.packages[pkg].path,
                !!config.packages[pkg].manager &&
                  config.packages[pkg].manager === "rust"
                  ? "Cargo.toml"
                  : "package.json"
              ),
              nickname: pkg,
            }),
          };

    if (command !== "version" && !!extraPublishParams.pkgFile) {
      pipeToTemplate.pkgFile = {
        name: extraPublishParams.pkgFile.name,
        version: extraPublishParams.pkgFile.version,
        versionMajor: extraPublishParams.pkgFile.versionMajor,
        versionMinor: extraPublishParams.pkgFile.versionMinor,
        versionPatch: extraPublishParams.pkgFile.versionPatch,
        pkg: extraPublishParams.pkgFile.pkg,
      };
    }

    if (command !== "version") {
      // add these after that they can use pkgFile
      extraPublishParams = {
        ...extraPublishParams,
        ...(!pkgCommands[pkg].getPublishedVersion
          ? {}
          : {
              getPublishedVersion: template(
                pkgCommands[pkg].getPublishedVersion
              )(pipeToTemplate),
            }),
        ...(!pkgCommands[pkg].assets
          ? {}
          : {
              assets: templateCommands(
                pkgCommands[pkg].assets,
                pipeToTemplate,
                ["path", "name"]
              ),
            }),
      };
    }

    if (dryRun) {
      pipeOutput[pkg] = {};
      pipeOutput[pkg].name = pkg;
      pipeOutput[pkg].pipe = pipeToTemplate;
    }

    const merged = {
      pkg,
      ...(!pkgs[pkg].parents ? {} : { parents: pkgs[pkg].parents }),
      ...extraPublishParams,
      path: pkgCommands[pkg].path,
      type: pkgs[pkg].type || null,
      manager: pkgCommands[pkg].manager,
      dependencies: pkgCommands[pkg].dependencies,
      precommand: templateCommands(
        pkgCommands[pkg].precommand,
        pipeToTemplate,
        ["command", "dryRunCommand"]
      ),
      command: templateCommands(pkgCommands[pkg].command, pipeToTemplate, [
        "command",
        "dryRunCommand",
      ]),
      postcommand: templateCommands(
        pkgCommands[pkg].postcommand,
        pipeToTemplate,
        ["command", "dryRunCommand"]
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

const mergeCommand = ({ pkg, pkgManager, command, config }) => {
  const managerCommand =
    !!pkgManager &&
    !!config.pkgManagers[pkgManager] &&
    !!config.pkgManagers[pkgManager][command]
      ? config.pkgManagers[pkgManager][command]
      : null;

  const mergedCommand =
    !config.packages[pkg][command] && config.packages[pkg][command] !== false
      ? managerCommand
      : config.packages[pkg][command];

  return mergedCommand;
};

const templateCommands = (command, pipe, complexCommands) => {
  if (!command) return null;
  const commands = !Array.isArray(command) ? [command] : command;
  return commands.map((c) => {
    if (typeof c === "object") {
      return {
        ...c,
        ...complexCommands.reduce((templated, complex) => {
          templated[complex] =
            typeof c[complex] === "string"
              ? template(c[complex])(pipe)
              : c[complex];
          return templated;
        }, {}),
      };
    } else {
      return template(c)(pipe);
    }
  });
};
