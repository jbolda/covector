const { readPkgFile, writePkgFile } = require("@covector/files");
const { compareBumps } = require("@covector/assemble");
const semver = require("semver");
const path = require("path");

module.exports.apply = function* ({
  changeList,
  config,
  cwd = process.cwd(),
  bump = true,
}) {
  const parents = resolveParents({ config });
  let changes = changeList.reduce((list, change) => {
    list[change.pkg] = change;
    list[change.pkg].parents = parents[change.pkg];
    return list;
  }, {});

  Object.keys(changes).forEach((main) => {
    if (!!changes[main].parents) {
      changes[main].parents.forEach((pkg) => {
        if (!!changes[pkg]) {
          changes[pkg].type = compareBumps(
            changes[main].type,
            changes[pkg].type
          );
        } else {
          changes[pkg] = config.packages[pkg];
          changes[pkg].parents = [];
          changes[pkg].pkg = pkg;
          changes[pkg].type = changes[main].type;
        }
      });
    }
  });

  let allPackages = yield readAll({ changes, config, cwd });

  const bumps = bumpAll({ changes, allPackages });
  if (bump) {
    yield writeAll({
      bumps: bumps.reduce(
        (final, current) => (!current.vfile ? final : final.concat([current])),
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

const readAll = async ({ changes, config, cwd = process.cwd() }) => {
  let files = Object.keys(changes).reduce((fileList, change) => {
    fileList[change] = {};
    if (changes[change].parents.length > 0)
      changes[change].parents.forEach((parent) => (fileList[parent] = {}));
    return fileList;
  }, {});

  const pkgs = Object.keys(files);
  const pkgFiles = await Promise.all(
    Object.keys(files).map((pkg) =>
      !config.packages[pkg].path
        ? { name: pkg }
        : readPkgFile({
            file: path.join(
              cwd,
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

const writeAll = function* ({ bumps }) {
  for (let bump of bumps) {
    yield writePkgFile({ packageFile: bump });
  }
};

const resolveParents = ({ config }) => {
  return Object.keys(config.packages).reduce((parents, pkg) => {
    parents[pkg] = [];
    Object.keys(config.packages).forEach((parent) => {
      if (
        !!config.packages[parent].dependencies &&
        config.packages[parent].dependencies.includes(pkg)
      )
        parents[pkg].push(parent);
    });
    return parents;
  }, {});
};

const bumpAll = ({ changes, allPackages }) => {
  let packageFiles = { ...allPackages };
  for (let pkg of Object.keys(changes)) {
    if (!packageFiles[pkg].vfile) continue;
    console.log(`bumping ${pkg} with ${changes[pkg].type}`);
    packageFiles[pkg] = bumpMain({
      packageFile: packageFiles[pkg],
      bumpType: changes[pkg].type,
    });
    if (!!changes[pkg].dependencies) {
      for (let pkgDep of changes[pkg].dependencies) {
        if (!!changes[pkgDep]) {
          packageFiles[pkg] = bumpDeps({
            packageFile: packageFiles[pkg],
            dep: pkgDep,
            bumpType: changes[pkgDep].type,
          });
        }
      }
    }
  }

  return Object.keys(packageFiles).map((pkg) => packageFiles[pkg]);
};

const bumpMain = ({ packageFile, bumpType }) => {
  let pkg = { ...packageFile };
  pkg.version = semver.inc(pkg.version, bumpType);
  if (pkg.vfile.extname === ".json") {
    // for javascript
    pkg.pkg.version = semver.inc(pkg.pkg.version, bumpType);
  } else if (pkg.vfile.extname === ".toml") {
    // for rust
    pkg.pkg.package.version = semver.inc(pkg.pkg.package.version, bumpType);
  }
  return pkg;
};

const bumpDeps = ({ packageFile, dep, bumpType }) => {
  let pkg = { ...packageFile };

  if (!!pkg.pkg.dependencies)
    Object.keys(pkg.pkg.dependencies).forEach((existingDep) => {
      if (existingDep === dep) {
        if (pkg.vfile.extname === ".json") {
          // for javascript
          pkg.pkg.dependencies[dep] = semver.inc(
            pkg.pkg.dependencies[dep],
            bumpType
          );
        } else if (pkg.vfile.extname === ".toml") {
          // for rust
          if (typeof pkg.pkg.dependencies[dep] === "object") {
            pkg.pkg.dependencies[dep].version = incWithPartials(
              pkg.pkg.dependencies[dep].version,
              bumpType
            );
          } else {
            pkg.pkg.dependencies[dep] = incWithPartials(
              pkg.pkg.dependencies[dep],
              bumpType
            );
          }
        }
      }
    });

  if (!!pkg.pkg.devDependencies)
    Object.keys(pkg.pkg.devDependencies).forEach((existingDep) => {
      if (existingDep === dep) {
        if (pkg.vfile.extname === ".json") {
          // for javascript
          pkg.pkg.devDependencies[dep] = semver.inc(
            pkg.pkg.devDependencies[dep],
            bumpType
          );
        }
      }
    });

  return pkg;
};

const incWithPartials = (version, bumpType) => {
  if (semver.valid(version)) {
    return semver.inc(version, bumpType);
  } else {
    try {
      const fullVersion = semver
        .inc(semver.coerce(version), bumpType)
        .split(".");
      if (version.split(".").length === 2) {
        return [].concat(fullVersion[0], fullVersion[1]).join(".");
      } else if (version.split(".").length === 1) {
        return fullVersion[0];
      } else {
        // failsafe is better than null
        return fullVersion.join(".");
      }
    } catch {
      // failsafe is better than null
      return semver.inc(semver.coerce(version), bumpType);
    }
  }
};
