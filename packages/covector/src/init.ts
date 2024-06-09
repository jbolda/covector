import { type Logger } from "@covector/types";
import inquirer from "inquirer";
import globby from "globby";
import { default as fsDefault, Dir } from "fs";
// this is compatible with node@12+
const fs = fsDefault.promises;
import path from "path";
import { all } from "effection";
import { readPkgFile } from "@covector/files";
import type { PackageFile } from "@covector/types";
const covectorPackageFile = require("../package.json");

export const init = function* init({
  logger,
  cwd = process.cwd(),
  changeFolder = ".changes",
  yes,
}: {
  logger: Logger;
  cwd?: string;
  changeFolder?: string;
  yes: boolean;
}): Generator<any, any, any> {
  const pkgs: string[] = yield packageFiles({ cwd });
  let packages: {
    [k: string]: { path: string; manager: string; dependencies?: string[] };
  } = {};
  let pkgManagers: { [k: string]: boolean } = {};
  let gitURL: boolean | string = false;
  const pkgFiles: PackageFile[] = yield all(
    pkgs.map((pkg: string) => readPkgFile({ file: pkg, nickname: pkg, cwd }))
  );

  for (let pkgFile of pkgFiles) {
    if (!pkgFile?.pkg?.workspaces) {
      const manager: string = yield derivePkgManager({
        path: path.dirname(`./${pkgFile.name}`),
        pkgFile,
      });
      pkgManagers[manager] = true;
      const dependencies = buildDependencyGraph({ pkgFile, pkgFiles });

      packages[pkgFile?.pkg?.name || pkgFile?.pkg?.package?.name] = {
        path: path.dirname(`./${pkgFile.name}`),
        manager,
        ...(dependencies.length > 0 ? { dependencies } : {}),
      };
    }

    if (!gitURL) {
      const repoURL = pkgFile?.pkg?.repository;
      if (repoURL) {
        const tryURL =
          typeof repoURL === "string"
            ? repoURL.slice(
                0,
                repoURL.includes(".git", repoURL.length - 5)
                  ? repoURL.length - 4
                  : repoURL.length
              )
            : "";
        if (tryURL !== "") {
          try {
            const parseURL = new URL(tryURL);
            // if we parse fine, let's try using it
            gitURL = tryURL;
          } catch (error) {
            // issue with the url, just toss it
          }
        }
      }
    }
  }

  const answers: { [k: string]: string } = yield inquirer
    .prompt([
      {
        type: "input",
        name: "git url",
        message: "What is the url to your github repo?",
        when: !yes,
        ...(!gitURL ? {} : { default: gitURL }),
        filter: (userInput, answers) => {
          if (userInput.endsWith("/")) {
            return userInput;
          } else {
            return userInput.length > 0 ? `${userInput}/` : userInput;
          }
        },
      },
      {
        type: "confirm",
        name: "github actions",
        message: "should we include github action workflows?",
        default: true,
        when: !yes,
      },
      {
        type: "input",
        name: "branch name",
        message: "What is the name of your default branch?",
        default: "main",
        when: (answers) => !yes && answers["github actions"],
      },
    ])
    .then((answers) => {
      return { "github actions": true, ...answers };
    })
    .catch((error) => {
      throw new Error(error);
    });

  try {
    const testOpen: Dir = yield fs.opendir(path.posix.join(cwd, changeFolder));
    logger.info(`The ${changeFolder} folder exists, skipping creation.`);
    yield testOpen.close();
  } catch (e) {
    logger.info(`Creating the ${changeFolder} directory.`);
    yield fs.mkdir(path.posix.join(cwd, changeFolder));
  }

  const javascript = {
    version: true,
    getPublishedVersion: "npm view ${ pkgFile.pkg.name } version",
    publish: ["npm publish --access public"],
  };

  const rust = {
    version: true,
    getPublishedVersion:
      'cargo search ${ pkg.pkg } --limit 1 | sed -nE \'s/^[^"]*"//; s/".*//1p\' -',
    publish: ["cargo publish"],
  };

  const githubAction = {
    preversion: ["npm install", "npm run build"],
    getPublishedVersion:
      "git tag v${ pkgFile.version } 2> /dev/null || echo ${ pkgFile.version }",
    publish: [
      "git tag v${ pkgFile.versionMajor } -f",
      "git tag v${ pkgFile.versionMajor }.${ pkgFile.versionMinor } -f",
      "git push --tags -f",
    ],
  };

  const config = {
    ...(answers["git url"] ? { gitSiteUrl: answers["git url"] } : {}),
    pkgManagers: {
      ...(pkgManagers.javascript ? { javascript } : {}),
      ...(pkgManagers.rust ? { rust } : {}),
      ...(pkgManagers["github action"]
        ? { ["github action"]: githubAction }
        : {}),
    },
    packages,
  };

  // .changes/config.json
  try {
    const testOpen = yield fs.open(
      path.posix.join(cwd, changeFolder, "config.json"),
      "r"
    );
    logger.info(
      `The config.json exists in ${changeFolder}, skipping creation.`
    );
    yield testOpen.close();
  } catch (e) {
    logger.info("Writing out the config file.");
    yield fs.writeFile(
      path.posix.join(cwd, changeFolder, "config.json"),
      JSON.stringify(config, null, 2)
    );
  }

  // .changes/readme.md
  try {
    const testOpen = yield fs.open(
      path.posix.join(cwd, changeFolder, "readme.md"),
      "r"
    );
    logger.info(`The readme.md exists in ${changeFolder}, skipping creation.`);
    yield testOpen.close();
  } catch (e) {
    logger.info("Writing out a readme to serve as your guide.");
    yield fs.writeFile(path.posix.join(cwd, changeFolder, "readme.md"), readme);
  }

  if (answers["github actions"]) {
    const covectorVersionSplit = covectorPackageFile.version.split(".");
    let covectorVersion: string = `${covectorVersionSplit[0]}.${covectorVersionSplit[1]}`;

    try {
      const testOpen: Dir = yield fs.opendir(
        path.posix.join(cwd, "./.github/workflows/")
      );
      logger.info(`The .github/workflows folder exists, skipping creation.`);
      yield testOpen.close();
    } catch (e) {
      logger.info(`Creating the .github/workflows directory.`);
      yield fs.mkdir(path.posix.join(cwd, "./.github/workflows/"), {
        recursive: true,
      });
    }

    // github status
    try {
      const testOpen = yield fs.open(
        path.posix.join(cwd, ".github", "workflows", "covector-status.yml"),
        "r"
      );
      logger.info(
        `The status workflow exists in ./.github/workflows, skipping creation.`
      );
      yield testOpen.close();
    } catch (e) {
      logger.info(
        "Writing out covector-status.yml to give you a covector update on PR."
      );
      yield fs.writeFile(
        path.posix.join(cwd, ".github", "workflows", "covector-status.yml"),
        githubStatusWorkflow({ version: covectorVersion })
      );
    }

    // github version and publish
    try {
      const testOpen = yield fs.open(
        path.posix.join(
          cwd,
          ".github",
          "workflows",
          "covector-version-or-publish.yml"
        ),
        "r"
      );
      logger.info(
        `The version/publish workflow exists in ./.github/workflows, skipping creation.`
      );
      yield testOpen.close();
    } catch (e) {
      logger.info(
        "Writing out covector-version-or-publish.yml to version and publish your packages."
      );
      yield fs.writeFile(
        path.posix.join(
          cwd,
          ".github",
          "workflows",
          "covector-version-or-publish.yml"
        ),
        githubPublishWorkflow({
          pkgManagers,
          branchName: answers["branch name"],
          version: covectorVersion,
        })
      );
    }
  }

  return "complete";
};

