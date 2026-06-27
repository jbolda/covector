import { all, Operation } from "effection";
import { readChangelog } from "@covector/files";

import type {
  LoadedFile,
  ConfigFile,
  Changelog,
  Logger,
} from "@covector/types";

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
  const loadedChangelogs = yield* all(prepChangelogs);
  const mapped = loadedChangelogs.map((changelog, index) => ({
    changes: applied[index],
    changelog,
  }));
  return mapped.filter(
    (changelog): changelog is Changelog => !!changelog.changelog
  );
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
  const changelogs = yield* readAllChangelogs({
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
    changelog?: LoadedFile;
  }[];
}) => {
  return changelogs.map((change) => {
    if (change.changelog) {
      const lines = change.changelog.content.split("\n");
      let inCodeBlock = false;
      let firstH2 = -1;
      let secondH2 = lines.length;
      // walk lines, skip code blocks, find first `##` heading boundary
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith("```")) inCodeBlock = !inCodeBlock;
        if (!inCodeBlock && line.startsWith("## ")) {
          if (firstH2 === -1) firstH2 = i;
          else {
            secondH2 = i;
            break;
          }
        }
      }

      const changelog =
        firstH2 === -1 ? "" : lines.slice(firstH2, secondH2).join("\n");
      return {
        pkg: change.changes.name,
        changelog,
      };
    } else {
      return {
        pkg: change.changes.name,
        changelog: "",
      };
    }
  });
};
