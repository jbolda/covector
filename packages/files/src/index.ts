import { default as fsDefault, PathLike } from "fs";
// this is compatible with node@12+
const fs = fsDefault.promises;

import { type Logger } from "@covector/types";
import { all, MainError, type Operation } from "effection";
import { configFileSchema } from "./schema";
import { fromZodError } from "zod-validation-error";
import globby from "globby";
import path from "path";
import { TomlDocument } from "@covector/toml";
import yaml from "js-yaml";
import semver from "semver";

import type {
  File,
  ConfigFile,
  PkgMinimum,
  PackageFile,
  PreFile,
  DepsKeyed,
  DepTypes,
  Pkg,
} from "@covector/types";

export function* loadFile(file: PathLike, cwd: string): Operation<File | void> {
  if (typeof file === "string") {
    const content = yield fs.readFile(path.join(cwd, file), {
      encoding: "utf-8",
    });
    const parsedPath = path.parse(file);
    return {
      content,
      path: path.posix
        .relative(cwd, path.posix.join(cwd, file))
        .split("\\")
        .join("/"),
      filename: parsedPath?.name ?? "",
      extname: parsedPath?.ext ?? "",
    };
  }
}

export function* saveFile(file: File, cwd: string): Operation<File> {
  if (typeof file.path !== "string")
    throw new Error(`Unable to handle saving of ${file}`);
  yield fs.writeFile(path.join(cwd, file.path), file.content, {
    encoding: "utf-8",
  });
  return file;
}

const parsePkg = (file: Partial<File>): PkgMinimum => {
  if (!file.content) throw new Error(`${file.path} does not have any content`);
  switch (file.extname) {
    case ".toml":
      const parsedTOML = TomlDocument.parse(file.content);
      let version;
      if (
        parsedTOML?.package?.version &&
        typeof parsedTOML?.package?.version === "string"
      ) {
        version = parsedTOML.package.version;
      } else if (
        parsedTOML?.workspace?.package?.version &&
        typeof parsedTOML?.workspace?.package?.version === "string"
      ) {
        version = parsedTOML.workspace.package.version;
      }

      if (!version)
        throw new Error(`package version is not set in ./${file.path}`);
      if (!semver.valid(version))
        throw new Error(`package version is not valid in ./${file.path}`);
      return {
        version: version,
        currentVersion: version,
        versionMajor: semver.major(version),
        versionMinor: semver.minor(version),
        versionPatch: semver.patch(version),
        versionPrerelease: semver.prerelease(version),
        deps: keyDeps(parsedTOML),
        pkg: parsedTOML,
      };
    case ".json":
      const parsedJSON = JSON.parse(file.content);
      return {
        version: parsedJSON.version,
        currentVersion: parsedJSON.version,
        versionMajor: semver.major(parsedJSON.version),
        versionMinor: semver.minor(parsedJSON.version),
        versionPatch: semver.patch(parsedJSON.version),
        versionPrerelease: semver.prerelease(parsedJSON.version),
        deps: keyDeps(parsedJSON),
        pkg: parsedJSON,
      };
    case ".yml":
    case ".yaml":
      const parsedYAML = yaml.load(file.content) as Pkg;
      if (
        typeof parsedYAML === "string" ||
        typeof parsedYAML === "number" ||
        parsedYAML === null ||
        parsedYAML === undefined
      )
        throw new Error(`file improperly structured`);
      if (parsedYAML && (!parsedYAML.name || !parsedYAML.version))
        throw new Error(`missing version`);
      const verifiedYAML = parsedYAML as { name: string; version: string };
      return {
        version: verifiedYAML.version,
        currentVersion: verifiedYAML.version,
        versionMajor: semver.major(verifiedYAML.version),
        versionMinor: semver.minor(verifiedYAML.version),
        versionPatch: semver.patch(verifiedYAML.version),
        deps: keyDeps(parsedYAML),
        pkg: verifiedYAML,
      };
    default:
      // default case assuming a file with just a version number
      const stringVersion = file.content.trim();
      if (!semver.valid(stringVersion)) {
        throw new Error("not valid version");
      }
      return {
        version: stringVersion,
        currentVersion: stringVersion,
        versionMajor: semver.major(stringVersion),
        versionMinor: semver.minor(stringVersion),
        versionPatch: semver.patch(stringVersion),
        deps: {},
        pkg: { name: "", version: stringVersion },
      };
  }
};

