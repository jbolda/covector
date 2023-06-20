import type {
  ConfigFile,
  Changed,
  ChangeParsed,
  Releases,
  PackageFile,
  DepsKeyed,
} from "@covector/types";

const resolveParents = ({
  config,
  allPackages,
}: {
  config: ConfigFile;
  allPackages?: Record<string, PackageFile>;
}) => {
  return Object.keys(config.packages).reduce(
    (parents: Record<string, Record<string, DepsKeyed>>, pkg) => {
      parents[pkg] = {};
      Object.keys(config.packages).forEach((parent) => {
        if (
          !!config.packages[parent].dependencies &&
          (config.packages[parent].dependencies ?? []).includes(pkg)
        ) {
          parents[pkg][parent] = !allPackages ? {} : allPackages?.[parent].deps;
        }
      });
      return parents;
    },
    {}
  );
};

export const changesConsideringParents = ({
  assembledChanges,
  config,
  allPackages,
  prereleaseIdentifier,
}: {
  assembledChanges: {
    releases: Releases;
    changes: ChangeParsed[];
  };
  config: ConfigFile;
  allPackages: Record<string, PackageFile>;
  prereleaseIdentifier?: string;
}) => {
  const parents = resolveParents({ config, allPackages });

  let initialChanges = Object.keys(assembledChanges.releases).reduce(
    (list: Changed, change) => {
      list[change] = assembledChanges.releases[change];
      list[change].parents = parents[change];
      return list;
    },
    {}
  );

  const releases = parentBump({
    initialChanges,
    parents,
    prereleaseIdentifier,
  });

  return {
    releases,
    changes: assembledChanges.changes,
  };
};

const parentBump = ({
  initialChanges,
  parents,
  prereleaseIdentifier,
}: {
  initialChanges: Changed;
  parents: any;
  prereleaseIdentifier?: string;
}): Changed => {
  let changes = { ...initialChanges };
  let recurse = false;
  Object.keys(initialChanges).forEach((main) => {
    if (Object.keys(changes[main].parents).length > 0) {
      Object.entries(changes[main].parents).forEach(([pkg, deps]) => {
        // if we can't find this package in the dependencies, mark it as none
        //   and presume that the intent is for it to receive a patch bump from a dep
        const prevDepVersion =
          deps?.[main]?.find((depTypes) => depTypes.type === "dependencies")
            ?.version || "none";
        const versionRequirementMatch = /[\^=~]/.exec(prevDepVersion);
        // pkg is the parent and main is the child
        if (
          !changes[pkg] &&
          (!versionRequirementMatch || prevDepVersion === "none")
        ) {
          // if the parent doesn't have a release
          //   and it doesn't have the dependency as a range
          //   add one to adopt the next version of it's child
          //   but don't use the changes as we will refer to this dep
          //   bump otherwise and pulling up the changelog is not needed
          changes[pkg] = {
            changes: [],
            parents: parents[pkg],
            // prerelease will do bump the X in `-beta.X` if it is already a prerelease
            // or it will do a prepatch if it isn't a prerelease
            type: !prereleaseIdentifier ? "patch" : "prerelease",
          };
          // we also need to presume recursion to update the parents' parents
          if (Object.values(parents[pkg]).length > 0) recurse = true;

          changes[pkg].changes?.forEach((parentChange) => {
            // this ends up overwriting in cases multiple bumps,
            //   we should adjust this to accept multiple
            if (
              !parentChange.meta.dependencies ||
              parentChange.meta.dependencies.length === 0
            ) {
              parentChange.meta.dependencies = [main];
            } else {
              parentChange.meta.dependencies.push(main);
            }
          });
        }
      });
    }
  });
  return recurse
    ? parentBump({ initialChanges: changes, parents, prereleaseIdentifier })
    : changes;
};