const packageFiles = async ({ cwd = process.cwd() }) => {
  return await globby(
    ["**/package.json", "**/Cargo.toml", "!**/__fixtures__", "!**/__tests__"],
    {
      cwd,
      gitignore: true,
    }
  );
};

const derivePkgManager = async ({
  path,
  pkgFile,
}: {
  path: string;
  pkgFile: PackageFile;
}) => {
  const actionFile = await globby(["action.yml"], {
    cwd: path,
    gitignore: true,
  });
  if (actionFile.length > 0) {
    return "github action";
  } else {
    return pkgFile?.name?.endsWith("Cargo.toml") ? "rust" : "javascript";
  }
};

// build dep graph
const buildDependencyGraph = ({
  pkgFile,
  pkgFiles,
}: {
  pkgFile: PackageFile;
  pkgFiles: PackageFile[];
}) => {
  const pkgDeps = [
    ...(pkgFile.pkg?.dependencies ? Object.keys(pkgFile.pkg.dependencies) : []),
    ...(pkgFile.pkg?.devDependencies
      ? Object.keys(pkgFile.pkg.devDependencies)
      : []),
  ];

  return pkgDeps.reduce((deps: string[], dep: string) => {
    for (let pkg of pkgFiles) {
      if (dep === pkg?.pkg?.name) {
        return deps.concat([dep]);
      }
    }

    return deps;
  }, []);
};