const keyDeps = (parsed: Pkg | TomlDocument): DepsKeyed => {
  const deps: DepsKeyed = {};
  const depTypes: DepTypes[] = [
    "dependencies",
    "devDependencies",
    "dev-dependencies",
    "build-dependencies",
  ];

  depTypes.forEach((depType: DepTypes) => {
    let pkgFileDeps = parsed[depType];
    if (pkgFileDeps && typeof pkgFileDeps === "object") {
      Object.entries(pkgFileDeps).forEach(([dep, version]) => {
        if (!deps?.[dep]) deps[dep] = [];
        if (typeof version === "string") {
          deps[dep].push({
            type: depType,
            version,
          });
        } else if (
          version &&
          typeof version === "object" &&
          "version" in version &&
          version.version &&
          typeof version.version === "string"
        ) {
          deps[dep].push({
            type: depType,
            version: version.version,
          });
        }
      });
    }
  });
  return deps;
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
      return TomlDocument.stringify(newContents);
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

export function* readAllPkgFiles({
  config,
  cwd,
}: {
  config: ConfigFile;
  cwd?: string;
}): Operation<Record<string, PackageFile>> {
  const pkgArray = Object.entries(config.packages);
  const readPkgs = pkgArray.map(([name, pkg]) =>
    readPkgFile({ cwd, pkgConfig: pkg, nickname: name })
  );
  const pkgFilesArray: PackageFile[] = yield all(readPkgs);

  return pkgFilesArray.reduce(
    (pkgs: Record<string, PackageFile>, pkg: PackageFile) => {
      if (pkg?.name) {
        pkgs[pkg.name] = pkg;
      }
      return pkgs;
    },
    {}
  );
}

export function* readPkgFile({
  cwd = process.cwd(),
  file,
  pkgConfig,
  nickname,
}: {
  cwd?: string;
  file?: string; // TODO, deprecate this
  pkgConfig?: { manager?: string; path?: string; packageFileName?: string };
  nickname: string;
}): Operation<PackageFile> {
  if (file) {
    const inputFile = yield loadFile(file, cwd);
    const parsed = parsePkg(inputFile);
    return {
      file: inputFile,
      ...parsed,
      name: nickname,
    };
  } else {
    if (pkgConfig?.path && pkgConfig?.packageFileName) {
      const configFile = path.join(pkgConfig.path, pkgConfig.packageFileName);
      const inputFile = yield loadFile(configFile, cwd);
      const parsed = parsePkg(inputFile);
      return {
        file: inputFile,
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
      const deriveFile = path.join(pkgConfig?.path || "", packageFile);
      const inputFile = yield loadFile(deriveFile, cwd);
      const parsed = parsePkg(inputFile);
      return {
        file: inputFile,
        ...parsed,
        name: nickname,
      };
    }
  }
}

export function* writePkgFile({
  packageFile,
  cwd,
}: {
  packageFile: PackageFile;
  cwd: string;
}): Operation<File> {
  if (!packageFile.file)
    throw new Error(`no file present for ${packageFile.name}`);
  const fileNext = { ...packageFile.file };
  fileNext.content = stringifyPkg({
    newContents: packageFile.pkg,
    extname: packageFile.file.extname,
  });
  const inputFile = yield saveFile(fileNext, cwd);
  return inputFile;
}

export function* readPreFile({
  cwd,
  changeFolder = ".changes",
}: {
  cwd: string;
  changeFolder?: string;
}): Operation<PreFile | null> {
  try {
    const inputFile = yield loadFile(path.join(changeFolder, "pre.json"), cwd);
    const parsed = JSON.parse(inputFile.content);
    return {
      file: inputFile,
      ...parsed,
    };
  } catch (error) {
    return null;
  }
}

export const getPackageFileVersion = ({
  pkg,
  property = "version",
  dep,
}: {
  pkg: PackageFile;
  property?: keyof Pkg;
  dep?: string;
}): string => {
  if (!!pkg?.file && "pkg" in pkg && !!pkg.pkg) {
    switch (property) {
      case "version":
        if (pkg.file.extname === ".json" && pkg.pkg.version) {
          return pkg.pkg.version;
        } else if (pkg.file.extname === ".toml" && pkg?.pkg?.package?.version) {
          return pkg.pkg.package.version;
        } else if (!pkg.pkg.version) {
          return "";
        } else {
          // covers yaml and generic
          return pkg.pkg.version;
        }
      case "dependencies":
      case "devDependencies":
      case "dev-dependencies":
      case "build-dependencies":
        const currentPkgDeps = pkg.pkg[property];
        if (currentPkgDeps === undefined) return "";
        if (typeof pkg.pkg[property] !== "object") return "";
        if (!dep) return "";
        if (!("dependencies" in pkg.pkg)) return "";

        if (pkg.pkg[property] && typeof pkg.pkg[property] === "object") {
          if (property in pkg.pkg) {
            const depDefinition = currentPkgDeps[dep];

            switch (typeof depDefinition) {
              case "string":
                return depDefinition;
              case "object":
                // Cargo workspace dependencies use { workspace = true } without a version
                // The version is inherited from the workspace root
                if (depDefinition.workspace === true) {
                  return depDefinition.version || "";
                }
                // Cargo path-only dependencies (e.g., { path = "../pkg" }) don't require a version
                // for local development - covector should not error on these
                if (depDefinition.path && !depDefinition.version) {
                  return "";
                }
                if (!depDefinition.version) {
                  throw new Error(
                    `${pkg.name} has a dependency on ${dep}, and ${dep} does not have a version number. ` +
                      `This cannot be published. ` +
                      `Please pin it to a MAJOR.MINOR.PATCH reference.`
                  );
                }
                return depDefinition.version;
            }
          }
        }
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
  property?: keyof Pkg;
  dep?: string;
}): PackageFile => {
  if (pkg.file && pkg.pkg) {
    const currentPkg = pkg.pkg;
    if (property === "version") {
      if (pkg.file.extname === ".json") {
        pkg.pkg.version = version;
      } else if (pkg.file.extname === ".toml" && pkg.pkg.package?.version) {
        pkg.pkg.package.version = version;
      } else if (
        pkg.file.extname === ".toml" &&
        pkg.pkg.workspace?.package?.version
      ) {
        pkg.pkg.workspace.package.version = version;
      } else {
        // covers yaml and generic
        pkg.pkg.version = version;
      }
    } else if (
      property === "dependencies" ||
      property === "devDependencies" ||
      property === "dev-dependencies" ||
      property === "build-dependencies"
    ) {
      const currentProperty = currentPkg[property];
      if (currentProperty === undefined)
        // throw as this definitely shouldn't happen
        throw new Error(
          `Expected ${property} not found in package:\n${JSON.stringify(
            pkg,
            null,
            2
          )}`
        );
      if (!dep) return pkg;

      const currentDepVersion = currentProperty[dep];
      if (typeof currentDepVersion === "string") {
        pkg.pkg[property][dep] = version;
      } else if (typeof currentDepVersion === "object") {
        if ("version" in currentDepVersion) {
          pkg.pkg[property][dep].version = version;
        }
      }
    }
  }
  return pkg;
};

export function* writePreFile({
  preFile,
  cwd,
}: {
  preFile: PreFile;
  cwd: string;
}): Operation<File> {
  if (!preFile.file)
    throw new Error(`We could not find the pre.json to update.`);
  const { tag, changes } = preFile;
  const fileNext = { ...preFile.file };
  fileNext.content = stringifyPkg({
    newContents: { tag, changes },
    extname: preFile.file.extname,
  });
  const inputFile = yield saveFile(fileNext, cwd);
  return inputFile;
}

export const testSerializePkgFile = ({
  logger,
  packageFile,
}: {
  logger: Logger;
  packageFile: PackageFile;
}) => {
  try {
    if (!packageFile.file) throw `no package file present`;
    stringifyPkg({
      newContents: packageFile.pkg,
      extname: packageFile.file.extname,
    });
    return true;
  } catch (e: any) {
    if (e?.message === "Can only stringify objects, not null") {
      logger.error(
        "It appears that a dependency within this repo does not have a version specified."
      );
    }
    throw new Error(`within ${packageFile.name} => ${e?.message}`);
  }
};

export function* configFile({
  cwd,
  changeFolder = ".changes",
}: {
  cwd: string;
  changeFolder?: string;
}): Operation<ConfigFile & { file: File }> {
  const inputFile: File = yield loadFile(
    path.join(changeFolder, "config.json"),
    cwd
  );
  try {
    const parsed = configFileSchema(cwd).parse(JSON.parse(inputFile.content));
    return {
      file: inputFile,
      ...parsed,
    };
  } catch (error: any) {
    const validationError = fromZodError(error);
    throw new MainError({ exitCode: 1, message: validationError.message });
  }
}

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

export function* loadChangeFiles({
  cwd,
  paths,
}: {
  cwd: string;
  paths: string[];
}): Operation<File[]> {
  const files = paths.map((file) => loadFile(file, cwd));
  return yield all(files);
}

export function* changeFilesRemove({
  logger,
  cwd,
  paths,
}: {
  logger: Logger;
  cwd: string;
  paths: string[];
}): Operation<string> {
  for (let changeFilePath of paths) {
    yield fs.unlink(path.posix.join(cwd, changeFilePath));
    logger.info(`${changeFilePath} was deleted`);
  }
  return paths;
}

export function* readChangelog({
  logger,
  cwd,
  packagePath = "",
  create = true,
}: {
  logger: Logger;
  cwd: string;
  packagePath?: string;
  create?: boolean;
}): Operation<File> {
  let file = null;
  try {
    file = yield loadFile(path.join(packagePath, "CHANGELOG.md"), cwd);
  } catch {
    if (create) {
      logger.info("Could not load the CHANGELOG.md. Creating one.");
      file = {
        path: path.join(packagePath, "CHANGELOG.md"),
        content: "# Changelog\n\n\n",
      };
    }
  }
  return file;
}

export function* writeChangelog({
  changelog,
  cwd,
}: {
  changelog: File;
  cwd: string;
}): Operation<void | Error> {
  return yield saveFile(changelog, cwd);
}
