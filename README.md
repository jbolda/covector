# covector

Sane package change management for single packages, monorepos, and polyglot.

## Packages

| package | version |
| ------- | ------- |
| [covector](./packages/covector) | [![npm](https://img.shields.io/npm/v/covector?style=for-the-badge)](https://www.npmjs.com/package/covector) |
| [@covector/assemble](./packages/assemble) | [![npm](https://img.shields.io/npm/v/@covector/assemble?style=for-the-badge)](https://www.npmjs.com/package/@covector/assemble) |
| [@covector/apply](./packages/apply) | [![npm](https://img.shields.io/npm/v/@covector/apply?style=for-the-badge)](https://www.npmjs.com/package/@covector/apply) |
| [@covector/changelog](./packages/changelog) | [![npm](https://img.shields.io/npm/v/@covector/changelog?style=for-the-badge)](https://www.npmjs.com/package/@covector/changelog) |
| [@covector/files](./packages/files) | [![npm](https://img.shields.io/npm/v/@covector/files?style=for-the-badge)](https://www.npmjs.com/package/@covector/files) |


## Applying Changes

As you create PRs and make changes that require a version bump, please add a new markdown file in this folder. You do not note the version *number*, but rather the type of bump that you expect: major, minor, or patch. The filename is not important, as long as it is a `.md`, but we recommend it represents the overall change for our sanity.

When you select the version bump required, you do *not* need to consider depedencies. Only note the package with the actual change, and any packages that depend on that package will be bumped automatically in the process.

Use the following format:
```md
---
"tauri.js": patch
"tauri": minor
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

To those of you using a monorepo with multiple packages, the `pkgManagers` will be quite useful. Each package can opt into a package `manager` that matches a key in `pkgManagers`. Specifying a command in a `pkgManager` will apply to all packages with that `manager` key if the package hasn't specified the command.
