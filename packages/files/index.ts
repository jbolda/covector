// @ts-ignore
import vfile from "to-vfile";
import globby from "globby";
import fs from "fs";
import path from "path";
import TOML from "@tauri-apps/toml";
import semver from "semver";

interface VFile {
  contents: string;
  path: string;
  extname: string;
}

interface Pkg {
  name: string;
  version: string;
  dependencies?: object;
  devDependencies?: object;
}

export interface PkgMinimum {
  version: string;
  pkg: Pkg;
  versionMajor: number;
  versionMinor: number;
  versionPatch: number;
}

interface PackageFile extends PkgMinimum {
  vfile: VFile;
  name: string;
}

type ConfigFile = {
  vfile: VFile;
  packages: {};
  pkgManagers: {};
};

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
        pkg: parsedJSON,
      };
  }
  throw new Error("Unknown package file type.");
};

const stringifyPkg = ({
  newContents,
  extname,
}: {
  newContents: any;
  extname: string;
}): string => {
  switch (extname) {
    case ".toml":
      return TOML.stringify(newContents);
    case ".json":
      return `${JSON.stringify(newContents, null, "  ")}\n`;
  }
  throw new Error("Unknown package file type.");
};

export const readPkgFile = async ({
  file,
  nickname,
}: {
  file: string;
  nickname: string;
}): Promise<PackageFile> => {
  const inputVfile = await vfile.read(file, "utf8");
  const parsed = parsePkg(inputVfile);
  return {
    vfile: inputVfile,
    ...parsed,
    name: nickname,
  };
};

export const writePkgFile = async ({
  packageFile,
}: {
  packageFile: PackageFile;
}): Promise<VFile> => {
  const vFileNext = { ...packageFile.vfile };
  vFileNext.contents = stringifyPkg({
    newContents: packageFile.pkg,
    extname: packageFile.vfile.extname,
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
    stringifyPkg({
      newContents: packageFile.pkg,
      extname: packageFile.vfile.extname,
    });
    return true;
  } catch (e) {
    if (e.message === "Can only stringify objects, not null") {
      console.error(
        "It appears that a dependency within this repo does not have a version specified."
      );
    }
    throw new Error(`within ${packageFile.name} => ${e.message}`);
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
  };
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
      await fs.unlink(path.posix.join(cwd, changeFilePath), (err) => {
        if (err) throw err;
      });
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
}: {
  cwd: string;
}): Promise<VFile> => {
  let file = null;
  try {
    file = await vfile.read(path.join(cwd, "CHANGELOG.md"), "utf8");
  } catch {
    console.log("Could not load the CHANGELOG.md. Creating one.");
    file = {
      path: path.join(cwd, "CHANGELOG.md"),
      contents: "# Changelog\n\n\n",
    };
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
