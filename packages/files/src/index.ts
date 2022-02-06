//@ts-ignore
import vfile from "to-vfile";
//@ts-ignore
import globby from "globby";
//@ts-ignore
import fs from "fs";
//@ts-ignore
import path from "path";
//@ts-ignore
import TOML from "@tauri-apps/toml";
//@ts-ignore
import yaml from "js-yaml";
//@ts-ignore
import semver from "semver";

import type {
  VFile,
  PkgMinimum,
  PackageFile,
  PreFile,
  ConfigFile,
} from "@covector/types";

const parsePkg = (file: { extname: string; contents: string }): PkgMinimum => {
  switch (file.extname) {
    case ".toml":
      const parsedTOML = TOML.parse(file.contents);
      // @ts-ignore
      const { version } = parsedTOML.package;
      return {
        version: version,
        versionMajor: semver.major(version),
        versionMinor: semver.minor(version),
        versionPatch: semver.patch(version),
        versionPrerelease: semver.prerelease(version),
        // @ts-ignore
        pkg: parsedTOML,
      };
    case ".json":
      const parsedJSON = JSON.parse(file.contents);
      return {
        version: parsedJSON.version,
        versionMajor: semver.major(parsedJSON.version),
        versionMinor: semver.minor(parsedJSON.version),
        versionPatch: semver.patch(parsedJSON.version),
        versionPrerelease: semver.prerelease(parsedJSON.version),
        pkg: parsedJSON,
      };
    case ".yml":
    case ".yaml":
      const parsedYAML = yaml.load(file.contents);
      // type narrow:
      if (
        typeof parsedYAML === "string" ||
        typeof parsedYAML === "number" ||
        parsedYAML === null ||
        parsedYAML === undefined
      )
        throw new Error(`file improperly structured`);
      //@ts-ignore version is not on object?
      if (parsedYAML && (!parsedYAML.name || !parsedYAML.version))
        throw new Error(`missing version`);
      const verifiedYAML = parsedYAML as { name: string; version: string };
      return {
        version: verifiedYAML.version,
        versionMajor: semver.major(verifiedYAML.version),
        versionMinor: semver.minor(verifiedYAML.version),
        versionPatch: semver.patch(verifiedYAML.version),
        pkg: verifiedYAML,
      };
    default:
      // default case assuming a file with just a version number
      const stringVersion = file.contents.trim();
      if (!semver.valid(stringVersion)) {
        throw new Error("not valid version");
      }
      return {
        version: stringVersion,
        versionMajor: semver.major(stringVersion),
        versionMinor: semver.minor(stringVersion),
        versionPatch: semver.patch(stringVersion),
        pkg: { name: "", version: stringVersion },
      };
  }
};

const stringifyPkg = ({
  newContents,
  extname,
}: {
  newContents: any;
  extname?: string;
}): string => {
  switch (extname) {
    case ".toml":
      return TOML.stringify(newContents);
    case ".json":
      return `${JSON.stringify(newContents, null, "  ")}\n`;
    case ".yml":
    case ".yaml":
      // this clobbers gaps between sections: https://github.com/nodeca/js-yaml/issues/441
      return yaml.dump(newContents);
    default:
      return newContents.version;
  }
};

export const readPkgFile = async ({
  //@ts-ignore Cannot find name 'process'. Do you need to install type definitions for node? even though we have them?
  cwd = process.cwd(),
  file,
  pkgConfig,
  nickname,
}: {
  cwd?: string;
  file?: string; // TODO, deprecate this
  pkgConfig?: { manager?: string; path?: string; packageFileName?: string };
  nickname: string;
}): Promise<PackageFile> => {
  if (file) {
    const inputVfile = await vfile.read(file, "utf8");
    const parsed = parsePkg(inputVfile);
    return {
      vfile: inputVfile,
      ...parsed,
      name: nickname,
    };
  } else {
    if (pkgConfig?.path && pkgConfig?.packageFileName) {
      const configFile = path.join(
        cwd,
        pkgConfig.path,
        pkgConfig.packageFileName
      );
      const inputVfile = await vfile.read(configFile, "utf8");
      const parsed = parsePkg(inputVfile);
      return {
        vfile: inputVfile,
        ...parsed,
        name: nickname,
      };
    } else {
      // it will fail if path points to a dir, then we derive it
      let packageFile = "package.json"; // default
      if (pkgConfig && pkgConfig.manager) {
        if (/rust/.test(pkgConfig?.manager)) {
          packageFile = "Cargo.toml";
        } else if (
          /dart/.test(pkgConfig?.manager) ||
          /flutter/.test(pkgConfig?.manager)
        ) {
          packageFile = "pubspec.yaml";
        }
      }
      const deriveFile = path.join(cwd, pkgConfig?.path || "", packageFile);
      const inputVfile = await vfile.read(deriveFile, "utf8");
      const parsed = parsePkg(inputVfile);
      return {
        vfile: inputVfile,
        ...parsed,
        name: nickname,
      };
    }
  }
};

