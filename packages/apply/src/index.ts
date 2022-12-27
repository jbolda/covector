import { all, Operation } from "effection";
import {
  readPkgFile,
  writePkgFile,
  getPackageFileVersion,
  setPackageFileVersion,
  testSerializePkgFile,
} from "@covector/files";
import semver from "semver";
import { cloneDeep } from "lodash";

import type {
  PackageFile,
  ConfigFile,
  CommonBumps,
  ChangeParsed,
  Releases,
  PackageCommand,
} from "@covector/types";

export function* apply({
  commands,
  config,
  cwd = process.cwd(),
  bump = true,
  previewVersion = "",
  prereleaseIdentifier,
}: {
  commands: PackageCommand[];
  config: ConfigFile;
  cwd: string;
  bump: boolean;
  previewVersion: string;
  prereleaseIdentifier?: string;
}): Operation<PackageFile[]> {
  const changes = commands.reduce(
    (finalChanges: { [k: string]: PackageCommand }, command) => {
      finalChanges[command.pkg] = command;
      return finalChanges;
    },
    {}
  );

  let allPackages = yield readAll({ changes, config, cwd });
  const bumps = bumpAll({
    changes,
    allPackages,
    previewVersion,
    prereleaseIdentifier,
  });

  if (bump) {
    yield writeAll({
      bumps: bumps.reduce(
        (final: PackageFile[], current) =>
          !current.file ? final : final.concat([current]),
        []
      ),
      cwd,
    });
  } else {
    bumps.forEach((b) => {
      if (!!b) console.log(`${b.name} planned to be bumped to ${b.version}`);
    });
  }
  return bumps;
}

export function* validateApply({
  commands,
  config,
  cwd = process.cwd(),
  prereleaseIdentifier,
}: {
  commands: PackageCommand[];
  config: ConfigFile;
  cwd: string;
  prereleaseIdentifier?: string;
}): Operation<true | Error> {
  const changes = commands.reduce(
    (finalChanges: { [k: string]: PackageCommand }, command) => {
      finalChanges[command.pkg] = command;
      return finalChanges;
    },
    {}
  );
  let allPackages = yield readAll({ changes, config, cwd });

  const bumps = bumpAll({
    changes,
    allPackages,
    logs: false,
    prereleaseIdentifier,
  }).reduce(
    (final: PackageFile[], current) =>
      !current.file ? final : final.concat([current]),
    []
  );

  try {
    for (let bump of bumps) {
      testSerializePkgFile({ packageFile: bump });
    }
    // will throw on validation error and not return true
    return true;
  } catch (e) {
    throw e;
  }
}

function* readAll({
  changes,
  config,
  cwd = process.cwd(),
}: {
  changes: { [k: string]: { parents: string[] } };
  config: ConfigFile;
  cwd: string;
}): Operation<{ [k: string]: PackageFile }> {
  let templateShell: PackageFile = {
    version: "",
    pkg: { name: "", version: "" },
  };
  let files = Object.keys(changes).reduce(
    (fileList: { [k: string]: PackageFile }, change) => {
      fileList[change] = { ...templateShell };
      if (changes[change].parents && changes[change].parents.length > 0)
        changes[change].parents.forEach(
          (parent) => (fileList[parent] = { ...templateShell })
        );
      return fileList;
    },
    {}
  );

  const pkgs: string[] = Object.keys(files);
  const pkgFiles = yield all(
    Object.keys(files).map((pkg) =>
      !config.packages[pkg].path
        ? function* () {
            return { name: pkg };
          }
        : readPkgFile({
            cwd,
            pkgConfig: config.packages[pkg],
            nickname: pkg,
          })
    )
  );

  return pkgs.reduce((list, pkg, index) => {
    list[pkg] = pkgFiles[index];
    return list;
  }, files);
}

const writeAll = function* ({
  bumps,
  cwd,
}: {
  bumps: PackageFile[];
  cwd: string;
}) {
  for (let bump of bumps) {
    yield writePkgFile({ packageFile: bump, cwd });
  }
};

