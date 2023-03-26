import { all, Operation } from "effection";
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
  Meta,
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
}): Operation<{ [k: string]: PkgCommandResponse } | undefined> {
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
}): Operation<{ [k: string]: { pkg: string; changelog: string } }> {
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
}): Operation<Changelog[]> {
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
        addition = `## [${change.changes.version}]`;

        const renderRelease = (
          release: {
            summary: string;
            meta?: Meta | undefined;
          },
          indentation: number,
          indentFirstLine = false
        ) => {
          // indent the summary so it fits under the bullet point
          const summary = release.summary.replace(
            /\n/g,
            `\n${"  ".repeat(indentFirstLine ? indentation + 2 : indentation)}`
          );
          const firstLinIndent = indentFirstLine
            ? "  ".repeat(indentation)
            : "";

          if (!release.meta || (!!release.meta && !release.meta.commits)) {
            addition += `\n${firstLinIndent}- ${summary}`;
          } else {
            const commit = release.meta.commits![0];

            const commitLink = `[\`${commit.hashShort}\`](${gitSiteUrl}commit/${commit.hashLong})`;

            const [, pr] = /(#[0-9]+)/g.exec(commit.commitSubject) ?? [];
            const prLink = pr
              ? `([${pr}](${gitSiteUrl}pull/${pr.slice(1)}))`
              : "";

            addition += `\n${firstLinIndent}- ${commitLink}${prLink} ${summary}`;
          }
        };

        for (const release of assembledChanges.releases[
          change.changes.name
        ].changes.filter((c) => !c.meta?.dependencies)) {
          renderRelease(release, 1);
        }

        const groupedDpesChanges: {
          [k: string]: {
            summary: string;
            meta?: Meta | undefined;
          }[];
        } = {};

        assembledChanges.releases[change.changes.name].changes
          .filter((c) => c.meta?.dependencies)
          .forEach((r) => {
            r.meta!.dependencies.forEach((key) => {
              if (!groupedDpesChanges[key]) groupedDpesChanges[key] = [];
              groupedDpesChanges[key].push(r);
            });
          });

        if (Object.keys(groupedDpesChanges).length !== 0) {
          for (const pkg of Object.keys(groupedDpesChanges)) {
            addition += `\n- Bumped due to a bump in \`${pkg}\``;
          }
        }
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
}): Operation<any> {
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