export const writePkgFile = async ({
  packageFile,
}: {
  packageFile: PackageFile;
}): Promise<VFile> => {
  if (!packageFile.vfile)
    throw new Error(`no vfile present for ${packageFile.name}`);
  const vFileNext = { ...packageFile.vfile };
  vFileNext.contents = stringifyPkg({
    newContents: packageFile.pkg,
    extname: packageFile.vfile.extname,
  });
  const inputVfile = await vfile.write(vFileNext, "utf8");
  return inputVfile;
};

export const readPreFile = async ({
  cwd,
  changeFolder = ".changes",
}: {
  cwd: string;
  changeFolder?: string;
}): Promise<PreFile | null> => {
  try {
    const inputVfile = await vfile.read(
      path.join(cwd, changeFolder, "pre.json"),
      "utf8"
    );
    const parsed = JSON.parse(inputVfile.contents);
    return {
      vfile: inputVfile,
      ...parsed,
    };
  } catch (error) {
    return null;
  }
};

export const getPackageFileVersion = ({
  pkg,
  property = "version",
  dep,
}: {
  pkg: PackageFile;
  property?: string;
  dep?: string;
}): string => {
  if (pkg.vfile && pkg.pkg) {
    if (property === "version") {
      if (pkg.vfile.extname === ".json") {
        return pkg.pkg.version;
      } else if (pkg.vfile.extname === ".toml") {
        // @ts-ignore
        return pkg.pkg.package.version;
      } else {
        // covers yaml and generic
        return pkg.pkg.version;
      }
    } else if (property === "dependencies") {
      // same for every supported package file
      if (!dep || !pkg.pkg.dependencies) return "";
      if (typeof pkg.pkg.dependencies[dep] === "object") {
        //@ts-ignore
        if (!pkg.pkg.dependencies[dep].version) {
          throw new Error(
            `${pkg.name} has a dependency on ${dep}, and ${dep} does not have a version number. ` +
              `This cannot be published. ` +
              `Please pin it to a MAJOR.MINOR.PATCH reference.`
          );
        }
        //@ts-ignore
        return pkg.pkg.dependencies[dep].version;
      } else {
        return pkg.pkg.dependencies[dep];
      }
    } else if (property === "devDependencies") {
      // same for every supported package file
      if (!dep || !pkg.pkg.devDependencies) return "";
      if (typeof pkg.pkg.devDependencies[dep] === "object") {
        //@ts-ignore
        if (!pkg.pkg.devDependencies[dep].version) {
          throw new Error(
            `${pkg.name} has a devDependency on ${dep}, and ${dep} does not have a version number. ` +
              `This cannot be published. ` +
              `Please pin it to a MAJOR.MINOR.PATCH reference.`
          );
        }
        //@ts-ignore
        return pkg.pkg.devDependencies[dep].version;
      } else {
        return pkg.pkg.devDependencies[dep];
      }
    } else if (property === "dev-dependencies") {
      // same for every supported package file
      //@ts-ignore
      if (!dep || !pkg.pkg[property]) return "";
      //@ts-ignore
      if (typeof pkg.pkg[property][dep] === "object") {
        //@ts-ignore
        if (!pkg.pkg[property][dep].version) {
          throw new Error(
            `${pkg.name} has a devDependency on ${dep}, and ${dep} does not have a version number. ` +
              `This cannot be published. ` +
              `Please pin it to a MAJOR.MINOR.PATCH reference.`
          );
        }
        //@ts-ignore
        return pkg.pkg[property][dep].version;
      } else {
        //@ts-ignore
        return pkg.pkg[property][dep];
      }
    } else {
      return "";
    }
  }
  return "";
};

export const setPackageFileVersion = ({
  pkg,
  version,
  property = "version",
  dep,
}: {
  pkg: PackageFile;
  version: string;
  property?: string;
  dep?: string;
}): PackageFile => {
  if (pkg.vfile && pkg.pkg) {
    if (property === "version") {
      if (pkg.vfile.extname === ".json") {
        pkg.pkg.version = version;
      } else if (pkg.vfile.extname === ".toml") {
        // @ts-ignore
        pkg.pkg.package.version = version;
      } else {
        // covers yaml and generic
        pkg.pkg.version = version;
      }
    } else if (
      property === "dependencies" ||
      property === "devDependencies" ||
      property === "dev-dependencies"
    ) {
      if (property === "dependencies") {
        // same for every supported package file
        if (!dep || !pkg.pkg.dependencies) return pkg;
        if (typeof pkg.pkg.dependencies[dep] === "object") {
          // @ts-ignore TODO deal with nest toml
          pkg.pkg.dependencies[dep].version = version;
        } else {
          pkg.pkg.dependencies[dep] = version;
        }
      } else if (property === "devDependencies") {
        // same for every supported package file
        if (!dep || !pkg.pkg.devDependencies) return pkg;
        if (typeof pkg.pkg.devDependencies[dep] === "object") {
          // @ts-ignore TODO deal with nest toml
          pkg.pkg.devDependencies[dep].version = version;
        } else {
          pkg.pkg.devDependencies[dep] = version;
        }
      } else if (property === "dev-dependencies") {
        // same for every supported package file
        //@ts-ignore
        if (!dep || !pkg.pkg[property]) return pkg;
        //@ts-ignore
        if (typeof pkg.pkg[property][dep] === "object") {
          //@ts-ignore
          // @ts-ignore TODO deal with nest toml
          pkg.pkg[property][dep].version = version;
        } else {
          //@ts-ignore
          pkg.pkg[property][dep] = version;
        }
      }
    }
  }
  return pkg;
};