const resolveParents = ({ config }: { config: ConfigFile }) => {
  return Object.keys(config.packages).reduce(
    (parents: { [k: string]: string[] }, pkg) => {
      parents[pkg] = [];
      Object.keys(config.packages).forEach((parent) => {
        if (
          !!config.packages[parent].dependencies &&
          config.packages[parent].dependencies!.includes(pkg)
        )
          parents[pkg].push(parent);
      });
      return parents;
    },
    {}
  );
};

type Changed = {
  [k: string]: {
    parents: string[];
    type: CommonBumps;
    changes?: ChangeParsed[];
  };
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

  return {
    releases: parentBump(changes, parents, prereleaseIdentifier),
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
    if (changes[main].parents.length > 0) {
      changes[main].parents.forEach((pkg) => {
        // pkg is the parent and main is the child
        if (!!changes[pkg]) {
          // if a change is planned on the parent
          // we don't need to plan a release
        } else {
          // if the parent doesn't have a release
          // add one to adopt the next version of it's child
          changes[pkg] = {
            ...cloneDeep(changes[main]),
            // prerelease will do bump the X in `-beta.X` if it is already a prerelease
            // or it will do a prepatch if it isn't a prerelease
            type: !prereleaseIdentifier ? "patch" : "prerelease",
          };
          if (changes[pkg].changes) {
            changes[pkg].changes!.forEach((parentChange) => {
              parentChange.meta.dependencies = `Bumped due to a bump in ${main}.`;
            });
          }
          changes[pkg].parents = parents[pkg];
          // we also need to presume recursion to update the parents' parents
          recurse = true;
        }
      });
    }
  });
  return recurse ? parentBump(changes, parents, prereleaseIdentifier) : changes;
};

const bumpAll = ({
  changes,
  allPackages,
  logs = true,
  previewVersion = "",
  prereleaseIdentifier,
}: {
  changes: Releases;
  allPackages: Record<string, PackageFile>;
  logs?: boolean;
  previewVersion?: string;
  prereleaseIdentifier?: string;
}) => {
  // spread so that we can mutate
  let packageFiles = { ...allPackages };

  // loop through all packages and bump the main version for each
  //
  for (let pkg of Object.keys(changes)) {
    if (!packageFiles[pkg].file || changes[pkg].type === "noop") continue;

    if (logs && !previewVersion) {
      console.log(`bumping ${pkg} with ${changes[pkg].type}`);
    } else if (previewVersion) {
      // change log (assume that the prerelease will be removed)
      console.log(
        `bumping ${pkg} with ${previewVersion} identifier to publish a preview`
      );
    }

    // bump the package's version number
    packageFiles[pkg] = bumpMain({
      packageFile: packageFiles[pkg],
      bumpType: changes[pkg].type,
      previewVersion,
      prereleaseIdentifier,
      errorOnVersionRange: changes[pkg].errorOnVersionRange,
    });
  }

  for (let pkg of Object.keys(changes)) {
    // bump any deps that are in the monorepo
    // and have a version bump as well
    if (changes?.[pkg]?.dependencies) {
      let deps = changes?.[pkg]?.dependencies || [];
      for (let pkgDep of deps) {
        if (!!changes[pkgDep]) {
          packageFiles[pkg] = bumpDeps({
            packageFile: packageFiles[pkg],
            dep: pkgDep,
            previewVersion,
            packageFiles,
          });
        }
      }
    }
  }

  return Object.keys(packageFiles).map((pkg) => packageFiles[pkg]);
};

