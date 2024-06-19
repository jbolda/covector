import fs from "fs";
import type { FunctionPipe } from "../../types/src";
import type { ConfigFile, Logger } from "@covector/types";
import type { GitHub } from "@actions/github/lib/utils";

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

export const createReleases = curry(
  async (
    {
      logger,
      core,
      octokit,
      owner,
      repo,
      targetCommitish,
    }: {
      logger: Logger;
      core: { [k: string]: Function };
      octokit: InstanceType<typeof GitHub>;
      owner: string;
      repo: string;
      targetCommitish: string;
    },
    pipe: FunctionPipe
  ): Promise<void> => {
    if (!pipe.pkgFile) {
      logger.error(
        `skipping Github Release for ${pipe.pkg}, no package file present`
      );
      return;
    }

    if (!pipe.releaseTag) {
      logger.error(
        `skipping Github Release for ${pipe.pkg}, releaseTag is null`
      );
      return;
    }

    const releaseTag = pipe.releaseTag;
    logger.debug(`creating release with tag ${releaseTag}`);
    const existingRelease = await octokit.rest.repos
      .listReleases({
        owner,
        repo,
      })
      .then((releases) => {
        const release = releases.data.find(
          (r) => r.draft && r.tag_name === releaseTag
        );
        return release ? release : null;
      })
      .catch((error: Error) => null);

    let releaseResponse;
    if (existingRelease && existingRelease.draft) {
      logger.info(
        `updating and publishing Github Release for ${pipe.pkg}@${pipe.pkgFile.version}`
      );
      releaseResponse = await octokit.rest.repos
        .updateRelease({
          owner,
          repo,
          release_id: existingRelease.id,
          body: `${
            existingRelease.body ? `${existingRelease.body}\n` : ""
          }${commandText(pipe.pkgCommandsRan)}`,
          draft: false,
        })
        .then((response) => response.data);
    } else {
      logger.info(
        `creating Github Release for ${pipe.pkg}@${pipe.pkgFile.version}`
      );
      releaseResponse = await octokit.rest.repos
        .createRelease({
          owner,
          repo,
          tag_name: releaseTag,
          name: `${pipe.pkg} v${pipe.pkgFile.version}`,
          body: commandText(pipe.pkgCommandsRan),
          draft: core.getInput("draftRelease") === "true" ? true : false,
          target_commitish: targetCommitish,
        })
        .then((response) => response.data);
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

    logger.info({
      msg: `github release created for ${pipe.pkg} with id: ${releaseResponse.id}`,
      renderAsYAML: releaseResponse,
    });

    if (pipe.assets) {
      try {
        for (let asset of pipe.assets) {
          logger.info(
            `uploading asset ${asset.name} for ${pipe.pkg}@${pipe.pkgFile.version}`
          );
          const uploadedAsset = await octokit.rest.repos
            .uploadReleaseAsset({
              owner,
              repo,
              release_id: releaseResponse.id,
              name: asset.name,
              // this type seems to be set incorrectly upstream as their API expects a Buffer
              // per https://docs.github.com/en/rest/releases/assets?apiVersion=2022-11-28#upload-a-release-asset
              // or we need to somehow pass in the expected body type but... let's just ignore it
              // @ts-expect-error error TS2322: Type 'Buffer' is not assignable to type 'string'.
              data: fs.readFileSync(asset.path),
            })
            .then((response) => response.data);
          logger.info({
            msg: `asset uploaded to release for ${pipe.pkg}`,
            renderAsYAML: uploadedAsset,
          });
        }
      } catch (error) {
        logger.error(error);
      }
    }
  }
);
