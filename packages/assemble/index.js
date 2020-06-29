const unified = require("unified");
const parse = require("remark-parse");
const stringify = require("remark-stringify");
const frontmatter = require("remark-frontmatter");
const parseFrontmatter = require("remark-parse-yaml");
const template = require("lodash.template");
const { readPkgFile } = require("@covector/files");
const path = require("path");

const processor = unified().use(parse).use(frontmatter).use(parseFrontmatter);

const parseChange = (testText) => {
  const parsed = processor.parse(testText);
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

module.exports.assemble = (texts) => {
  let plan = {};
  plan.changes = texts.map((text) => parseChange(text));
  plan.releases = mergeReleases(plan.changes);
  return plan;
};

module.exports.mergeIntoConfig = ({
  config,
  assembledChanges,
  command,
  cwd,
  dryRun = false,
}) => {
  // build in assembledChanges to only issue commands with ones with changes
  // and pipe in data to template function
  const pkgCommands = Object.keys(config.packages).reduce((pkged, pkg) => {
    const pkgManager = config.packages[pkg].manager;
    const commandItems = { pkg, pkgManager, config };
    const mergedCommand = mergeCommand({ ...commandItems, command });
    let getPublishedVersion;
    if (command === "publish") {
      getPublishedVersion = mergeCommand({
        ...commandItems,
        command: "getPublishedVersion",
      });
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
        manager: config.packages[pkg].manager,
        dependencies: config.packages[pkg].dependencies,
      };
    }
    return pkged;
  }, {});

  const commands = Object.keys(
    command === "publish" ? pkgCommands : assembledChanges.releases
  ).map(async (pkg) => {
    const pkgs =
      command === "publish" ? config.packages : assembledChanges.releases;
    const pipeToTemplate = {
      release: pkgs[pkg],
      pkg: pkgCommands[pkg],
    };
    if (!pkgCommands[pkg]) return null;

    const extraPublishParams =
      command !== "publish"
        ? {}
        : {
            pkgFile: await readPkgFile({
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
            ...(!pkgCommands[pkg].getPublishedVersion
              ? {}
              : {
                  getPublishedVersion: template(
                    pkgCommands[pkg].getPublishedVersion
                  )(pipeToTemplate),
                }),
          };

    if (command === "publish" && !!extraPublishParams.pkgFile) {
      pipeToTemplate.pkgFile = {
        name: extraPublishParams.pkgFile.name,
        version: extraPublishParams.pkgFile.version,
        pkg: extraPublishParams.pkgFile.pkg,
      };
    }

    if (dryRun) {
      console.log(pkg, "pipe", pipeToTemplate);
    }

    const merged = {
      pkg,
      ...extraPublishParams,
      path: pkgCommands[pkg].path,
      type: pkgs[pkg].type || null,
      manager: pkgCommands[pkg].manager,
      dependencies: pkgCommands[pkg].dependencies,
      precommand: templateCommands(pkgCommands[pkg].precommand, pipeToTemplate),
      command: templateCommands(pkgCommands[pkg].command, pipeToTemplate),
      postcommand: templateCommands(
        pkgCommands[pkg].postcommand,
        pipeToTemplate
      ),
    };

    return merged;
  });

  return Promise.all(commands).then((values) =>
    values.reduce(
      (acc, current) => (!current ? acc : acc.concat([current])),
      []
    )
  );
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

const templateCommands = (command, pipe) => {
  if (!command) return null;
  const commands = !Array.isArray(command) ? [command] : command;
  return commands.map((c) => template(c)(pipe));
};
