import { all } from "effection";
import { readChangelog, writeChangelog } from "@covector/files";
import unified from "unified";
import parse from "remark-parse";
import stringify from "remark-stringify";

import type {
  File,
  ConfigFile,
  Changelog,
  PkgCommandResponse,
  AssembledChanges,
} from "@covector/types";

export function* fillChangelogs({
  applied,
  assembledChanges,
  config,
  cwd,
  pkgCommandsRan,
  create = true,
}: {
  applied: { name: string; version: string }[];
  assembledChanges: AssembledChanges;
  config: ConfigFile;
  cwd: string;
  pkgCommandsRan?: { [k: string]: PkgCommandResponse };
  create?: boolean;
}): Generator<
  any,
  | {
      [k: string]: PkgCommandResponse;
    }
  | undefined,
  any
> {
  const changelogs = yield readAllChangelogs({
    applied: applied.reduce(
      (final: { name: string; version: string; changelog?: File }[], current) =>
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
    yield writeAllChangelogs({ writtenChanges, cwd });
  }

  if (!pkgCommandsRan) {
    return;
  } else {
    pkgCommandsRan = Object.keys(pkgCommandsRan).reduce(
      (pkgs: { [k: string]: PkgCommandResponse }, pkg) => {
        writtenChanges.forEach((change) => {
          if (change.pkg === pkg) {
            pkgs[pkg].command = change.addition;
          }
        });
        return pkgs;
      },
      pkgCommandsRan
    );

    return pkgCommandsRan;
  }
}

export function* pullLastChangelog({
  config,
  cwd,
}: {
  config: ConfigFile;
  cwd: string;
}): Generator<any, { [k: string]: { pkg: string; changelog: string } }, any> {
  const changelogs = yield readAllChangelogs({
    applied: Object.keys(config.packages).map((pkg) => ({
      name: pkg,
      version: "",
    })),
    packages: config.packages,
    cwd,
    create: false,
  });

  const pulledChanges = pullChanges({
    changelogs,
  });

  return pulledChanges.reduce(
    (changelogs: { [k: string]: { pkg: string; changelog: string } }, pkg) => {
      changelogs[pkg.pkg] = pkg;
      return changelogs;
    },
    {}
  );
}

export const pipeChangelogToCommands = async ({
  changelogs,
  pkgCommandsRan,
}: {
  changelogs: { [k: string]: { pkg: string; changelog: string } };
  pkgCommandsRan: { [k: string]: PkgCommandResponse };
}) =>
  Object.keys(pkgCommandsRan).reduce(
    (pkgs: { [k: string]: PkgCommandResponse }, pkg) => {
      Object.keys(changelogs).forEach((pkg) => {
        if (pkgs[pkg]) {
          pkgs[pkg].command = changelogs[pkg].changelog;
        }
      });
      return pkgs;
    },
    pkgCommandsRan
  );

function* readAllChangelogs({
  applied,
  packages,
  cwd,
  create = true,
}: {
  applied: { name: string; version: string }[];
  packages: ConfigFile["packages"];
  cwd: string;
  create?: boolean;
}): Generator<any, Changelog[], any> {
  const prepChangelogs = applied.map((change) =>
    readChangelog({
      cwd,
      packagePath: packages[change.name].path,
      create,
    })
  );
  const loadedChangelogs: File[] = yield all(prepChangelogs);
  return loadedChangelogs.map((changelog, index) => ({
    changes: applied[index],
    changelog,
  }));
}

const applyChanges = ({
  changelogs,
  assembledChanges,
  config,
}: {
  changelogs: {
    changes: { name: string; version: string };
    changelog?: File;
  }[];
  assembledChanges: AssembledChanges;
  config: ConfigFile;
}) => {
  const gitSiteUrl = !config.gitSiteUrl
    ? "/"
    : config.gitSiteUrl.replace(/\/$/, "") + "/";

  const processor: any = unified().use(parse).use(stringify, {
    bullet: "-",
    listItemIndent: "one",
  });

  return changelogs.map((change) => {
    let addition = "";
    if (change.changelog) {
      let changelog = processor.parse(change.changelog.content);
      if (!assembledChanges.releases[change.changes.name]) {
        addition = `## [${change.changes.version}]\nBumped due to dependency.`;
      } else {
        addition = assembledChanges.releases[
          change.changes.name
        ].changes.reduce(
          (finalString, release) =>
            !release.meta || (!!release.meta && !release.meta.commits)
              ? `${finalString}\n- ${release.summary}`
              : `${finalString}\n- ${release.summary}\n${
                  !release.meta.dependencies
                    ? ""
                    : `  - ${release.meta.dependencies}\n`
                }${release.meta
                  .commits!.map(
                    (commit) =>
                      `  - [${commit.hashShort}](${gitSiteUrl}commit/${
                        commit.hashLong
                      }) ${commit.commitSubject.replace(
                        /(#[0-9]+)/g,
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
      change.changelog.content = processor.stringify(changelog);
    }
    return { pkg: change.changes.name, change, addition };
  });
};

const pullChanges = ({
  changelogs,
}: {
  changelogs: {
    changes: { name: string; version: string };
    changelog?: File;
  }[];
}) => {
  const processor: any = unified().use(parse).use(stringify, {
    bullet: "-",
    listItemIndent: "one",
  });

  return changelogs.map((change) => {
    if (change.changelog) {
      let changelogParsed = processor.parse(change.changelog.content);
      const startNode = 1;
      const nextNode: number = changelogParsed.children
        .slice(startNode + 1)
        .findIndex((node: any) => node.type === "heading");
      const endNode =
        nextNode && nextNode > 0 ? nextNode + startNode + 1 : 9999;
      let changelogAST = {
        ...changelogParsed,
        children: changelogParsed.children.slice(startNode, endNode),
      };
      const changelog = processor.stringify(changelogAST);
      return {
        pkg: change.changes.name,
        changelog,
      };
    } else {
      return {
        pkg: change.changes.name,
        changelog: false,
      };
    }
  });
};

function* writeAllChangelogs({
  writtenChanges,
  cwd,
}: {
  writtenChanges: {
    pkg: string;
    change: {
      changes: {
        name: string;
        version: string;
      };
      changelog?: File;
    };
    addition: string;
  }[];
  cwd: string;
}): Generator<any, any, any> {
  return yield all(
    writtenChanges.map((changes) => {
      const { changelog } = changes.change;
      if (changelog) {
        return writeChangelog({ changelog, cwd });
      } else {
        throw new Error(`Changelog not properly created: ${changes}`);
      }
    })
  );
}
