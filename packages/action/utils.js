const fs = require("fs");

const commandText = (pkg) => {
  const { precommand, command, postcommand } = pkg;
  let text = "";

  if (typeof precommand !== "boolean") {
    text = `${text}${precommand}\n`;
  }

  if (typeof command !== "boolean") {
    text = `${text}${command}\n`;
  }

  if (typeof postcommand !== "boolean") {
    text = `${text}${postcommand}\n`;
  }

  return text === "" ? "Publish complete." : text;
};

const packageListToArray = (list) => {
  if (list === "") {
    return [];
  } else {
    return list.split(",");
  }
};

const injectPublishFunctions = curry((functionsToInject, config) => {
  return Object.keys(config.pkgManagers).reduce((finalConfig, pkgManager) => {
    finalConfig.pkgManagers[pkgManager] = Object.keys(
      config.pkgManagers[pkgManager]
    ).reduce((pm, p) => {
      if (p.startsWith("publish")) {
        pm[p] = Array.isArray(pm[p])
          ? pm[p].concat(functionsToInject)
          : [pm[p]].concat(functionsToInject);
      }
      return pm;
    }, config.pkgManagers[pkgManager]);

    return finalConfig;
  }, config);
});

function curry(func) {
  return function f1(...args1) {
    if (args1.length >= func.length) {
      return new Promise((resolve) => resolve(func.apply(null, args1)));
    } else {
      return function f2(...args2) {
        return f1.apply(null, args1.concat(args2));
      };
    }
  };
}

const createReleases = async (pkg) => {
  const { octokit, owner, repo } = this;
  console.log(`creating release for ${pkg.pkg}@${pkg.pkgFile.version}`);
  const createReleaseResponse = await octokit.repos.createRelease({
    owner,
    repo,
    tag_name: `${pkg.pkg}-v${pkg.pkgFile.version}`,
    name: `${pkg.pkg} v${pkg.pkgFile.version}`,
    body: commandText(pkg),
    draft: core.getInput("draftRelease") === "true" ? true : false,
  });
  const { data } = createReleaseResponse;

  core.setOutput(`${pkg.pkg}-published`, "true");

  console.log("release created: ", data);
  const { id: releaseId } = data;

  if (pkg.assets) {
    try {
      for (let asset of pkg.assets) {
        console.log(
          `uploading asset ${asset.name} for ${pkg.pkg}@${pkg.pkgFile.version}`
        );
        const uploadedAsset = await octokit.repos.uploadReleaseAsset({
          owner,
          repo,
          release_id: releaseId,
          name: asset.name,
          data: fs.readFileSync(asset.path),
        });
      }
    } catch (error) {
      console.error(error);
    }
  }
};

module.exports = {
  commandText,
  packageListToArray,
  injectPublishFunctions,
  createReleases,
};
