import fs from "fs";
import type { ConfigFile, FunctionPipe } from "../../types/src";

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
    if (!config) return config;
    if (!Array.isArray(functionsToInject))
      throw new Error(
        "injectPublishFunctions() in modifyConfig() expects an array"
      );
    return {
      ...config,
      pkgManagers: injectIntoPublish(config.pkgManagers, functionsToInject),
      packages: injectIntoPublish(config.packages, functionsToInject),
    };
  }
);

const injectIntoPublish = (
  packages: { [k: string]: object } | undefined,
  functionsToInject: Function[]
) => {
  if (!packages) return {};
  return Object.keys(packages).reduce((finalConfig, pkg) => {
    finalConfig![pkg] = Object.keys(packages![pkg]).reduce(
      (pm: { [k: string]: any }, p) => {
        if (p.startsWith("publish") && pm[p]) {
          pm[p] = Array.isArray(pm[p])
            ? pm[p].concat(functionsToInject)
            : [pm[p]].concat(functionsToInject);
        }
        return pm;
      },
      packages![pkg] || {}
    );

    return finalConfig;
  }, packages);
};

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

type GithubRelease = {
  id: number;
  tag_name: string;
  draft: boolean;
  prerelease: boolean;
};
type GithubReleaseResponse = {
  data: GithubRelease;
};
type GithubReleaseResponses = {
  data: GithubRelease[];
};

export const createReleases = curry(
  async (
    {
      core,
      octokit,
      owner,
      repo,
      targetCommitish,
    }: {
      core: Methods;
      octokit: MoreMethods;
      owner: string;
      repo: string;
      targetCommitish: string;
    },
    pipe: FunctionPipe
  ): Promise<void> => {
    if (!pipe.pkgFile) {
      console.log(
        `skipping Github Release for ${pipe.pkg}, no package file present`
      );
      return;
    }

    if (!pipe.releaseTag) {
      console.log(
        `skipping Github Release for ${pipe.pkg}, releaseTag is null`
      );
      return;
    }

    const releaseTag = pipe.releaseTag;
    core.debug(`creating release with tag ${releaseTag}`);
    const existingRelease = await octokit.repos
      .listReleases({
        owner,
        repo,
      })
      .then((releases: GithubReleaseResponses) => {
        const release = releases.data.find(
          (r: GithubRelease) => r.draft && r.tag_name === releaseTag
        );
        return release ? release : null;
      })
      .catch((error: Error) => null);

    let releaseResponse;
    if (existingRelease && existingRelease.draft) {
      console.log(
        `updating and publishing Github Release for ${pipe.pkg}@${pipe.pkgFile.version}`
      );
      releaseResponse = await octokit.repos
        .updateRelease({
          owner,
          repo,
          release_id: existingRelease.id,
          body: `${
            existingRelease.body ? `${existingRelease.body}\n` : ""
          }${commandText(pipe.pkgCommandsRan)}`,
          draft: false,
        })
        .then((response: GithubReleaseResponse) => response.data);
    } else {
      console.log(
        `creating Github Release for ${pipe.pkg}@${pipe.pkgFile.version}`
      );
      releaseResponse = await octokit.repos
        .createRelease({
          owner,
          repo,
          tag_name: releaseTag,
          name: `${pipe.pkg} v${pipe.pkgFile.version}`,
          body: commandText(pipe.pkgCommandsRan),
          draft: core.getInput("draftRelease") === "true" ? true : false,
          target_commitish: targetCommitish,
        })
        .then((response: GithubReleaseResponse) => response.data);
    }
    // keeping this one since this was originally used
    // considered deprecated and will remove in v1
    core.setOutput(`${pipe.pkg}-published`, "true");
    // this will be used moving forward
    const cleanPipePkg = pipe.pkg
      .replace(/\@/g, "-")
      .replace(/\//g, "-")
      .replace(/\_/g, "-");
    core.setOutput(`published-${cleanPipePkg}`, "true");

    // output information about the created release
    core.setOutput("releaseUrl", releaseResponse.url);
    core.setOutput("releaseUploadUrl", releaseResponse.upload_url);
    core.setOutput("releaseId", releaseResponse.id);

    core.setOutput(`${cleanPipePkg}-releaseUrl`, releaseResponse.url);
    core.setOutput(
      `${cleanPipePkg}-releaseUploadUrl`,
      releaseResponse.upload_url
    );
    core.setOutput(`${cleanPipePkg}-releaseId`, releaseResponse.id);

    core.startGroup(`github release created for ${pipe.pkg}`);
    console.log("releaseId", releaseResponse.id);
    console.log("release created: ", releaseResponse);
    core.endGroup();

    if (pipe.assets) {
      try {
        for (let asset of pipe.assets) {
          console.log(
            `uploading asset ${asset.name} for ${pipe.pkg}@${pipe.pkgFile.version}`
          );
          const uploadedAsset = await octokit.repos
            .uploadReleaseAsset({
              owner,
              repo,
              release_id: releaseResponse.id,
              name: asset.name,
              data: fs.readFileSync(asset.path),
            })
            .then((response: GithubReleaseResponse) => response.data);
          core.startGroup(`asset uploaded to release for ${pipe.pkg}`);
          console.log("release created: ", uploadedAsset);
          core.endGroup();
        }
      } catch (error) {
        console.error(error);
      }
    }
  }
);
