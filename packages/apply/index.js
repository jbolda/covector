const { readPkgFile, writePkgFile } = require("@covector/files");
const { compareBumps } = require("@covector/assemble");
const semver = require("semver");
const path = require("path");

module.exports.apply = function* ({ changeList, config }) {
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

  let allPackages = yield readAll({ changes, config });

  const bumps = bumpAll({ changes, allPackages });
  return yield writeAll({ bumps });
};

const readAll = ({ changes, config }) => {
  let files = Object.keys(changes).reduce((fileList, change) => {
    fileList[change] = {};
    if (changes[change].parents.length > 0)
      changes[change].parents.forEach((parent) => (fileList[parent] = {}));
    return fileList;
  }, {});

  return Promise.all(
    Object.keys(files).map((pkg) =>
      readPkgFile(
        path.join(
          config.packages[pkg].path,
          !!config.packages[pkg].manager &&
            config.packages[pkg].manager === "rust"
            ? "Cargo.toml"
            : "package.json"
        )
      )
    )
  ).then((pkgs) =>
    pkgs.reduce((list, pkgFile) => {
      list[pkgFile.name] = pkgFile;
      return list;
    }, {})
  );
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
  pkg.pkg.version = semver.inc(pkg.pkg.version, bumpType);
  return pkg;
};

const bumpDeps = ({ packageFile, dep, bumpType }) => {
  let pkg = { ...packageFile };

  if (!!pkg.pkg.dependencies)
    Object.keys(pkg.pkg.dependencies).forEach((existingDep) => {
      if (existingDep === dep) {
        pkg.pkg.dependencies[dep] = semver.inc(
          pkg.pkg.dependencies[dep],
          bumpType
        );
      }
    });

  if (!!pkg.pkg.devDependencies)
    Object.keys(pkg.pkg.devDependencies).forEach((existingDep) => {
      if (existingDep === dep) {
        pkg.pkg.devDependencies[dep] = semver.inc(
          pkg.pkg.devDependencies[dep],
          bumpType
        );
      }
    });

  return pkg;
};
