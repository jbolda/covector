const { readChangelog, writeChangelog } = require("@covector/files");
const path = require("path");
const unified = require("unified");
const parse = require("remark-parse");
const stringify = require("remark-stringify");

const processor = unified().use(parse).use(stringify);

module.exports.fillChangelogs = async ({
  applied,
  assembledChanges,
  config,
  cwd,
  create = true,
}) => {
  const changelogs = await readAllChangelogs({ applied, config, cwd });
  const writtenChanges = applyChanges({
    changelogs,
    assembledChanges,
  });
  if (create) {
    return await writeAllChangelogs({ writtenChanges });
  } else {
    return;
  }
};

const readAllChangelogs = ({ applied, config, cwd }) => {
  return Promise.all(
    applied.map((change) =>
      readChangelog({
        change,
        cwd: path.join(cwd, config.packages[change.name].path),
      })
    )
  ).then((changelogs) =>
    changelogs.map((changelog, index) => ({
      changes: applied[index],
      changelog,
    }))
  );
};

const applyChanges = ({ changelogs, assembledChanges }) => {
  return changelogs.map((change) => {
    let changelog = processor.parse(change.changelog.contents);
    let addition = "";
    if (!assembledChanges.releases[change.changes.name]) {
      addition = `## [${change.changes.version}]\nBumped due to dependency.`;
    } else {
      addition = assembledChanges.releases[change.changes.name].changes.reduce(
        (finalString, release) => `${finalString}\n - ${release.summary}`,
        `## [${change.changes.version}]`
      );
    }
    const parsedAddition = processor.parse(addition);
    const changelogFirstElement = changelog.children.shift();
    const changelogRemainingElements = changelog.children;
    changelog.children = [].concat(
      changelogFirstElement,
      parsedAddition.children,
      changelogRemainingElements
    );
    change.changelog.contents = processor.stringify(changelog);
    return change;
  });
};

const writeAllChangelogs = ({ writtenChanges }) => {
  return Promise.all(
    writtenChanges.map((changelog) => writeChangelog({ ...changelog }))
  );
};
