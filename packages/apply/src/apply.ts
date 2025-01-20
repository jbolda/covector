import { type Operation } from "effection";
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
  DepTypes,
  Pkg,
  Logger,
} from "@covector/types";

export function* apply({
  logger,
  commands,
  allPackages,
  cwd = process.cwd(),
  bump = true,
  previewVersion = "",
  prereleaseIdentifier,
  logs = true,
}: {
  logger: Logger;
  commands: PackageCommand[];
  allPackages: Record<string, PackageFile>;
  cwd: string;
  bump: boolean;
  previewVersion: string;
  prereleaseIdentifier?: string;
  logs?: boolean;
}): Operation<PackageFile[]> {
  const changes = commands.reduce(
    (finalChanges: { [k: string]: PackageCommand }, command) => {
      finalChanges[command.pkg] = command;
      return finalChanges;
    },
    {}
  );

  const bumps = bumpAll({
    logger,
    changes,
    allPackages,
    previewVersion,
    logs,
    prereleaseIdentifier,
  });

  if (bump) {
    yield* writeAll({
      bumps: bumps.reduce(
        (final: PackageFile[], current) =>
          !current.file ? final : final.concat([current]),
        []
      ),
      cwd,
    });
  } else {
    bumps.forEach((b) => {
      if (!!b && logs)
        logger.info(
          `${b.name} planned to be bumped from ${b.currentVersion} to ${b.version}`
        );
    });
  }
  return bumps;
}

export function* validateApply({
  logger,
  commands,
  allPackages,
  prereleaseIdentifier,
}: {
  logger: Logger;
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
    logger,
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
      testSerializePkgFile({ logger, packageFile: bump });
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
    yield* writePkgFile({ packageFile: bump, cwd });
  }
};

const bumpAll = ({
  logger,
  changes,
  allPackages,
  logs = true,
  previewVersion = "",
  prereleaseIdentifier,
}: {
  logger: Logger;
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
      logger.info(`bumping ${pkg} with ${changes[pkg].type}`);
    } else if (previewVersion) {
      // change log (assume that the prerelease will be removed)
      logger.info(
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

  let next = semver.inc(pkg.version, bumpType, prereleaseIdentifier);
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

  if (pkg.pkg && pkg.file) {
    const currentPkg = pkg.pkg;
    const depTypes: DepTypes[] = [
      "dependencies",
      "devDependencies",
      "dev-dependencies",
      "build-dependencies",
      "target",
    ];
    const depPkg = packageFiles[dep];
    const depName = depPkg.pkg.package?.name || depPkg.pkg.name || dep;
    depTypes.forEach((property: DepTypes) => {
      if (property && property in currentPkg) {
        if (property === "target") {
          const targets = currentPkg[property] as object;
          for (const target of Object.values(targets)) {
            depTypes.forEach((property: DepTypes) => {
              if (property && property in target) {
                const version = getDepBumpVersion({
                  pkg,
                  currentPkg: target,
                  property,
                  depName,
                  dep,
                  previewVersion,
                  packageFiles,
                  getPreviousVersion: () => target[property][depName]?.version,
                });
                if (version) {
                  target[property][depName].version = version;
                }
              }
            });
          }
        } else {
          const version = getDepBumpVersion({
            pkg,
            currentPkg,
            property,
            depName,
            dep,
            previewVersion,
            packageFiles,
            getPreviousVersion: () =>
              getPackageFileVersion({ pkg, property, dep: depName }),
          });
          if (version) {
            pkg = setPackageFileVersion({
              pkg,
              version,
              property,
              dep: depName,
            });
          }
        }
      }
    });
  }

  return pkg;
};

const getDepBumpVersion = ({
  pkg,
  currentPkg,
  property,
  depName,
  dep,
  previewVersion,
  packageFiles,
  getPreviousVersion,
}: {
  pkg: PackageFile;
  currentPkg: any;
  property: DepTypes;
  depName: string;
  dep: string;
  previewVersion: string;
  packageFiles: Record<string, PackageFile>;
  getPreviousVersion: () => string;
}) => {
  const pkgProperties = Object.keys(currentPkg[property] as object) as Array<
    keyof Pkg
  >;
  for (const existingDep of pkgProperties) {
    // if pkg is in dep list
    if (existingDep === depName) {
      const prevVersion = getPreviousVersion();
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
      return version;
    }
  }
  return null;
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
