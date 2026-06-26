import type {
  ConfigFile,
  PackageFile,
  DepsKeyed,
  AssembledPlan,
  ReleaseParsed,
  AssembledPlanParsed,
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
  assembledPlan,
  config,
  allPackages,
  prereleaseIdentifier,
}: {
  assembledPlan: AssembledPlan;
  config: ConfigFile;
  allPackages: Record<string, PackageFile>;
  prereleaseIdentifier?: string;
}): AssembledPlanParsed => {
  const parents = resolveParents({ config, allPackages });

  let initialChanges = !assembledPlan?.releases
    ? {}
    : Object.keys(assembledPlan.releases).reduce(
        (list: AssembledPlan["releases"], change) => {
          list[change] = assembledPlan.releases![change];
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
    changes: assembledPlan.changes,
  };
};

const parentBump = ({
  initialChanges,
  parents,
  prereleaseIdentifier,
}: {
  initialChanges: AssembledPlan["releases"] | { [k: string]: ReleaseParsed };
  parents: Record<string, Record<string, DepsKeyed>>;
  prereleaseIdentifier?: string;
}): { [k: string]: ReleaseParsed } => {
  let changes = { ...initialChanges } as { [k: string]: ReleaseParsed };
  let recurse = false;
  Object.keys(initialChanges).forEach((main) => {
    const changeParent = changes[main]?.parents ?? {};
    if (Object.keys(changeParent).length > 0) {
      Object.entries(changeParent).forEach(([pkg, deps]) => {
        // if we can't find this package in the dependencies, mark it as none
        //   and presume that the intent is for it to receive a patch bump from a dep
        const prevDepVersion =
          deps?.[main]?.find((depTypes) => depTypes.type === "dependencies")
            ?.version || "none";
        const versionRequirementMatch = /[\^=~]/.exec(prevDepVersion);
        // pkg is the parent and main is the child
        if (!versionRequirementMatch || prevDepVersion === "none") {
          // if the parent doesn't have a release
          //   and it doesn't have the dependency as a range
          //   add one to adopt the next version of it's child
          //   but don't use the changes as we will refer to this dep
          //   bump otherwise and pulling up the changelog is not needed
          if (!changes[pkg]) {
            changes[pkg] = {
              changes: [
                {
                  meta: { dependencies: [main], path: "" },
                  summary: "",
                  releases: {},
                },
              ],
              parents: parents[pkg],
              // prerelease will do bump the X in `-beta.X` if it is already a prerelease
              // or it will do a prepatch if it isn't a prerelease
              type: !prereleaseIdentifier ? "patch" : "prerelease",
            };
            // we also need to presume recursion to update the parents' parents
            if (Object.values(parents[pkg]).length > 0) recurse = true;
          } else {
            // if we have have a release planned, add a skeleton so it shows
            //  in the deps bump section
            changes[pkg].changes?.push({
              meta: { dependencies: [main], path: "" },
              summary: "",
              releases: {},
            });
          }
        }
      });
    }
  });
  return recurse
    ? parentBump({ initialChanges: changes, parents, prereleaseIdentifier })
    : changes;
};
