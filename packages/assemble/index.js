const unified = require("unified");
const parse = require("remark-parse");
const stringify = require("remark-stringify");
const frontmatter = require("remark-frontmatter");
const parseFrontmatter = require("remark-parse-yaml");
const template = require("lodash.template");

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

module.exports.mergeIntoConfig = ({ config, assembledChanges, command }) => {
  // build in assembledChanges to only issue commands with ones with changes
  // and pipe in data to template function
  const pkgCommands = Object.keys(config.packages).reduce((pkged, pkg) => {
    const pkgManager = config.packages[pkg].manager;
    const managerCommand =
      !!pkgManager &&
      !!config.pkgManagers[pkgManager] &&
      !!config.pkgManagers[pkgManager][command]
        ? config.pkgManagers[pkgManager][command]
        : null;
    const mergedCommand = !config.packages[pkg][command]
      ? managerCommand
      : config.packages[pkg][command];
    if (!!mergedCommand) {
      pkged[pkg] = {
        path: config.packages[pkg].path,
        [command]: mergedCommand,
        manager: config.packages[pkg].manager,
        dependencies: config.packages[pkg].dependencies,
      };
    }
    return pkged;
  }, {});

  const commands = Object.keys(assembledChanges.releases).map((pkg) => {
    const pipeToTemplate = {
      release: assembledChanges.releases[pkg],
      pkg: pkgCommands[pkg],
    };
    if (!pkgCommands[pkg]) return null;
    const pkgCommand = pkgCommands[pkg][command];
    const templatedString = !pkgCommand
      ? null
      : template(pkgCommand, pipeToTemplate);
    const merged = {
      pkg,
      path: pkgCommands[pkg].path,
      type: assembledChanges.releases[pkg].type,
      manager: pkgCommands[pkg].manager,
      dependencies: pkgCommands[pkg].dependencies,
      [command]: !pkgCommand ? null : templatedString(pipeToTemplate),
    };

    return merged;
  });

  return commands;
};

// TODO: finish it, but do we need this even?
module.exports.removeSameGraphBumps = ({
  mergedChanges,
  assembledChanges,
  config,
  command,
}) => {
  if (command === "publish") return mergedChanges;

  const graph = Object.keys(config.packages).reduce((graph, pkg) => {
    if (!!config.packages[pkg].dependencies) {
      graph[pkg] = config.packages[pkg].dependencies;
    }
    return graph;
  }, {});

  const releases = mergedChanges.reduce((releases, release) => {
    releases[release.pkg] = release;
    return releases;
  }, {});

  return mergedChanges.reduce((finalChanges, currentChange) => {
    if (!!graph[currentChange.pkg] && !!graph[currentChange.pkg].dependencies) {
      let graphBumps = graph[currentChange.pkg].dependencies.map(
        (dep) => releases[dep].type
      );
    }

    return [...finalChanges, currentChange];
  }, []);
};
