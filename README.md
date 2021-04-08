# covector

Transparent and flexible change management for publishing packages and assets. Publish and deploy from a single asset repository, monorepos, and even multi-language repositories.

## Docs

The documentation can be found in the main [covector](./packages/covector) folder. It is placed there that it will be packaged when publishing to npm.

## Packages

Below is a list of all of the packages within this repository. The usage and docs are in the main [covector](./packages/covector) folder.

| package                                     | version                                                                                                                           | changelog                                                                                                         |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| [covector](./packages/covector)             | [![npm](https://img.shields.io/npm/v/covector?style=for-the-badge)](https://www.npmjs.com/package/covector)                       | [./packages/covector/CHANGELOG.md](https://github.com/jbolda/covector/blob/main/packages/covector/CHANGELOG.md)   |
| [action](./packages/action)                 | git tag, e.g. `v0`                                                                                                                | [./packages/action/CHANGELOG.md](https://github.com/jbolda/covector/blob/main/packages/action/CHANGELOG.md)       |
| [@covector/apply](./packages/apply)         | [![npm](https://img.shields.io/npm/v/@covector/apply?style=for-the-badge)](https://www.npmjs.com/package/@covector/apply)         | [./packages/apply/CHANGELOG.md](https://github.com/jbolda/covector/blob/main/packages/apply/CHANGELOG.md)         |
| [@covector/assemble](./packages/assemble)   | [![npm](https://img.shields.io/npm/v/@covector/assemble?style=for-the-badge)](https://www.npmjs.com/package/@covector/assemble)   | [./packages/assemble/CHANGELOG.md](https://github.com/jbolda/covector/blob/main/packages/assemble/CHANGELOG.md)   |
| [@covector/changelog](./packages/changelog) | [![npm](https://img.shields.io/npm/v/@covector/changelog?style=for-the-badge)](https://www.npmjs.com/package/@covector/changelog) | [./packages/changelog/CHANGELOG.md](https://github.com/jbolda/covector/blob/main/packages/changelog/CHANGELOG.md) |
| [@covector/command](./packages/command)     | [![npm](https://img.shields.io/npm/v/@covector/command?style=for-the-badge)](https://www.npmjs.com/package/@covector/command)     | [./packages/command/CHANGELOG.md](https://github.com/jbolda/covector/blob/main/packages/command/CHANGELOG.md)     |
| [@covector/files](./packages/files)         | [![npm](https://img.shields.io/npm/v/@covector/files?style=for-the-badge)](https://www.npmjs.com/package/@covector/files)         | [./packages/files/CHANGELOG.md](https://github.com/jbolda/covector/blob/main/packages/files/CHANGELOG.md)         |


## Prior Art

We drew on inspiration from [changesets](https://github.com/atlassian/changesets) which specifically focuses on the npm ecosystem with the expectation to publish to [npmjs.com](https://www.npmjs.com/). We had a need for much greater flexibility, primarily around additional languages, which changesets wasn't looking to handle. You may notice some similarities around the markdown based change files, and it begins to diverge from there. Since we started the codebase from scratch, it also opened the door for incredibly flexible and unique publishing schemes, deep changelogs, and the ability to publish to any "target" with any "asset" (such as publishing a website, a github action or a vscode extension even!).

Below we other alternatives that we know about or had considered. Some of these have been released after since covector was created. There are also a fair number in the [conventional commit](https://www.conventionalcommits.org/en/v1.0.0/#tooling-for-conventional-commits) ecosystem. If you feel that covector is not the library for your use case, one of these might be.

- [semver-tool](https://github.com/fsaintjacques/semver-tool)
- [semantic-release](https://github.com/semantic-release/semantic-release)
- [changesets](https://github.com/atlassian/changesets)
- [rush](https://github.com/microsoft/rushstack)
- [yarn2](https://yarnpkg.com/features/release-workflow)
- [np](https://github.com/sindresorhus/np)
- [generate-changelog](https://github.com/lob/generate-changelog)
- [semversioner](https://github.com/raulgomis/semversioner)
- [goreleaser](https://github.com/goreleaser/goreleaser)
- [chglog](https://github.com/goreleaser/chglog)
- [bumped](https://github.com/bumped/bumped)
- [bumped-changelog](https://github.com/bumped/bumped-changelog)
- [standard-version](https://github.com/conventional-changelog/standard-version)
- [change](https://github.com/adamtabrams/change)
