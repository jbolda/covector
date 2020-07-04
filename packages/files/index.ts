// @ts-ignore
import vfile from "to-vfile"
import globby from "globby"
import fs from "fs"
import path from "path"
import TOML from "@tauri-apps/toml"

interface VFile {
  contents: string,
  path: string,
  extname: string,
}

interface Pkg {
  name: string,
  version: string,
  dependencies?: object
}

interface PkgMinimum {
  version: string,
  pkg: Pkg,
}

interface PackageFile extends PkgMinimum {
  vfile: VFile,
  name: string,
}

type ConfigFile = {
  vfile: VFile,
  packages: {},
  pkgManagers: {},
}

const parsePkg = (file: { extname: string; contents: string }): PkgMinimum => {
  switch (file.extname) {
    case ".toml":
      const parsedTOML = TOML.parse(file.contents);
      return {
        // @ts-ignore
        version: parsedTOML.package.version,
        // @ts-ignore
        pkg: parsedTOML,
      };
    case ".json":
      const parsedJSON = JSON.parse(file.contents);
      return {
        version: parsedJSON.version,
        pkg: parsedJSON,
      };
  }
  throw new Error("Unknown package file type.");
};

const stringifyPkg = ({ newContents, extname }: { newContents: any, extname: string }): string => {
  switch (extname) {
    case ".toml":
      return TOML.stringify(newContents);
    case ".json":
      return `${JSON.stringify(newContents, null, "  ")}\n`;
  }
  throw new Error("Unknown package file type.");
};

export const readPkgFile = async ({ file, nickname }: { file: string, nickname: string }): Promise<PackageFile> => {
  const inputVfile = await vfile.read(file, "utf8");
  const parsed = parsePkg(inputVfile);
  return {
    vfile: inputVfile,
    ...parsed,
    name: nickname,
  };
};

export const writePkgFile = async ({ packageFile }: { packageFile: PackageFile }): Promise<VFile> => {
  const vFileNext = { ...packageFile.vfile };
  vFileNext.contents = stringifyPkg({
    newContents: packageFile.pkg,
    extname: packageFile.vfile.extname,
  });
  const inputVfile = await vfile.write(vFileNext, "utf8");
  return inputVfile;
};

export const configFile = async ({ cwd, changeFolder = ".changes" }: { cwd: string, changeFolder: string }): Promise<ConfigFile> => {
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
  remove = true,
}: { cwd: string, changeFolder: string, remove: boolean }): Promise<VFile[]> => {
  const paths = await globby(
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

  const vfiles = paths
    .map((file) => vfile.readSync(path.join(cwd, file), "utf8"))
    .map((v) => v.contents);

  if (remove) {
    await Promise.all(
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
  }

  return vfiles;
};

export const readChangelog = async ({ cwd }: { cwd: string }): Promise<VFile> => {
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

export const writeChangelog = async ({ changelog }: { changelog: VFile }): Promise<VFile> => {
  const inputVfile = await vfile.write(changelog, "utf8");
  return inputVfile;
};
