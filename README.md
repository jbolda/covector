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

## Projects Using Covector

These projects run covector. Each one lists its config, then the version job, the publish job, and the PR status or meta jobs.

### Publishing to crates.io and npm

**[tauri-apps/tauri](https://github.com/tauri-apps/tauri)**: Desktop and mobile apps with a Rust core and a TS layer. It is the multi-language setup covector was built for.
- [Config](https://github.com/tauri-apps/tauri/blob/dev/.changes/config.json): dual `rust` and `javascript` managers, uses custom change tags that shape the changelog.
- [Version](https://github.com/tauri-apps/tauri/blob/dev/.github/workflows/covector-version-or-publish.yml): on push to `dev`, change files trigger a version bump into an "Apply Version Updates" PR whose body is the assembled change summary.
- [Publish](https://github.com/tauri-apps/tauri/blob/dev/.github/workflows/covector-version-or-publish.yml): once no change files remain, the same workflow publishes to crates.io and npm with provenance, cuts GitHub releases, and kicks off the downstream CLI publishing workflows.
- [Status](https://github.com/tauri-apps/tauri/blob/dev/.github/workflows/covector-status.yml) / [fork](https://github.com/tauri-apps/tauri/blob/dev/.github/workflows/covector-comment-on-fork.yml): comments the pending changes on every PR; the fork job re-posts via `workflow_run` since `GITHUB_TOKEN` can't comment there directly.

**[tauri-apps/plugins-workspace](https://github.com/tauri-apps/plugins-workspace)**: 30+ official plugins, Rust crates and npm packages versioned together.
- [Config](https://github.com/tauri-apps/plugins-workspace/blob/v2/.changes/config.json): each package lists its dependencies so bumps cascade through the graph in order.
- [Version](https://github.com/tauri-apps/plugins-workspace/blob/v2/.github/workflows/covector-version-or-publish.yml): on push to `v1` or `v2`, change files become a version bump PR.
- [Publish](https://github.com/tauri-apps/plugins-workspace/blob/v2/.github/workflows/covector-version-or-publish.yml): when the change files are gone, every crate and npm package with changes is published.
- [Status](https://github.com/tauri-apps/plugins-workspace/blob/v2/.github/workflows/covector-status.yml) / [fork](https://github.com/tauri-apps/plugins-workspace/blob/v2/.github/workflows/covector-comment-on-fork.yml): comments the pending changes on every PR.

**[tauri-apps/wry](https://github.com/tauri-apps/wry)**: the WebView library and **[tauri-apps/tao](https://github.com/tauri-apps/tao)**: the windowing library for Tauri.
- [Configs](https://github.com/tauri-apps/wry/blob/dev/.changes/config.json) ([tao](https://github.com/tauri-apps/tao/blob/dev/.changes/config.json)): crates.io publish checks, cargo audit before every publish, and a custom `housekeeping` bump type.
- [Version and publish](https://github.com/tauri-apps/wry/blob/dev/.github/workflows/covector-version-or-publish.yml) ([tao](https://github.com/tauri-apps/tao/blob/dev/.github/workflows/covector-version-or-publish.yml)): one workflow on push to `dev` handles both legs.
- [Status](https://github.com/tauri-apps/wry/blob/dev/.github/workflows/covector-status.yml) / [fork](https://github.com/tauri-apps/wry/blob/dev/.github/workflows/covector-comment-on-fork.yml), mirrored in [tao](https://github.com/tauri-apps/tao/blob/dev/.github/workflows/covector-status.yml) ([fork](https://github.com/tauri-apps/tao/blob/dev/.github/workflows/covector-comment-on-fork.yml)).

### Publishing to npm

**[thefrontside/simulacrum](https://github.com/thefrontside/simulacrum).** Foundational elements to write simulators to mimic real APIs. Includes Auth0 and the GitHub API simulators.
- [Config](https://github.com/thefrontside/simulacrum/blob/main/.changes/config.json): npm publish with provenance, a postpublish check that each package actually landed on the registry, and a custom `housekeeping` bump type for chores.
- [Version](https://github.com/thefrontside/simulacrum/blob/main/.github/workflows/covector-version-or-publish.yml): on push to `main`, change files direct generation of a draft version PR.
- [Publish](https://github.com/thefrontside/simulacrum/blob/main/.github/workflows/covector-version-or-publish.yml): when the change files are gone, `pnpm publish` goes out with provenance and a `preview` tag where configured.
- [Meta](https://github.com/thefrontside/simulacrum/blob/main/.github/workflows/covector-comment-on-forks.yaml): posts the pending changes on PRs including forks via `workflow_run`.

### Publishing for Deno through git tags

**[thefrontside/interactors](https://github.com/thefrontside/interactors).** Deno packages. Covector never touches a registry here; it pushes tags which trigger a Deno release within JSR.
- [Config](https://github.com/thefrontside/interactors/blob/main/.changes/config.json): swaps the publish step for `git tag` commands and reads published versions back from the tag list.
- [Version](https://github.com/thefrontside/interactors/blob/main/.github/workflows/covector-version-or-release.yml): on push to `main`, change files become a version PR.
- [Publish](https://github.com/thefrontside/interactors/blob/main/.github/workflows/covector-version-or-release.yml): the publish leg cuts and pushes a `pkg-vN.N.N` tag per package, expecting that push to trigger the deno publish.
- [Status](https://github.com/thefrontside/interactors/blob/main/.github/workflows/covector-status.yml) comments the pending changes on PRs, and a [fork job](https://github.com/thefrontside/interactors/blob/main/.github/workflows/covector-comment-on-form.yml) re-posts them via `workflow_run`.

### Deploying a site and desktop binaries

**[jbolda/finatr](https://github.com/jbolda/finatr).** One repo, two targets. The `web` package deploys to Netlify, the `app` package ships Tauri binaries to a GitHub release.
- [Config](https://github.com/jbolda/finatr/blob/next/.changes/config.json): points each package at its target and marks `app` as depending on `web` so it versions second.
- [Version](https://github.com/jbolda/finatr/blob/next/.github/workflows/covector-version-or-publish.yml): the `version-or-release` job bumps into a version PR on push to `next`.
- [Publish](https://github.com/jbolda/finatr/blob/next/.github/workflows/covector-version-or-publish.yml): when it's time to publish, `tauri-action` builds the desktop app across four platforms onto the GitHub release, then `publish` deploys the site with netlify-cli.
- [Status](https://github.com/jbolda/finatr/blob/next/.github/workflows/covector-status.yml): comments the pending changes on PRs.

Using covector in your project? We would love to hear about it!
