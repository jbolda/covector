import {
  readPkgFile,
  writePkgFile,
  testSerializePkgFile,
  PackageFile,
  ConfigFile,
} from "@covector/files";
import { compareBumps, CommonBumps } from "@covector/assemble";
import semver from "semver";
import { cloneDeep } from "lodash";
import path from "path";

type ChangeParsed = {
  releases: {[k: string]: string}
  summary: string
  meta: {dependencies: string}
}

type Releases = {
  [k: string]: {
    parents: string[];
    type: CommonBumps;
    dependencies?: string[];
    changes?: ChangeParsed[];
  };
};

type PackageCommand = {
  pkg: string;
  dependencies?: string[];
  manager?: string;
  path: string;
  type: CommonBumps;
  parents: string[];
};

export const apply = function* ({
  commands,
  config,
  cwd = process.cwd(),
  bump = true,
  previewVersion = '',
}: {
  commands: PackageCommand[];
  config: ConfigFile;
  cwd: string;
  bump: boolean;
  previewVersion: string;
}) {
  const changes = commands.reduce(
    (finalChanges: { [k: string]: PackageCommand }, command) => {
      finalChanges[command.pkg] = command;
      return finalChanges;
    },
    {}
  );

  // @ts-ignore since TS doesn't like yielding on a Promise
  let allPackages = yield readAll({ changes, config, cwd });
  const bumps = bumpAll({ changes, allPackages, previewVersion });

  if (bump) {
    yield writeAll({
      bumps: bumps.reduce(
        (final: PackageFile[], current) =>
          !current.vfile ? final : final.concat([current]),
        []
      ),
    });
  } else {
    bumps.forEach((b) => {
      if (!!b) console.log(`${b.name} planned to be bumped to ${b.version}`);
    });
  }
  return bumps;
};

export const validateApply = async ({
  commands,
  config,
  cwd = process.cwd(),
}: {
  commands: PackageCommand[];
  config: ConfigFile;
  cwd: string;
}) => {
  const changes = commands.reduce(
    (finalChanges: { [k: string]: PackageCommand }, command) => {
      finalChanges[command.pkg] = command;
      return finalChanges;
    },
    {}
  );
  let allPackages = await readAll({ changes, config, cwd });

  const bumps = bumpAll({ changes, allPackages, logs: false }).reduce(
    (final: PackageFile[], current) =>
      !current.vfile ? final : final.concat([current]),
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
};

const readAll = async ({
  changes,
  config,
  cwd = process.cwd(),
}: {
  changes: { [k: string]: { parents: string[] } };
  config: ConfigFile;
  cwd: string;
}): Promise<{ [k: string]: PackageFile }> => {
  let templateShell: PackageFile = {
    version: "",
    pkg: { name: "", version: "" },
  };
  let files = Object.keys(changes).reduce(
    (fileList: { [k: string]: PackageFile }, change) => {
      fileList[change] = { ...templateShell };
      if (changes[change].parents.length > 0)
        changes[change].parents.forEach(
          (parent) => (fileList[parent] = { ...templateShell })
        );
      return fileList;
    },
    {}
  );

  const pkgs: string[] = Object.keys(files);
  const pkgFiles = await Promise.all(
    Object.keys(files).map((pkg) =>
      !config.packages[pkg].path
        ? { name: pkg }
        : readPkgFile({
            file: path.join(
              cwd,
              //@ts-ignore
              config.packages[pkg].path,
              !!config.packages[pkg].manager &&
                config.packages[pkg].manager === "rust"
                ? "Cargo.toml"
                : "package.json"
            ),
            nickname: pkg,
          })
    )
  );

  return pkgs.reduce((list, pkg, index) => {
    list[pkg] = pkgFiles[index];
    return list;
  }, files);
};

const writeAll = function* ({ bumps }: { bumps: PackageFile[] }) {
  for (let bump of bumps) {
    yield writePkgFile({ packageFile: bump });
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
}
export const changesConsideringParents = ({
  assembledChanges,
  config,
}: {
  assembledChanges: {
    releases: Releases;
    changes: ChangeParsed[];
  };
  config: ConfigFile;
}) => {
  const parents = resolveParents({ config });

  let changes = Object.keys(assembledChanges.releases).reduce(
    (
      list: Changed,
      change
    ) => {
      list[change] = assembledChanges.releases[change];
      list[change].parents = parents[change];
      return list;
    },
    {}
  );

  return { releases: parentBump(changes, parents), changes: assembledChanges.changes };
};

const parentBump = (initialChanges: Changed, parents: any): Changed => {
  let changes = {...initialChanges}
  let recurse = false
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
          changes[pkg] = {...cloneDeep(changes[main]), type: 'patch'};
          if (changes[pkg].changes) {
            changes[pkg].changes!.forEach((parentChange) => {
              parentChange.meta.dependencies = `Bumped due to a bump in ${main}.`;
            });
          }
          changes[pkg].parents = parents[pkg];
          // we also need to presume recursion to update the parents' parents
          recurse = true
        }
      });
    }
  });
  return recurse ? parentBump(changes, parents) : changes
}

