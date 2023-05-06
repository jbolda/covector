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

        /**
         *  Renders a change file in the format:
         *
         * - [`<commit-hash>`](<commit-url>)([#<pr-number>](<pr-url>)) change file summary
         *
         */
        const renderRelease = (
          release: {
            summary: string;
            meta?: Meta;
          },
          indentation: number = 4
        ) => {
          // indent the summary so it fits under the new bullet point we added
          const summary = release.summary.replace(
            /\n/g,
            `\n${" ".repeat(indentation)}`
          );

          if (!release.meta || (!!release.meta && !release.meta.commits)) {
            addition += `\n- ${summary}`;
          } else {
            const commit = release.meta.commits![0];
            const commitLink = `[\`${commit.hashShort}\`](${gitSiteUrl}commit/${commit.hashLong})`;
            const [, pr] = /(#[0-9]+)/g.exec(commit.commitSubject) ?? [];
            const prLink = pr
              ? `([${pr}](${gitSiteUrl}pull/${pr.slice(1)}))`
              : "";

            addition += `\n- ${commitLink}${prLink} ${summary}`;
          }
        };

        const changeTags: { [k: string]: string } = {
          // ensures there is a `deps` tag if `none` is defined
          deps: "Dependencies",
          ...(config.changeTags ?? {}),
        };

        /**
         * Untagged changes are changes that don't have a tag associated with and `config.defaultChangeTag` is not set.
         * These will be rendered without a tag (section or category) at the beginning of a release changelog.
         */
        const untaggedChanges: {
          summary: string;
          meta?: Meta | undefined;
          tag?: string | undefined;
        }[] = [];
        const groupedChangesByTag: {
          [k: string]: {
            summary: string;
            meta?: Meta | undefined;
            tag?: string | undefined;
          }[];
        } = {};

        // **IMPORTANT**: prefill the `groupedChangesByTag` with tags from config
        // in the same order they were defined
        Object.keys(changeTags).forEach((k) => (groupedChangesByTag[k] = []));

        // fill `deps` tag
        const dependecies = Object.keys(
          assembledChanges.releases[change.changes.name].changes
            .filter((c) => c.meta?.dependencies)
            // reduce to an object of keys to avoid duplication of deps
            .reduce((acc, c) => {
              c.meta!.dependencies.forEach((dep) => (acc[dep] = 1));
              return acc;
            }, {} as { [k: string]: any })
        ).map((dep) => ({ summary: `Updated to latest \`${dep}\`` }));
        groupedChangesByTag.deps.push(...dependecies);

        assembledChanges.releases[change.changes.name].changes
          .filter((c) => !c.meta?.dependencies)
          .forEach((c) => {
            // fallback to `defaultChangeTag` if it is set, otherwise mark this change as untagged
            const key = c.tag ?? config.defaultChangeTag;
            if (key) {
              if (!groupedChangesByTag[key]) groupedChangesByTag[key] = [];
              groupedChangesByTag[key].push(c);
            } else {
              untaggedChanges.push(c);
            }
          });

        // render untagged changes freely at the top
        for (const release of untaggedChanges) {
          renderRelease(release);
        }

        // render tagged changes as:
        //
        // ### <Long tag1 name>
        //
        // - `1534ae12`(#12) Change1 summary
        // - `1534ae12`(#12) Change2 summary
        //
        // ### <Long tag2 name>
        //
        // - `1534ae12`(#12) Change1 summary
        // - `1534ae12`(#12) Change2 summary
        //
        // ...etc
        for (const [tag, change] of Object.entries(groupedChangesByTag)) {
          if (change.length !== 0) {
            // if the specified tag is not defined in config,
            // fallback to the short tag specified in the change file
            const longTag = changeTags[tag] ?? tag;
            addition += `\n### ${longTag}\n`;
            for (const release of change) {
              renderRelease(release);
            }
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
