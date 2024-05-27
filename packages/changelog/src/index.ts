import { type Operation, all } from "effection";
import { readAllChangelogs } from "./get";
import { writeAllChangelogs } from "./write";
import unified from "unified";
import parse from "remark-parse";
import stringify from "remark-stringify";

import type {
  File,
  ConfigFile,
  PkgCommandResponse,
  AssembledChanges,
  Meta,
} from "@covector/types";

export { pullLastChangelog } from "./get";

export function* fillChangelogs({
  applied,
  assembledChanges,
  config,
  cwd,
  pkgCommandsRan,
  create = true,
  createContext,
}: {
  applied: { name: string; version: string }[];
  assembledChanges: AssembledChanges;
  config: ConfigFile;
  cwd: string;
  pkgCommandsRan?: { [k: string]: PkgCommandResponse };
  create?: boolean;
  createContext?: Operation<any>;
}): Operation<{ [k: string]: PkgCommandResponse } | undefined> {
  const changelogs = yield readAllChangelogs({
    applied: applied.reduce(
      (
        final: { name: string; version: string; changelog?: File }[],
        current
      ) =>
        !config.packages[current.name].path ? final : final.concat([current]),
      []
    ),
    packages: config.packages,
    cwd,
  });

  const writtenChanges: ChangedLog[] = yield applyChanges({
    changelogs,
    assembledChanges,
    config,
    applied,
    createContext,
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

const getVersionFromApplied = (
  name: string,
  applied: { name: string; version: string }[]
) => applied.find((pkg) => pkg.name === name)?.version;

/**
 *  Renders a change file in the format:
 *
 * - [`<commit-hash>`](<commit-url>)([#<pr-number>](<pr-url>)) change file summary
 *
 */
const renderRelease = (
  context: Record<string, Record<string, string>>,
  gitSiteUrl: string,
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
    return `\n- ${summary}`;
  } else {
    const commit = release.meta.commits![0];
    const commitLink = `[\`${commit.hashShort}\`](${gitSiteUrl}commit/${commit.hashLong})`;
    const matches = commit.commitSubject.match(/(#[0-9]+)/g) ?? [];
    const len = matches.length;
    const pr = len === 0 ? null : len === 1 ? matches[0] : matches[len - 1];
    const prLink = pr ? `([${pr}](${gitSiteUrl}pull/${pr.slice(1)}))` : "";
    const hashLookup = `sha_${commit.hashLong}`;
    const recognizeContributions = context?.[hashLookup]?.author
      ? ` by ${context[hashLookup].author}${
          context?.[hashLookup]?.reviewed
            ? `, reviewed by ${context[hashLookup].reviewed}`
            : ``
        }`
      : ``;

    return `\n- ${commitLink}${prLink} ${summary}${recognizeContributions}`;
  }
};

type Change = {
  changes: { name: string; version: string };
  changelog?: File;
};
type ChangedLog = { pkg: string; change: Change; addition: string };

function* defaultCreateContext(): Operation<
  Operation<{ context: Record<string, string>; changeContext: any }>
> {
  console.dir({ wrongContext: "bucko" });
  const context = {};
  return function* defineContexts(): Operation<{
    context: any;
    changeContext: any;
  }> {
    const changeContext = {};
    return { context, changeContext };
  };
}

function* applyChanges({
  changelogs,
  assembledChanges,
  config,
  applied,
  // @ts-expect-error
  createContext = defaultCreateContext,
}: {
  changelogs: Change[];
  assembledChanges: AssembledChanges;
  config: ConfigFile;
  applied: { name: string; version: string }[];
  createContext?: Operation<Operation<Record<string, string>>>;
}): Operation<ChangedLog[]> {
  const gitSiteUrl = !config.gitSiteUrl
    ? "/"
    : config.gitSiteUrl.replace(/\/$/, "") + "/";

  const processor: any = unified().use(parse).use(stringify, {
    bullet: "-",
    listItemIndent: "one",
  });

  const commits = [
    ...new Set(
      Object.values(assembledChanges.releases).flatMap((release) =>
        release.changes
          .map((change) => change.meta?.commits?.[0].hashLong)
          .filter(Boolean)
      )
    ),
  ];
  console.dir({ commits });
  // @ts-expect-error
  const createChangeContext = yield createContext({ commits });

  return yield all(
    changelogs.map(function* (change) {
      let additionChunks = [];
      if (change.changelog) {
        let changelog = processor.parse(change.changelog.content);
        if (!assembledChanges.releases[change.changes.name]) {
          additionChunks.push(
            `## [${change.changes.version}]\nBumped due to dependency.`
          );
        } else {
          additionChunks.push(`## [${change.changes.version}]`);

          const changeTags: { [k: string]: string } = config.changeTags ?? {};
          // ensures there is a `deps` tag if one wasn't defined
          if (!("deps" in changeTags)) {
            changeTags.deps = "Dependencies";
          }

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
          const dependencies = Object.keys(
            assembledChanges.releases[change.changes.name].changes
              .filter((c) => c.meta?.dependencies)
              // reduce to an object of keys to avoid duplication of deps
              .reduce(
                (acc, c) => {
                  c.meta!.dependencies.forEach((dep) => (acc[dep] = 1));
                  return acc;
                },
                {} as { [k: string]: any }
              )
          ).map((dep) => {
            const appliedVersion = getVersionFromApplied(dep, applied);
            return {
              summary: appliedVersion
                ? `Upgraded to \`${dep}@${appliedVersion}\``
                : `Upgraded to latest \`${dep}\``,
            };
          });
          groupedChangesByTag.deps.push(...dependencies);

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

          const {
            context,
          }: { context: Record<string, Record<string, string>> } =
            yield createChangeContext();

          // render untagged changes freely at the top
          for (const release of untaggedChanges) {
            additionChunks.push(renderRelease(context, gitSiteUrl, release));
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
              additionChunks.push(`\n### ${longTag}\n`);
              for (const release of change) {
                additionChunks.push(
                  renderRelease(context, gitSiteUrl, release)
                );
              }
            }
          }
        }

        const addition = additionChunks.join("");
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
      return {
        pkg: change.changes.name,
        change,
        addition: additionChunks.join(""),
      };
    })
  );
}