const bumpAll = ({
  changes,
  allPackages,
  logs = true,
  previewVersion = '',
}: {
  changes: Releases;
  allPackages: { [k: string]: PackageFile };
  logs?: boolean;
  previewVersion?: string;
}) => {
  let packageFiles = { ...allPackages };
  for (let pkg of Object.keys(changes)) {
    if (!packageFiles[pkg].vfile || changes[pkg].type === "noop") continue;
    if (logs && !previewVersion) console.log(`bumping ${pkg} with ${changes[pkg].type}`);
    packageFiles[pkg] = bumpMain({
      packageFile: packageFiles[pkg],
      bumpType: changes[pkg].type,
      previewVersion,
    });
    if (changes[pkg] && changes[pkg].dependencies) {
      let deps = changes[pkg].dependencies!;
      for (let pkgDep of deps) {
        if (!!changes[pkgDep]) {
          packageFiles[pkg] = bumpDeps({
            packageFile: packageFiles[pkg],
            dep: pkgDep,
            bumpType: changes[pkgDep].type,
            previewVersion,
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
}: {
  packageFile: PackageFile;
  bumpType: CommonBumps;
  previewVersion: string;
}) => {
  let pkg = { ...packageFile };
  if (!pkg.version)
    throw new Error(`${pkg.name} does not have a version number.`);
  // @ts-ignore TODO bumpType should be narrowed to meet ReleaseType
  let next = semver.inc(pkg.version, bumpType);
  if (next) {
    pkg.version = next;
    pkg.versionMajor = semver.major(next);
    pkg.versionMinor = semver.minor(next);
    pkg.versionPatch = semver.patch(next);
  }
  if (pkg.vfile && pkg.pkg) {
    if (pkg.vfile.extname === ".json") {
      // for javascript
      // @ts-ignore TODO bumpType should be narrowed to meet ReleaseType
      let version = previewVersion ? semver.valid(`${pkg.pkg.version}-${previewVersion}`) : semver.inc(pkg.pkg.version, bumpType);
      if (version) pkg.pkg.version = version;
    } else if (pkg.vfile.extname === ".toml") {
      // for rust
      // @ts-ignore TODO bumpType should be narrowed to meet ReleaseType
      let version =  previewVersion ? semver.valid(`${pkg.pkg.version}-${previewVersion}`) : semver.inc(pkg.pkg.package.version, bumpType);
      // @ts-ignore TODO we need to normalize Pkg for toml? Or make some union type
      if (version) pkg.pkg.package.version = version;
    }
  }
  return pkg;
};

const bumpDeps = ({
  packageFile,
  dep,
  bumpType,
  previewVersion,
}: {
  packageFile: PackageFile;
  dep: string;
  bumpType: string;
  previewVersion: string;
}) => {
  let pkg = { ...packageFile };

  if (pkg.pkg && pkg.vfile && pkg.pkg.dependencies)
    Object.keys(pkg.pkg.dependencies).forEach((existingDep) => {
      if (
        existingDep === dep &&
        pkg.pkg &&
        pkg.pkg!.dependencies &&
        pkg.pkg!.dependencies[dep]
      ) {
        if (pkg.vfile!.extname === ".json") {
          // for javascript
          let version = previewVersion ? semver.valid(`${pkg.pkg.version}-${previewVersion}`) : semver.inc(
            pkg.pkg.dependencies[dep],
            // @ts-ignore TODO deal with ReleaseType
            bumpType
          );
          if (version) pkg.pkg.dependencies[dep] = version;
        } else if (pkg.vfile!.extname === ".toml") {
          // for rust
          if (typeof pkg.pkg.dependencies[dep] === "object") {
            // @ts-ignore TODO deal with nest toml
            pkg.pkg.dependencies[dep].version =  previewVersion ? semver.valid(`${pkg.pkg.version}-${previewVersion}`) : incWithPartials(
              // @ts-ignore TODO deal with nest toml
              pkg.pkg.dependencies[dep].version,
              bumpType
            );
          } else {
            let version =  previewVersion ? semver.valid(`${pkg.pkg.version}-${previewVersion}`) : incWithPartials(pkg.pkg.dependencies[dep], bumpType);
            if (version) pkg.pkg.dependencies[dep] = version;
          }
        }
      }
    });

  if (pkg.pkg && pkg.vfile && pkg.pkg.devDependencies)
    Object.keys(pkg.pkg.devDependencies).forEach((existingDep) => {
      if (
        existingDep === dep &&
        pkg.pkg &&
        pkg.pkg!.devDependencies &&
        pkg.pkg!.devDependencies[dep]
      ) {
        if (pkg.vfile!.extname === ".json") {
          // for javascript
          // @ts-ignore TODO deal with ReleaseType
          let version =  previewVersion ? semver.valid(`${pkg.pkg.version}-${previewVersion}`) : semver.inc(pkg.pkg.devDependencies[dep], bumpType);
          if (version) pkg.pkg.devDependencies[dep] = version;
        }
      }
    });

  return pkg;
};

const incWithPartials = (version: string, bumpType: string) => {
  if (semver.valid(version)) {
    // @ts-ignore TODO deal with ReleaseType
    return semver.inc(version, bumpType);
  } else {
    try {
      const coerced = semver.coerce(version);
      if (!coerced)
        throw new Error(
          `Cannot bump ${version} with ${bumpType}. Is it a valid version number?`
        );
      // @ts-ignore TODO deal with ReleaseType
      const fullVersion = semver.inc(coerced, bumpType).split(".");
      if (version.split(".").length === 2) {
        return [fullVersion[0], fullVersion[1]].join(".");
      } else if (version.split(".").length === 1) {
        return fullVersion[0];
      } else {
        // failsafe is better than null
        return fullVersion.join(".");
      }
    } catch {
      // failsafe is better than null
      // @ts-ignore TODO what should we _really_ do here?
      return semver.inc(semver.coerce(version), bumpType);
    }
  }
};
