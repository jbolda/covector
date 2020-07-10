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
  pkgCommandsRan,
  create = true,
}) => {
  const changelogs = await readAllChangelogs({
    applied: applied.reduce(
      (final, current) =>
        !config.packages[current.name].path ? final : final.concat([current]),
      []
    ),
    packages: config.packages,
    cwd,
  });

  const writtenChanges = applyChanges({
    changelogs,
    assembledChanges,
    config,
  });

  if (create) {
    await writeAllChangelogs({ writtenChanges });
  }

  if (!pkgCommandsRan) {
    return;
  } else {
    pkgCommandsRan = Object.keys(pkgCommandsRan).reduce((pkgs, pkg) => {
      writtenChanges.forEach((change) => {
        if (change.pkg === pkg) {
          pkgs[pkg].command = change.addition;
        }
      });
      return pkgs;
    }, pkgCommandsRan);

    return pkgCommandsRan;
  }
};

const readAllChangelogs = ({ applied, packages, cwd }) => {
  return Promise.all(
    applied.map((change) =>
      readChangelog({
        change,
        cwd: path.join(cwd, packages[change.name].path),
      })
    )
  ).then((changelogs) =>
    changelogs.map((changelog, index) => ({
      changes: applied[index],
      changelog,
    }))
  );
};

const applyChanges = ({ changelogs, assembledChanges, config }) => {
  const gitSiteUrl = !config.gitSiteUrl
    ? "/"
    : config.gitSiteUrl.replace(/\/$/, "") + "/";
  return changelogs.map((change) => {
    let changelog = processor.parse(change.changelog.contents);
    let addition = "";
    if (!assembledChanges.releases[change.changes.name]) {
      addition = `## [${change.changes.version}]\nBumped due to dependency.`;
    } else {
      addition = assembledChanges.releases[change.changes.name].changes.reduce(
        (finalString, release) =>
          !release.meta || (!!release.meta && !release.meta.commits)
            ? `${finalString}\n- ${release.summary}`
            : `${finalString}\n- ${release.summary}\n${
                !release.meta.dependencies
                  ? ""
                  : `    - ${release.meta.dependencies}\n`
              }${release.meta.commits
                .map(
                  (commit) =>
                    `    - [${commit.hashShort}](${gitSiteUrl}commit/${
                      commit.hashLong
                    }) ${commit.commitSubject.replace(
                      /(#[0-9])\w/g,
                      (match) =>
                        `[${match}](${gitSiteUrl}pull/${match.substr(
                          1,
                          999999
                        )})`
                    )} on ${commit.date}`
                )
                .join("\n")}`,
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
    return { pkg: change.changes.name, change, addition };
  });
};

const writeAllChangelogs = ({ writtenChanges }) => {
  return Promise.all(
    writtenChanges.map((changelog) => writeChangelog({ ...changelog.change }))
  );
};
