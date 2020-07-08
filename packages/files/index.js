const vfile = require("to-vfile");
const globby = require("globby");
const fs = require("fs");
const path = require("path");
const TOML = require("@tauri-apps/toml");
const semver = require("semver");

const parsePkg = (file) => {
  switch (file.extname) {
    case ".toml":
      const parsedTOML = TOML.parse(file.contents);
      return {
        version: parsedTOML.package.version,
        versionMajor: semver.major(parsedTOML.package.version),
        versionMinor: semver.minor(parsedTOML.package.version),
        versionPatch: semver.patch(parsedTOML.package.version),
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
};

const stringifyPkg = ({ newContents, extname }) => {
  switch (extname) {
    case ".toml":
      return TOML.stringify(newContents);
    case ".json":
      return `${JSON.stringify(newContents, null, "  ")}\n`;
  }
  throw new Error("Unknown package file type.");
};

module.exports.readPkgFile = async ({ file, nickname }) => {
  const inputVfile = await vfile.read(file, "utf8");
  const parsed = parsePkg(inputVfile);
  return {
    vfile: inputVfile,
    ...parsed,
    name: nickname,
  };
};

module.exports.writePkgFile = async ({ packageFile }) => {
  const vFileNext = { ...packageFile.vfile };
  vFileNext.contents = stringifyPkg({
    newContents: packageFile.pkg,
    extname: packageFile.vfile.extname,
  });
  const inputVfile = await vfile.write(vFileNext, "utf8");
  return inputVfile;
};

module.exports.configFile = async ({ cwd, changeFolder = ".changes" }) => {
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

module.exports.changeFiles = async ({
  cwd,
  changeFolder = ".changes",
  remove = true,
}) => {
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

module.exports.readChangelog = async ({ cwd }) => {
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

module.exports.writeChangelog = async ({ changelog }) => {
  const inputVfile = await vfile.write(changelog, "utf8");
  return inputVfile;
};
