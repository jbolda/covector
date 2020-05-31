const { readPkgFile, writePkgFile } = require("@covector/files");
const semver = require("semver");

module.exports.apply = async (file) => {
  const pkged = await readPkgFile(file);
  const next = { ...pkged.pkg };
  next.version = semver.inc(next.version, "patch");
  return await writePkgFile({ previousVFile: pkged.vfile, newContents: next });
};
