import fs from "fs";
import { ConfigFile, FunctionPipe } from "../../covector/src/run";

export const commandText = (pkg: {
  precommand: string | boolean | null;
  command: string | boolean | null;
  postcommand: string | boolean | null;
}): string => {
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

export const packageListToArray = (list: string): string[] => {
  if (list === "" || !list) {
    return [];
  } else {
    return list.split(",");
  }
};

export const injectPublishFunctions = curry(
  (functionsToInject: Function[], config: ConfigFile) => {
    if (!config || !config.pkgManagers) return config;
    return Object.keys(config.pkgManagers).reduce((finalConfig, pkgManager) => {
      finalConfig.pkgManagers![pkgManager] = Object.keys(
        config.pkgManagers![pkgManager]
      ).reduce((pm: { [k: string]: any }, p) => {
        if (p.startsWith("publish")) {
          pm[p] = Array.isArray(pm[p])
            ? pm[p].concat(functionsToInject)
            : [pm[p]].concat(functionsToInject);
        }
        return pm;
      }, config.pkgManagers![pkgManager] || { pkgManagers: {} });

      return finalConfig;
    }, config || { pkgManagers: {} });
  }
);

function curry(func: Function): Function {
  return function f1(...args1: any[]): Promise<Function> | Function {
    if (args1.length >= func.length) {
      return new Promise((resolve) => resolve(func.apply(null, args1)));
    } else {
      return function f2(...args2: any[]) {
        return f1.apply(null, args1.concat(args2));
      };
    }
  };
}

export type Methods = { [k: string]: Function };
export type MoreMethods = { [k: string]: Methods };

export const createReleases = curry(
  async (
    {
      core,
      octokit,
      owner,
      repo,
    }: {
      core: Methods;
      octokit: MoreMethods;
      owner: string;
      repo: string;
    },
    pipe: FunctionPipe
  ): Promise<void> => {
    if (!pipe.pkgFile) {
      console.log(
        `skipping Github Release for ${pipe.pkg}, no package file present`
      );
      return;
    }
    console.log(
      `creating Github Release for ${pipe.pkg}@${pipe.pkgFile.version}`
    );
    const createReleaseResponse = await octokit.repos.createRelease({
      owner,
      repo,
      tag_name: `${pipe.pkg}-v${pipe.pkgFile.version}`,
      name: `${pipe.pkg} v${pipe.pkgFile.version}`,
      body: commandText(pipe.pkgCommandsRan),
      draft: core.getInput("draftRelease") === "true" ? true : false,
    });
    const { data } = createReleaseResponse;

    core.setOutput(`${pipe.pkg}-published`, "true");

    console.log("release created: ", data);
    const { id: releaseId } = data;

    if (pipe.assets) {
      try {
        for (let asset of pipe.assets) {
          console.log(
            `uploading asset ${asset.name} for ${pipe.pkg}@${pipe.pkgFile.version}`
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
  }
);