export const writePreFile = async ({
  preFile,
}: {
  preFile: PreFile;
}): Promise<VFile> => {
  if (!preFile.vfile)
    throw new Error(`We could not find the pre.json to update.`);
  const { tag, changes } = preFile;
  const vFileNext = { ...preFile.vfile };
  vFileNext.contents = stringifyPkg({
    newContents: { tag, changes },
    extname: preFile.vfile.extname,
  });
  const inputVfile = await vfile.write(vFileNext, "utf8");
  return inputVfile;
};

export const testSerializePkgFile = ({
  packageFile,
}: {
  packageFile: PackageFile;
}) => {
  try {
    if (!packageFile.vfile) throw `no vfile present`;
    stringifyPkg({
      newContents: packageFile.pkg,
      extname: packageFile.vfile.extname,
    });
    return true;
  } catch (e: any) {
    if (e?.message === "Can only stringify objects, not null") {
      console.error(
        "It appears that a dependency within this repo does not have a version specified."
      );
    }
    throw new Error(`within ${packageFile.name} => ${e?.message}`);
  }
};

export const configFile = async ({
  cwd,
  changeFolder = ".changes",
}: {
  cwd: string;
  changeFolder?: string;
}): Promise<ConfigFile> => {
  const inputVfile = await vfile.read(
    path.join(cwd, changeFolder, "config.json"),
    "utf8"
  );
  const parsed = JSON.parse(inputVfile.contents);
  return {
    vfile: inputVfile,
    ...parsed,
    ...checkFileOrDirectory({ cwd, config: parsed }),
  };
};

export const checkFileOrDirectory = ({
  cwd,
  config,
}: {
  cwd: string;
  config: ConfigFile;
}): ConfigFile["packages"] =>
  !config.packages
    ? {}
    : {
        packages: Object.keys(config.packages).reduce((packages, pkg) => {
          const packagePath = config.packages[pkg].path;
          if (!packagePath || !cwd) return packages;

          const checkDir = fs.statSync(path.join(cwd, packagePath));
          if (checkDir.isFile()) {
            const dirName = path.dirname(packagePath);
            const packageFileName = path.basename(packagePath);
            packages[pkg] = {
              ...packages[pkg],
              path: dirName,
              packageFileName,
            };
            return packages;
          } else {
            return packages;
          }
        }, config?.packages),
      };

export const changeFiles = async ({
  cwd,
  changeFolder = ".changes",
}: {
  cwd: string;
  changeFolder?: string;
}): Promise<string[]> => {
  return await globby(
    [
      path.posix.join(changeFolder, "*.md"),
      `!${path.posix.join(changeFolder, "README.md")}`,
      `!${path.posix.join(changeFolder, "readme.md")}`,
      `!${path.posix.join(changeFolder, "Readme.md")}`,
    ],
    {
      cwd,
    }
  );
};

export const changeFilesToVfile = ({
  cwd,
  paths,
}: {
  cwd: string;
  paths: string[];
}): VFile[] => {
  return paths.map((file) => {
    let v = vfile.readSync(path.join(cwd, file), "utf8");
    delete v.history;
    delete v.cwd;
    v.data.filename = file;
    return v;
  });
};

export const changeFilesRemove = ({
  cwd,
  paths,
}: {
  cwd: string;
  paths: string[];
}) => {
  return Promise.all(
    paths.map(async (changeFilePath) => {
      await fs.unlink(
        path.posix.join(cwd, changeFilePath),
        (err: Error | null) => {
          if (err) throw err;
        }
      );
      return changeFilePath;
    })
  ).then((deletedPaths) => {
    deletedPaths.forEach((changeFilePath) =>
      console.info(`${changeFilePath} was deleted`)
    );
  });
};

export const readChangelog = async ({
  cwd,
  packagePath = "",
  create = true,
}: {
  cwd: string;
  packagePath?: string;
  create?: boolean;
}): Promise<VFile> => {
  let file = null;
  try {
    file = await vfile.read(
      path.join(cwd, packagePath, "CHANGELOG.md"),
      "utf8"
    );
  } catch {
    if (create) {
      console.log("Could not load the CHANGELOG.md. Creating one.");
      file = {
        path: path.join(cwd, packagePath, "CHANGELOG.md"),
        contents: "# Changelog\n\n\n",
      };
    }
  }
  return file;
};

export const writeChangelog = async ({
  changelog,
}: {
  changelog: VFile;
}): Promise<VFile> => {
  const inputVfile = await vfile.write(changelog, "utf8");
  return inputVfile;
};
