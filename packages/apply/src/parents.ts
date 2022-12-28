import { cloneDeep } from "lodash";

import type {
  ConfigFile,
  Changed,
  ChangeParsed,
  Releases,
} from "@covector/types";

const resolveParents = ({ config }: { config: ConfigFile }) => {
  return Object.keys(config.packages).reduce(
    (parents: Record<string, Record<string, string>>, pkg) => {
      parents[pkg] = {};
      Object.keys(config.packages).forEach((parent) => {
        if (
          !!config.packages[parent].dependencies &&
          config.packages[parent].dependencies!.includes(pkg)
        )
          parents[pkg][parent] = "null";
      });
      return parents;
    },
    {}
  );
};

export const changesConsideringParents = ({
  assembledChanges,
  config,
  prereleaseIdentifier,
}: {
  assembledChanges: {
    releases: Releases;
    changes: ChangeParsed[];
  };
  config: ConfigFile;
  prereleaseIdentifier?: string;
}) => {
  const parents = resolveParents({ config });

  let changes = Object.keys(assembledChanges.releases).reduce(
    (list: Changed, change) => {
      list[change] = assembledChanges.releases[change];
      list[change].parents = parents[change];
      return list;
    },
    {}
  );

  const releases = parentBump(changes, parents, prereleaseIdentifier);

  return {
    releases,
    changes: assembledChanges.changes,
  };
};

const parentBump = (
  initialChanges: Changed,
  parents: any,
  prereleaseIdentifier?: string
): Changed => {
  let changes = { ...initialChanges };
  let recurse = false;
  Object.keys(initialChanges).forEach((main) => {
    if (Object.keys(changes[main].parents).length > 0) {
      Object.entries(changes[main].parents).forEach(([pkg, prevVersion]) => {
        const versionRequirementMatch = /[\^=~]/.exec(prevVersion);
        // pkg is the parent and main is the child
        if (!changes[pkg]) {
          // if the parent doesn't have a release
          // add one to adopt the next version of it's child
          changes[pkg] = {
            ...cloneDeep(changes[main]),
            // prerelease will do bump the X in `-beta.X` if it is already a prerelease
            // or it will do a prepatch if it isn't a prerelease
            type: !prereleaseIdentifier ? "patch" : "prerelease",
          };
        }
        if (changes[pkg].changes) {
          // what is meta doing here?
          // this ends up overwriting if there are multiple bumps so that feels odd
          changes[pkg].changes!.forEach((parentChange) => {
            parentChange.meta.dependencies = `Bumped due to a bump in ${main}.`;
          });
        }
        changes[pkg].parents = parents[pkg];
        console.info(JSON.stringify(changes[pkg], null, 2));
        // we also need to presume recursion to update the parents' parents
        if (parents[pkg].length > 0) recurse = true;
      });
    }
  });
  return recurse ? parentBump(changes, parents, prereleaseIdentifier) : changes;
};
