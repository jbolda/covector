# covector

Transparent and flexible change management for publishing packages and assets. Publish and deploy from a single asset repository, monorepos, and even multi-language repositories.

## Packages

| package                                     | version                                                                                                                           |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| [covector](./packages/covector)             | [![npm](https://img.shields.io/npm/v/covector?style=for-the-badge)](https://www.npmjs.com/package/covector)                       |
| [@covector/apply](./packages/apply)         | [![npm](https://img.shields.io/npm/v/@covector/apply?style=for-the-badge)](https://www.npmjs.com/package/@covector/apply)         |
| [@covector/assemble](./packages/assemble)   | [![npm](https://img.shields.io/npm/v/@covector/assemble?style=for-the-badge)](https://www.npmjs.com/package/@covector/assemble)   |
| [@covector/changelog](./packages/changelog) | [![npm](https://img.shields.io/npm/v/@covector/changelog?style=for-the-badge)](https://www.npmjs.com/package/@covector/changelog) |
| [@covector/command](./packages/command)     | [![npm](https://img.shields.io/npm/v/@covector/command?style=for-the-badge)](https://www.npmjs.com/package/@covector/command)     |
| [@covector/files](./packages/files)         | [![npm](https://img.shields.io/npm/v/@covector/files?style=for-the-badge)](https://www.npmjs.com/package/@covector/files)         |

## Usage

This library is primarily designed as a CLI, but we do also have a GitHub Action that can be used. The CLI commands can be used within any CI/CD environment. To use this in a production setting, we expect a `.changes` folder where one would put the `config.json`. (Eventually an `init` command can bootstrap this for you. Would love to see a PR adding this.) We typically will recommend adding covector as a dev dependency at the root. Then one can run `yarn covector` to access the commands. We include a dry run mode that you can test the version and publish commands with.

### Primary Commands

| Command | Description                                                                                                                                             |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| init    | Initializes the configuration required for covector.                                                                                                    |
| status  | Outputs the status letting you know if there are changes and what they are.                                                                             |
| config  | Pretty prints the config.                                                                                                                               |
| version | Will see which packages have changes, run the version bumps on any package changed, and update the changelog.                                           |
| publish | Will run the `getPublishedVersion` specified in the config, and any package whose version does not match that return will attempt the publish commands. |

## GitHub Action

The GitHub Action adds a little extra sugar on top. One of the additional inputs is a `version-or-publish` command, and it will dynamically choose to run either command depending on the context.

### version command

The context is the existence of changes in the `.changes` folder. if there are changes, we expect that the next command to be run is the version command. The version command will delete those change files, apply the applicable version bumps to your packages, and create changelogs.

### publish command

If we find that there are no changes, then we will run the publish command. The publish command is written with the expectation of failure. The design is to fail forward and be able to recover from it cleanly. Publishing on CI has many failure points and it will happen at some point. The publish sequence can be primarily grouped into two main parts. The first part of the command will run the `getPublishedVersions` from your config which will determine if the current package version is published. Theoretically we could skip this command and it would always publish, but some package managers will fail and exit the command if it's already published. That failure would prevent other packages from being published.

After the published command runs through and checks which packages need to be published, the next sequence is running all of the prepublish, publish, and postpublish commands. The commands are run in groups where the prepublish commands will be run for every package. With no failures, the publish command will be run for every package and with no failures then the postpublish command will be run for every package.

### GitHub Release

From this point, the GitHub Action will also create a release and upload any assets if you have opted into this. You can opt into it by passing `createRelease: true` as an input. To upload assets to the release, add an array of `assets` in the config. Each item should be an object with a `path` and `name` property.

### outputs from action

The action will also output some of the information from the commands. This is helpful for chaining further commands together depending on what covector has done. Note that we can _only_ output strings so remember to keep this in mind when accessing or using them in conditionals. One of the outputs is the changes that were applied as a stringified JSON object. This can either be consumed and processed in a later step, or can potentially be directly accessed using something like `jq` (a Linux command that can pull items from json piped to it).

It also outputs if a `successfulPublish` which is a boolean (as a string) if it was successful or not, which can be used to determine if follow on commands and jobs and steps need to run. One example might be to push a documentation update after a publish has been successful. The last output is the command that was run. Well not terribly applicable if you were specifying a command directly, it is useful when using the `version-or-publish` input. When a version command is run, there is no expectation from covector on how to commit or follow up that version command. We recommend using a action that will create a PR for you. This also allows you to do follow-up work that can be included in the commit if you so choose. This output can tell you if the version command was run in which case you would expect to have to create a PR. The PR step can then use a conditional statement to run based on that `commandRan`.

## Applying Changes

As you create PRs and make changes that require a version bump, please add a new markdown file in this folder. You do not note the version _number_, but rather the type of bump that you expect: major, minor, or patch. The filename is not important, as long as it is a `.md`, but we recommend it represents the overall change for our sanity.

When you select the version bump required, you do _not_ need to consider depedencies. Only note the package with the actual change, and any packages that depend on that package will be bumped automatically in the process.

Use the following format:

```md
---
"covector": minor
"@covector/apply": patch
---

Change summary goes here
```

Summaries do not have a specific character limit, but are text only. These summaries are used within the (future implementation of) changelogs. They will give context to the change and also point back to the original PR if more details and context are needed.

Changes will be designated as a `major`, `minor` or `patch` as further described in [semver](https://semver.org/).

Given a version number MAJOR.MINOR.PATCH, increment the:

- MAJOR version when you make incompatible API changes,
- MINOR version when you add functionality in a backwards compatible manner, and
- PATCH version when you make backwards compatible bug fixes.

Additional labels for pre-release and build metadata are available as extensions to the MAJOR.MINOR.PATCH format, but will be discussed prior to usage (as extra steps will be necessary in consideration of merging and publishing).

## Power of Configuration

Covector is driven by your configuration, and creates rather open ended use cases. The two to level properties are `packages` and `pkgManagers`. The `packages` is an object of your packages with the key being name of your package (or even a nickname!), a `path` to it's folder, the package `manager`, and an array of `dependencies` if applicable (which operates across languages too!).

Each package is driven by commands. When using a command such as `covector publish`, we look up the relevant command for each package and run it, `publish` in this instance. Managing your changes are never that easy though. We support an array of commands letting you chain multiple commands together for each package. Even more, we support both `pre` and `post` versions of your commands both which accept arrays of commands. Running a Typescript build, tests, an audit, publishing the packages and applying git tags is no longer too complex of a workflow.

To those of you using a monorepo with multiple packages, the `pkgManagers` will be quite useful. Each package can opt into a package `manager` that matches a key in `pkgManagers`. Specifying a command in one of the `pkgManagers` will apply it to all packages with that `manager` key if the package hasn't specified the command.

Your configuration may look something like this.

```json
{
  "gitSiteUrl": "https://www.github.com/jbolda/covector/",
  "additionalBumpTypes": ["housekeeping"],
  "pkgManagers": {
    "javascript": {
      "version": true,
      "getPublishedVersion": "npm view ${ pkg.pkg } version",
      "publish": "npm publish --access public",
      "postpublish": [
        "git tag ${ pkg.pkg }-v${ pkgFile.version }",
        "git push --tags"
      ]
    }
  },
  "packages": {
    "covector": {
      "path": "./packages/covector",
      "manager": "javascript",
      "dependencies": [
        "@covector/apply",
        "@covector/assemble",
        "@covector/files",
        "@covector/changelog"
      ]
    },
    "@covector/apply": {
      "path": "./packages/apply",
      "manager": "javascript"
    },
    "@covector/assemble": {
      "path": "./packages/assemble",
      "manager": "javascript"
    },
    "@covector/files": {
      "path": "./packages/files",
      "manager": "javascript"
    },
    "@covector/changelog": {
      "path": "./packages/changelog",
      "manager": "javascript",
      "dependencies": ["@covector/files"]
    }
  }
}
```
