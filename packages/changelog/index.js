const { readChangelog, writeChangelog } = require("@covector/files");
const path = require("path");
const unified = require("unified");
const parse = require("remark-parse");
const stringify = require("remark-stringify");

const processor = unified().use(parse).use(stringify);

module.exports.fillChangelogs = async ({ changeList, cwd }) => {
  const changelogs = await readAllChangelogs({ changeList, cwd });
  const writtenChanges = applyChanges({ changelogs });
  return await writeAllChangelogs({ writtenChanges });
};

const readAllChangelogs = ({ changeList, cwd }) => {
  return Promise.all(
    changeList.map((change) =>
      readChangelog({ change, cwd: path.join(cwd, change.path) })
    )
  ).then((changelogs) =>
    changelogs.map((changelog, index) => ({
      changes: changeList[index],
      changelog,
    }))
  );
};

const applyChanges = ({ changelogs }) => {
  return changelogs.map((change) => {
    let changelog = processor.parse(change.changelog.contents);
    const addition = processor.parse(change.changes.type);
    const changelogFirstElement = changelog.children.shift();
    const changelogRemainingElements = changelog.children;
    changelog.children = [].concat(
      changelogFirstElement,
      addition.children,
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
