import { all, Operation } from "effection";
import { readChangelog } from "@covector/files";
import unified from "unified";
import parse from "remark-parse";
import stringify from "remark-stringify";

import type { File, ConfigFile, Changelog, Logger } from "@covector/types";

export function* readAllChangelogs({
  logger,
  applied,
  packages,
  cwd,
  create = true,
}: {
  logger: Logger;
  applied: { name: string; version: string }[];
  packages: ConfigFile["packages"];
  cwd: string;
  create?: boolean;
}): Operation<Changelog[]> {
  const prepChangelogs = applied.map((change) =>
    readChangelog({
      logger,
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

export function* pullLastChangelog({
  logger,
  config,
  cwd,
}: {
  logger: Logger;
  config: ConfigFile;
  cwd: string;
}): Operation<{ [k: string]: { pkg: string; changelog: string } }> {
  const changelogs = yield readAllChangelogs({
    logger,
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
        .findIndex((node: any) => node.type === "heading" && node.depth === 2);
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
