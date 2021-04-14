import inquirer from "inquirer";
import globby from "globby";
import { default as fsDefault, Dir } from "fs";
// this is compatible with node@12+
const fs = fsDefault.promises;
import path from "path";
// @ts-ignore
import { readPkgFile, PackageFile } from "@covector/files";
const covectorPackageFile = require("../package.json");

// for future typescripting reference
// most of the @ts-ignore have to do with Dir/FileHandle vs string
// and not considering yield correctly?

export const init = function* init({
  cwd = process.cwd(),
  changeFolder = ".changes",
  yes,
}: {
  cwd: string;
  changeFolder: string;
  yes: boolean;
}): Generator<string> {
  //@ts-ignore
  const answers: { [k: string]: string } = yield inquirer
    .prompt([
      {
        type: "input",
        name: "git url",
        message: "What is the url to your github repo?",
        when: !yes,
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
    //@ts-ignore
    const testOpen: Dir = yield fs.opendir(path.posix.join(cwd, changeFolder));
    console.log(`The ${changeFolder} folder exists, skipping creation.`);
    //@ts-ignore
    yield testOpen.close();
  } catch (e) {
    console.log(`Creating the ${changeFolder} directory.`);
    //@ts-ignore
    yield fs.mkdir(path.posix.join(cwd, changeFolder));
  }

  //@ts-ignore
  const pkgs: string[] = yield packageFiles({ cwd });
  let packages: {
    [k: string]: { path: string; manager: string; dependencies?: string[] };
  } = {};
  let pkgManagers: { [k: string]: boolean } = {};
  //@ts-ignore
  const pkgFiles: PackageFile[] = yield Promise.all(
    pkgs.map((pkg: string) =>
      readPkgFile({ file: path.posix.join(cwd, `${pkg}`), nickname: pkg })
    )
  );
  for (let pkgFile of pkgFiles) {
    //@ts-ignore
    if (!pkgFile.pkg.workspaces) {
      //@ts-ignore
      const manager: string = yield derivePkgManager({
        path: path.dirname(`./${pkgFile.name}`),
        //@ts-ignore
        pkgFile,
      });
      pkgManagers[manager] = true;
      const dependencies = buildDependencyGraph({ pkgFile, pkgFiles });

      //@ts-ignore
      packages[pkgFile?.pkg?.name || pkgFile?.pkg?.package?.name] = {
        path: path.dirname(`./${pkgFile.name}`),
        manager,
        ...(dependencies.length > 0 ? { dependencies } : {}),
      };
    }
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
    //@ts-ignore
    const testOpen = yield fs.open(
      path.posix.join(cwd, changeFolder, "config.json"),
      "r"
    );
    console.log(
      `The config.json exists in ${changeFolder}, skipping creation.`
    );
    //@ts-ignore
    yield testOpen.close();
  } catch (e) {
    console.log("Writing out the config file.");
    //@ts-ignore
    yield fs.writeFile(
      path.posix.join(cwd, changeFolder, "config.json"),
      JSON.stringify(config, null, 2)
    );
  }

  // .changes/readme.md
  try {
    //@ts-ignore
    const testOpen = yield fs.open(
      path.posix.join(cwd, changeFolder, "readme.md"),
      "r"
    );
    console.log(`The readme.md exists in ${changeFolder}, skipping creation.`);
    //@ts-ignore
    yield testOpen.close();
  } catch (e) {
    console.log("Writing out a readme to serve as your guide.");
    //@ts-ignore
    yield fs.writeFile(path.posix.join(cwd, changeFolder, "readme.md"), readme);
  }

  if (answers["github actions"]) {
    const covectorVersionSplit = covectorPackageFile.version.split(".");
    let covectorVersion: string = `${covectorVersionSplit[0]}.${covectorVersionSplit[1]}`;

    try {
      //@ts-ignore
      const testOpen: Dir = yield fs.opendir(
        path.posix.join(cwd, "./.github/workflows/")
      );
      console.log(`The .github/workflows folder exists, skipping creation.`);
      //@ts-ignore
      yield testOpen.close();
    } catch (e) {
      console.log(`Creating the .github/workflows directory.`);
      //@ts-ignore
      yield fs.mkdir(path.posix.join(cwd, "./.github/workflows/"), {
        recursive: true,
      });
    }

    // github status
    try {
      //@ts-ignore
      const testOpen = yield fs.open(
        path.posix.join(cwd, ".github", "workflows", "covector-status.yml"),
        "r"
      );
      console.log(
        `The status workflow exists in ./.github/workflows, skipping creation.`
      );
      //@ts-ignore
      yield testOpen.close();
    } catch (e) {
      console.log(
        "Writing out covector-status.yml to give you a covector update on PR."
      );
      //@ts-ignore
      yield fs.writeFile(
        path.posix.join(cwd, ".github", "workflows", "covector-status.yml"),
        githubStatusWorkflow({ version: covectorVersion })
      );
    }

    // github version and publish
    try {
      //@ts-ignore
      const testOpen = yield fs.open(
        path.posix.join(
          cwd,
          ".github",
          "workflows",
          "covector-version-or-publish.yml"
        ),
        "r"
      );
      console.log(
        `The version/publish workflow exists in ./.github/workflows, skipping creation.`
      );
      //@ts-ignore
      yield testOpen.close();
    } catch (e) {
      console.log(
        "Writing out covector-version-or-publish.yml to version and publish your packages."
      );
      //@ts-ignore
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
  pkgFile: { name: string };
}) => {
  const actionFile = await globby(["action.yml"], {
    cwd: path,
    gitignore: true,
  });
  if (actionFile.length > 0) {
    return "github action";
  } else {
    return pkgFile.name.endsWith("Cargo.toml") ? "rust" : "javascript";
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
      - uses: actions/checkout@v2
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
      - uses: actions/checkout@v2
        with:
          fetch-depth: 0 # required for use of git history${
            pkgManagers.javascript
              ? `
      - uses: actions/setup-node@v2
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
