# covector

Transparent and flexible change management for publishing packages and assets. Publish and deploy from a single asset repository, monorepos, and even multi-language repositories.

## Docs

The documentation can be found in the main [covector](./packages/covector) folder. It is placed there that it will be packaged when publishing to npm.

## Packages

Below is a list of all of the packages within this repository. The usage and docs are in the main [covector](./packages/covector) folder.

| package                                     | version                                                                                                                           |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| [covector](./packages/covector)             | [![npm](https://img.shields.io/npm/v/covector?style=for-the-badge)](https://www.npmjs.com/package/covector)                       |
| [action](./packages/action)                 | git tag, e.g. `v0`                                                                                                                |
| [@covector/apply](./packages/apply)         | [![npm](https://img.shields.io/npm/v/@covector/apply?style=for-the-badge)](https://www.npmjs.com/package/@covector/apply)         |
| [@covector/assemble](./packages/assemble)   | [![npm](https://img.shields.io/npm/v/@covector/assemble?style=for-the-badge)](https://www.npmjs.com/package/@covector/assemble)   |
| [@covector/changelog](./packages/changelog) | [![npm](https://img.shields.io/npm/v/@covector/changelog?style=for-the-badge)](https://www.npmjs.com/package/@covector/changelog) |
| [@covector/command](./packages/command)     | [![npm](https://img.shields.io/npm/v/@covector/command?style=for-the-badge)](https://www.npmjs.com/package/@covector/command)     |
| [@covector/files](./packages/files)         | [![npm](https://img.shields.io/npm/v/@covector/files?style=for-the-badge)](https://www.npmjs.com/package/@covector/files)         |

## Prior Art

We drew on inspiration from [changesets](https://github.com/atlassian/changesets) which specifically focuses on the npm ecosystem with the expectation to publish to [npmjs.com](https://www.npmjs.com/). We had a need for much greater flexibility, primarily around additional languages, which changesets wasn't looking to handle. You may notice some similarities around the markdown based change files, and begins to diverge from there. Since we started the codebase from scratch, it also opened the door for incredibly flexible and unique publishing schemes, deep changelogs, and the ability to publish to any "target" with any "asset" (such as publishing a website, a github action or a vscode extension even!).

Below we other alternatives that we had investigated. There are also a fair number in the [conventional commit](https://www.conventionalcommits.org/en/v1.0.0/#tooling-for-conventional-commits) ecosystem.

- [covector](https://github.com/jbolda/covector)
- [semver-tool](https://github.com/fsaintjacques/semver-tool)
- [semantic-release](https://github.com/semantic-release/semantic-release)
- [changesets](https://github.com/atlassian/changesets)
- [rush](https://github.com/microsoft/rushstack)
- [yarn2](https://yarnpkg.com/features/release-workflow)
- [np](https://github.com/sindresorhus/np)
- [generate-changelog](https://github.com/lob/generate-changelog)
- [semversioner](https://github.com/raulgomis/semversioner)
- [chglog](https://github.com/goreleaser/chglog)
- [goreleaser](https://github.com/goreleaser/goreleaser)
- [bumped](https://github.com/bumped/bumped)
- [-changelog](https://github.com/bumped/bumped-changelog)
- [bumped-changelog](https://github.com/bumped/bumped-changelog)
- [standard-version](https://github.com/conventional-changelog/standard-version)
- [change](https://github.com/adamtabrams/change)