const bumpMain = ({
  packageFile,
  bumpType,
  previewVersion,
  prereleaseIdentifier,
  errorOnVersionRange,
}: {
  packageFile: PackageFile;
  bumpType: CommonBumps;
  previewVersion: string;
  prereleaseIdentifier?: string;
  errorOnVersionRange?: string;
}) => {
  let pkg = { ...packageFile };
  if (!pkg.version)
    throw new Error(`${pkg.name} does not have a version number.`);

  if (bumpType === "noop")
    throw new Error(`${pkg.name} needs a valid bump type, passed ${bumpType}`);

  if (prereleaseIdentifier && typeof prereleaseIdentifier !== "string")
    throw new Error(
      `${pkg.name} needs prereleaseIdentifier passed as a string`
    );

  let next = semver.inc(pkg.version, bumpType, undefined, prereleaseIdentifier);
  if (next) {
    pkg.version = next;
    pkg.versionMajor = semver.major(next);
    pkg.versionMinor = semver.minor(next);
    pkg.versionPatch = semver.patch(next);
    pkg.versionPrerelease = semver.prerelease(next);
  }
  const prevVersion = getPackageFileVersion({ pkg });
  const preVersionCleaned = semver.prerelease(prevVersion)
    ? semver.inc(prevVersion, "patch")
    : prevVersion;
  let version =
    previewVersion && previewVersion !== ""
      ? semver.valid(`${preVersionCleaned}-${previewVersion}`)
      : // @ts-ignore TODO bumpType should be narrowed to meet ReleaseType
        semver.inc(prevVersion, bumpType, prereleaseIdentifier);

  if (version) {
    pkg = setPackageFileVersion({ pkg, version });
    if (errorOnVersionRange && semver.satisfies(version, errorOnVersionRange)) {
      throw new Error(
        `${pkg.name} will be bumped to ${version}. ` +
          `This satisfies the range ${errorOnVersionRange} which the configuration disallows. ` +
          `Please adjust your bump to accommodate the range or otherwise adjust the allowed range in \`errorOnVersionRange\`.`
      );
    }
  }

  return pkg;
};

const bumpDeps = ({
  packageFile,
  dep,
  previewVersion,
  packageFiles,
}: {
  packageFile: PackageFile;
  dep: string;
  previewVersion: string;
  packageFiles: Record<string, PackageFile>;
}) => {
  let pkg = { ...packageFile };

  if (pkg.pkg && pkg.file)
    ["dependencies", "devDependencies", "dev-dependencies"].forEach(
      (property) => {
        // @ts-ignore
        if (pkg.pkg[property]) {
          // @ts-ignore
          Object.keys(pkg.pkg[property]).forEach((existingDep) => {
            // if pkg is in dep list
            if (existingDep === dep) {
              const prevVersion = getPackageFileVersion({ pkg, property, dep });

              const versionRequirementMatch = /[\^=~]/.exec(prevVersion);
              const versionRequirement = versionRequirementMatch
                ? versionRequirementMatch[0]
                : "";

              const version = deriveVersionConsideringPartials({
                dependency: dep,
                prevVersion,
                versionRequirement,
                previewVersion,
                packageFiles,
              });
              if (version) {
                pkg = setPackageFileVersion({
                  pkg,
                  version,
                  property,
                  dep,
                });
              }
            }
          });
        }
      }
    );

  return pkg;
};

const deriveVersionConsideringPartials = ({
  dependency,
  prevVersion,
  versionRequirement,
  previewVersion,
  packageFiles,
}: {
  dependency: string;
  prevVersion: string;
  versionRequirement: string;
  previewVersion: string;
  packageFiles: Record<string, PackageFile>;
}) => {
  if (previewVersion && previewVersion !== "") {
    const preVersionCleaned = semver.prerelease(prevVersion)
      ? semver.inc(prevVersion, "patch")
      : prevVersion;
    return semver.valid(`${preVersionCleaned}-${previewVersion}`);
  }

  const pkg = packageFiles[dependency];
  const { version, versionMajor, versionMinor, versionPatch } = pkg;

  if (!version) throw new Error(`${pkg.name} doesn't have a version?`);

  let depVersion = version;
  if (prevVersion.split(".").length === 2) {
    depVersion = `${versionMajor}.${versionMinor}`;
  } else if (prevVersion.split(".").length === 1) {
    depVersion = `${versionMajor}`;
  }

  return `${versionRequirement}${depVersion}`;
};