const readme = `# Changes

##### via https://github.com/jbolda/covector

As you create PRs and make changes that require a version bump, please add a new markdown file in this folder. You do not note the version _number_, but rather the type of bump that you expect: major, minor, or patch. The filename is not important, as long as it is a \`.md\`, but we recommend that it represents the overall change for organizational purposes.

When you select the version bump required, you do _not_ need to consider dependencies. Only note the package with the actual change, and any packages that depend on that package will be bumped automatically in the process.

Use the following format:

\`\`\`md
---
"package-a": patch
"package-b": minor
---

Change summary goes here

\`\`\`

Summaries do not have a specific character limit, but are text only. These summaries are used within the (future implementation of) changelogs. They will give context to the change and also point back to the original PR if more details and context are needed.

Changes will be designated as a \`major\`, \`minor\` or \`patch\` as further described in [semver](https://semver.org/).

Given a version number MAJOR.MINOR.PATCH, increment the:

- MAJOR version when you make incompatible API changes,
- MINOR version when you add functionality in a backwards compatible manner, and
- PATCH version when you make backwards compatible bug fixes.

Additional labels for pre-release and build metadata are available as extensions to the MAJOR.MINOR.PATCH format, but will be discussed prior to usage (as extra steps will be necessary in consideration of merging and publishing).
`;

const githubStatusWorkflow = ({
  version = "0",
}: {
  version?: string;
}) => `name: covector status
on: [pull_request]

jobs:
  covector:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0 # required for use of git history
      - name: covector status
        uses: jbolda/covector/packages/action@covector-v${version}
        id: covector
        with:
          command: 'status'
`;

const githubPublishWorkflow = ({
  branchName = "main",
  pkgManagers,
  version = "0",
}: {
  branchName: string;
  pkgManagers: { [k: string]: boolean };
  version?: string;
}) => `name: version or publish

on:
  push:
    branches:
      - ${branchName}

jobs:
  version-or-publish:
    runs-on: ubuntu-latest
    timeout-minutes: 65
    outputs:
      change: \${{ steps.covector.outputs.change }}
      commandRan: \${{ steps.covector.outputs.commandRan }}
      successfulPublish: \${{ steps.covector.outputs.successfulPublish }}

    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0 # required for use of git history${
            pkgManagers.javascript
              ? `
      - uses: actions/setup-node@v3
        with:
          node-version: 14
          registry-url: 'https://registry.npmjs.org'`
              : ""
          }${
            pkgManagers.rust
              ? `
      - name: cargo login
        run: cargo login \${{ secrets.crate_token }}`
              : ""
          }
      - name: git config
        run: |
          git config --global user.name "\${{ github.event.pusher.name }}"
          git config --global user.email "\${{ github.event.pusher.email }}"
      - name: covector version or publish (publish when no change files present)
        uses: jbolda/covector/packages/action@covector-v${version}
        id: covector
        env:${
          pkgManagers.javascript
            ? `
          NODE_AUTH_TOKEN: \${{ secrets.NPM_TOKEN }}`
            : ""
        }${
          pkgManagers.rust
            ? `
          CARGO_AUDIT_OPTIONS: \${{ secrets.CARGO_AUDIT_OPTIONS }}`
            : ""
        }
        with:
          token: \${{ secrets.GITHUB_TOKEN }}
          command: 'version-or-publish'
          createRelease: true
      - name: Create Pull Request With Versions Bumped
        id: cpr
        uses: peter-evans/create-pull-request@v3
        if: steps.covector.outputs.commandRan == 'version'
        with:
          title: "Publish New Versions"
          commit-message: "publish new versions"
          labels: "version updates"
          branch: "release"
          body: \${{ steps.covector.outputs.change }}
`;
