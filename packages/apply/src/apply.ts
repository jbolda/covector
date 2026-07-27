import { type Operation } from "effection";
import {
  writePkgFile,
  saveFile,
  readCargoWorkspaceRoots,
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
  previewVersion?: string;
  prereleaseIdentifier?: string;
  logs?: boolean;
}): Operation<PackageFile[]> {
  const changes = commands.reduce(
    (finalChanges: { [k: string]: PackageCommand }, command) => {
      finalChanges[command.pkg] = command;
      return finalChanges;
    },
    {},
  );

  const bumps = yield* bumpAll({
    logger,
    changes,
    allPackages,
    previewVersion,
    logs,
    prereleaseIdentifier,
  });

  if (bump) {
    const bumpsToWrite = bumps.reduce(
      (final: PackageFile[], current) =>
        !current.file ? final : final.concat([current]),
      [],
    );
    yield* writeAll({ bumps: bumpsToWrite, cwd });
    yield* applyWorkspaceRootDepBumps({
      logger,
      bumps: bumpsToWrite,
      allPackages,
      cwd,
      previewVersion,
      logs,
    });
  } else {
    for (const b of bumps) {
      if (!!b && logs) {
        yield* logger.info(
          `${b.name} planned to be bumped from ${b.currentVersion} to ${b.version}`,
        );
      }
    }
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
    {},
  );

  const bumps = (yield* bumpAll({
    logger,
    changes,
    allPackages,
    logs: false,
    prereleaseIdentifier,
  })).reduce(
    (final: PackageFile[], current) =>
      !current.file ? final : final.concat([current]),
    [],
  );

  try {
    for (let bump of bumps) {
      yield* testSerializePkgFile({ logger, packageFile: bump });
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

// a cargo workspace root manifest can declare version requirements for
// member packages in its [workspace.dependencies] table, outside the
// members' own manifests. bump those requirements here to track each bumped
// member's new version. entries without a version (path-only) and `*`
// requirements float on the workspace and are left untouched
function* applyWorkspaceRootDepBumps({
  logger,
  bumps,
  allPackages,
  cwd,
  previewVersion = "",
  logs = true,
}: {
  logger: Logger;
  bumps: PackageFile[];
  allPackages: Record<string, PackageFile>;
  cwd: string;
  previewVersion?: string;
  logs?: boolean;
}): Operation<void> {
  const cargoBumps = bumps.filter(
    (b) =>
      !!b.name && b.file?.filename === "Cargo" && b.file?.extname === ".toml",
  );
  if (cargoBumps.length === 0) return;

  // deriveVersionConsideringPartials reads the bumped version off the
  // package file record
  const packageFiles = { ...allPackages };
  for (const b of cargoBumps) {
    packageFiles[b.name!] = b;
  }

  const bumpRequirement = ({
    prevVersion,
    dependency,
  }: {
    prevVersion: string;
    dependency: string;
  }) => {
    // `*` floats on whatever version the workspace holds
    if (prevVersion === "*") return null;
    // comparator/compound ranges (`>=1.2, <2`) and wildcard requirements
    // (`1.*`, `1.x`) float by design and have no single-pin rewrite; leave
    // them untouched rather than collapsing them to a pin (range bump
    // policy is tracked in #184)
    if (/[<>,| ]/.test(prevVersion) || /(^|\.)[xX*](\.|$)/.test(prevVersion))
      return null;
    const versionRequirementMatch = /[\^=~]/.exec(prevVersion);
    const versionRequirement = versionRequirementMatch
      ? versionRequirementMatch[0]
      : "";
    const version = deriveVersionConsideringPartials({
      dependency,
      prevVersion,
      versionRequirement,
      previewVersion,
      packageFiles,
    });
    // a partial pin such as `"2.11"` may already cover the bumped version
    if (!version || version === prevVersion) return null;
    return version;
  };

  const roots = yield* readCargoWorkspaceRoots({
    memberManifestPaths: cargoBumps.map((b) => b.file!.path),
    cwd,
  });

  for (const root of roots) {
    let modified = false;
    for (const b of cargoBumps) {
      const depName = b.pkg.package?.name || b.pkg.name || b.name!;
      const key = `workspace.dependencies.${depName}`;
      if (!root.doc.has(key)) continue;
      const entry = root.doc.get(key);
      const prevVersion = typeof entry === "string" ? entry : entry?.version;
      if (typeof prevVersion !== "string" || prevVersion === "") continue;

      const version = bumpRequirement({ prevVersion, dependency: b.name! });
      if (!version) continue;

      root.doc.set(typeof entry === "string" ? key : `${key}.version`, version);
      modified = true;
      if (logs) {
        yield* logger.info(
          `bumping ${depName} in ${root.file.path} [workspace.dependencies] to ${version}`,
        );
      }
    }
    if (modified) {
      yield* saveFile({ ...root.file, content: root.doc.toString() }, cwd);
    }
  }
}

function* bumpAll({
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
}): Operation<PackageFile[]> {
  // spread so that we can mutate
  let packageFiles = { ...allPackages };

  // loop through all packages and bump the main version for each
  for (let pkg of Object.keys(changes)) {
    if (!packageFiles[pkg]?.file || changes[pkg].type === "noop") continue;

    if (logs && !previewVersion) {
      yield* logger.info(`bumping ${pkg} with ${changes[pkg].type}`);
    } else if (previewVersion) {
      // change log (assume that the prerelease will be removed)
      yield* logger.info(
        `bumping ${pkg} with ${previewVersion} identifier to publish a preview`,
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
}

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
      `${pkg.name} needs prereleaseIdentifier passed as a string`,
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
          `Please adjust your bump to accommodate the range or otherwise adjust the allowed range in \`errorOnVersionRange\`.`,
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
  getPreviousVersion: () => string | undefined;
}) => {
  const pkgProperties = Object.keys(currentPkg[property] as object) as Array<
    keyof Pkg
  >;
  for (const existingDep of pkgProperties) {
    // if pkg is in dep list
    if (existingDep === depName) {
      const prevVersion = getPreviousVersion();
      // a dependency can carry no version of its own: a cargo
      // `{ workspace = true }` or path-only declaration reads back empty,
      // and one within a `[target]` table reads back undefined. either way
      // there is nothing here to bump
      if (!prevVersion) return null;
      // a pnpm catalog reference (`catalog:` or `catalog:groupname`) points at
      // a range kept in pnpm-workspace.yaml and is rewritten by pnpm at
      // publish time, so there is no version in the declaration to bump
      if (prevVersion.startsWith("catalog:")) return null;
      // the pnpm/yarn workspace protocol pins `workspace:*` / `workspace:^` /
      // `workspace:~` deps to whatever version the workspace holds, and the
      // package manager rewrites them at publish time, so there is no version
      // in the declaration to bump (aliased deps, `workspace:name@range`, are
      // also left alone); an embedded range such as `workspace:^1.2.3` keeps
      // the protocol prefix and bumps the range within it
      const workspaceProtocol = prevVersion.startsWith("workspace:");
      const range = workspaceProtocol
        ? prevVersion.slice("workspace:".length)
        : prevVersion;
      if (
        workspaceProtocol &&
        (range === "*" || range === "^" || range === "~" || range.includes("@"))
      ) {
        return null;
      }

      const versionRequirementMatch = /[\^=~]/.exec(range);
      const versionRequirement = versionRequirementMatch
        ? versionRequirementMatch[0]
        : "";

      const version = deriveVersionConsideringPartials({
        dependency: dep,
        prevVersion: range,
        versionRequirement,
        previewVersion,
        packageFiles,
      });
      if (!version) return version;
      return workspaceProtocol ? `workspace:${version}` : version;
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
