import { all, Operation } from "effection";
import {
  writePkgFile,
  getPackageFileVersion,
  setPackageFileVersion,
  testSerializePkgFile,
} from "@covector/files";
import semver from "semver";

import type {
  PackageFile,
  CommonBumps,
  Releases,
  PackageCommand,
} from "@covector/types";

export function* apply({
  commands,
  allPackages,
  cwd = process.cwd(),
  bump = true,
  previewVersion = "",
  prereleaseIdentifier,
}: {
  commands: PackageCommand[];
  allPackages: Record<string, PackageFile>;
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
  allPackages,
  prereleaseIdentifier,
}: {
  commands: PackageCommand[];
  allPackages: Record<string, PackageFile>;
  prereleaseIdentifier?: string;
}): Operation<true | Error> {
  const changes = commands.reduce(
    (finalChanges: { [k: string]: PackageCommand }, command) => {
      finalChanges[command.pkg] = command;
      return finalChanges;
    },
    {}
  );

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
  for (let pkg of Object.keys(changes)) {
    if (!packageFiles[pkg]?.file || changes[pkg].type === "noop") continue;

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

  return Object.keys(packageFiles)
    .filter((pkg) => changes?.[pkg])
    .map((pkg) => packageFiles[pkg]);
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
      : semver.inc(prevVersion, bumpType, prereleaseIdentifier);

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
        //@ts-expect-error
        if (pkg.pkg[property]) {
          //@ts-expect-error
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
