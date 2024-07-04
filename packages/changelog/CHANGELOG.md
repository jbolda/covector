# Changelog

## \[0.12.0]

### Enhancements

- [`e2c83dc`](https://www.github.com/jbolda/covector/commit/e2c83dc5e98b9d8ddbf428af2dda32168e4df9ec) ([#318](https://www.github.com/jbolda/covector/pull/318) by [@jbolda](https://www.github.com/jbolda/covector/../../jbolda)) Add `exports` to `package.json` for improved capability and an enhanced experience when developed covector and testing locally.
- [`ce43ad7`](https://www.github.com/jbolda/covector/commit/ce43ad7fd924319b544b30785217070436182d71) ([#319](https://www.github.com/jbolda/covector/pull/319) by [@jbolda](https://www.github.com/jbolda/covector/../../jbolda)) Add logger instance to allow custom loggers based on the usage context. It enables different structured logs for the CLI vs within a GitHub Action, as well as for local development and testing.

### Dependencies

- Upgraded to `@covector/files@0.8.0`

### Changes Supporting Covector Development

- [`ce43ad7`](https://www.github.com/jbolda/covector/commit/ce43ad7fd924319b544b30785217070436182d71) ([#319](https://www.github.com/jbolda/covector/pull/319) by [@jbolda](https://www.github.com/jbolda/covector/../../jbolda)) Switch to Vitest for the test runner. This improves speed and enables improved ability to update to current standards. Additionally, we use `pino-test` with the changes to the logger to more specifically check log output. Along with this, we switch multiple test fixtures to run commands that would return more standard output across OS which reduces test flakiness.

## \[0.11.0]

- [`9202dca`](https://www.github.com/jbolda/covector/commit/9202dca0d8d0fd114ecceb4154c58bc764b85c43) ([#307](https://www.github.com/jbolda/covector/pull/307) by [@jbolda](https://www.github.com/jbolda/covector/../../jbolda)) Pass `createContext` function from action through to changelog to enable passing specific context usable within changelogs.
- [`9202dca`](https://www.github.com/jbolda/covector/commit/9202dca0d8d0fd114ecceb4154c58bc764b85c43) ([#307](https://www.github.com/jbolda/covector/pull/307) by [@jbolda](https://www.github.com/jbolda/covector/../../jbolda)) Query the GitHub API for the PR creator, and highlight their names in the changelogs for recognition of their contribution.

### Dependencies

- Upgraded to `@covector/files@0.7.2`

## \[0.10.1]

### Dependencies

- Upgraded to `@covector/files@0.7.1`

## \[0.10.0]

### Bug Fixes

- [`48d11e3`](https://www.github.com/jbolda/covector/commit/48d11e3ced019971a3252c2c9658d0af6179c980)([#292](https://www.github.com/jbolda/covector/pull/292)) Fix detecting PR number when the merge commit contains another PR or an issue number, for example: `fix: add new api, closes #123 (#225)`.

### Dependencies

- Upgraded to `@covector/files@0.7.0`

## \[0.9.0]

### Enhancements

- [`7156ce0`](https://www.github.com/jbolda/covector/commit/7156ce0f6e45a852461ca24a4bc8b808419777a4)([#277](https://www.github.com/jbolda/covector/pull/277)) Add change for all exact deps rolled up to handle it with the changelog deps section. Add the version number to the changelog deps section.

### Bug Fixes

- [`708adf2`](https://www.github.com/jbolda/covector/commit/708adf2a60e7e4ac428d4c026fc89dc4dfe2e5a2)([#282](https://www.github.com/jbolda/covector/pull/282)) Fix the built-in fallback `deps: Dependecies` tag always appearing first in changelog when it should be the last one.
- [`828818e`](https://www.github.com/jbolda/covector/commit/828818eecf14c638ef9c74e3d243c02b8162d485)([#278](https://www.github.com/jbolda/covector/pull/278)) The changelog function to pull the last version in the changelog did not properly consider headings deeper than level 1 and level 2. When a third level was added, this caused the function to return the full changelog. Search for next heading with a specific depth of 2.

### Dependencies

- Upgraded to `@covector/files@0.6.2`

## \[0.8.0]

### Dependencies

- [`7b6201c`](https://www.github.com/jbolda/covector/commit/7b6201c2e7e0d9120610a2a882c0b4523f4ab6dc)([#264](https://www.github.com/jbolda/covector/pull/264)) Bump Typescript to v4.9, and deeply update types in the lower level functions to start.

### New Features

- [`0b33560`](https://www.github.com/jbolda/covector/commit/0b335606a4998f94ad88006ccc6cf0e7cb2538b1)([#244](https://www.github.com/jbolda/covector/pull/244)) Add changelog tags (section or category) to group different change files.

### Enhancements

- [`2ba699d`](https://www.github.com/jbolda/covector/commit/2ba699d8759d9526563a9665568c2779269ae7a5)([#243](https://www.github.com/jbolda/covector/pull/243)) Update the changelog format to fix multi-line change files and reduce commit noise.

## \[0.7.0]

- The bullet point commit messages were occasionally returning undefined. Remove the ternary and more cleanly checking the logic.
  - [527d7e3](https://www.github.com/jbolda/covector/commit/527d7e39e68bd9bee24b8eb2d7369e326bc58c7b) remove ternary and explicitly consider changelog commit bullet points ([#260](https://www.github.com/jbolda/covector/pull/260)) on 2023-01-13
- Update multiple devDeps, semver, yargs, inquirer, and packages in our action. This is primarily internal upgrades and don't affect external APIs.
  - [18ff898](https://www.github.com/jbolda/covector/commit/18ff898a64a0f3677c55d994d22177189700204a) dep update ([#240](https://www.github.com/jbolda/covector/pull/240)) on 2022-04-16
- Remove the `to-vfile` package as a dependency. This allows us to focus our file reference to our specific needs, and one less dependency to maintain. With this change, we also converted a handful of promises into generators for better compatibility and control with effection.
  - [1b33933](https://www.github.com/jbolda/covector/commit/1b33933be25094900f647527a82ddba0a08778fe) Remove vfile ([#234](https://www.github.com/jbolda/covector/pull/234)) on 2022-04-10
- Upgrade to `effection` v2. This is primarily an internal improvement, but will enable future features such as fetching from an endpoint to check if a version of a package was published. It also brings an updated dependency to gracefully shutdown windows processes.
  - [a0acf81](https://www.github.com/jbolda/covector/commit/a0acf81b2235ac142233d9c0e416d5e07af3cbb3) Effection v2 ([#227](https://www.github.com/jbolda/covector/pull/227)) on 2022-03-19
  - [a346221](https://www.github.com/jbolda/covector/commit/a346221102075e647693851fd1019d66641f8014) bump effection to latest on v2 ([#246](https://www.github.com/jbolda/covector/pull/246)) on 2022-10-26

## \[0.6.1]

- Include a copy of the license in each package.
  - Bumped due to a bump in all.
  - [fa5c061](https://www.github.com/jbolda/covector/commit/fa5c061830d181ae9a52b183441890a25e07946a) chore: add license files to packages ([#225](https://www.github.com/jbolda/covector/pull/225)) on 2021-09-24

## \[0.6.0]

- Extract out types into separate package to remove issues with circular dependencies.
  - [519da36](https://www.github.com/jbolda/covector/commit/519da362eff5628901a1f640120d39dd8234fdda) chore: set paths / references for TS and add types package ([#213](https://www.github.com/jbolda/covector/pull/213)) on 2021-06-26

## \[0.5.0]

- This switches to using Typescript project references to build (previously rollup). It should affect the underlying packages or use.
  - [a9aedb1](https://www.github.com/jbolda/covector/commit/a9aedb1d5de01972b0576cc339788397e6ad829f) chore: build workflow updates ([#175](https://www.github.com/jbolda/covector/pull/175)) on 2021-04-07
  - [5506b19](https://www.github.com/jbolda/covector/commit/5506b195e176ecec1c49af83cac0f8c490ba845e) feat: add preview command to covector ([#187](https://www.github.com/jbolda/covector/pull/187)) on 2021-05-05
  - [e388cc7](https://www.github.com/jbolda/covector/commit/e388cc7ee98080e33744898737635711f3f30987) feat: prerelease mode and publishing ([#180](https://www.github.com/jbolda/covector/pull/180)) on 2021-05-13
- Add support for yaml based package files. Add support for generic file whose only content is a version number.
  - [e8c98f5](https://www.github.com/jbolda/covector/commit/e8c98f5c627e172f56c11d17022f198ca3cb9883) feat: yaml and generic file support ([#196](https://www.github.com/jbolda/covector/pull/196)) on 2021-05-07

## \[0.4.0]

- Pull the most recent changelog into the chain of output. This opens up piping it into the Github Release.
  - [66539a8](https://www.github.com/jbolda/covector/commit/66539a800365ccfb28f95291b066e77114863382) fix: GitHub release pipe ([#164](https://www.github.com/jbolda/covector/pull/164)) on 2021-03-24

## \[0.3.0]

- Convert covector to typescript.
  - [cf9a893](https://www.github.com/jbolda/covector/commit/cf9a8935f244bd47b5614368865cc724f65e8980) feat: typescript covector main with rollup ([#63](https://www.github.com/jbolda/covector/pull/63)) on 2020-07-02
  - [39acdc9](https://www.github.com/jbolda/covector/commit/39acdc9edc1e2fa7e0dcffa38e658810a9b8756e) feat: convert over @covector/files to typescript with rollup \[partial] ([#65](https://www.github.com/jbolda/covector/pull/65)) on 2020-07-06
  - [1090afd](https://www.github.com/jbolda/covector/commit/1090afd46e8a7a2c2cfe9d571be744b79ded86a1) feat: typescript going green ([#153](https://www.github.com/jbolda/covector/pull/153)) on 2021-03-17

## \[0.2.2]

- Add a validation guardrail within the `status` command. This will run a nearly identical version application function. It can catch an error during the PR process rather than during the versioning process.
  - Bumped due to a bump in @covector/files.
  - [4437766](https://www.github.com/jbolda/covector/commit/44377667fe7c64207bc84140fb4954b23dc4424f) feat: version bump guardrail ([#137](https://www.github.com/jbolda/covector/pull/137)) on 2021-02-10

## \[0.2.1]

- Find all numbers in a PR no matter the quantity.
  - [4a39f15](https://www.github.com/jbolda/covector/commit/4a39f15b3b774ce171b3fa917db8f47d19823874) fix: find changelog PR numbers of any size ([#89](https://www.github.com/jbolda/covector/pull/89)) on 2020-07-10

## \[0.2.0]

- Pipe git info into changelog using sub-bullet points for each commit it was involved in.
  - [cc19486](https://www.github.com/jbolda/covector/commit/cc19486f86b78aec2c719e5dd17a2d72cbc8d450) feat: new command package and piped git info ([#78](https://www.github.com/jbolda/covector/pull/78)) on 2020-07-09
  - [de3248d](https://www.github.com/jbolda/covector/commit/de3248dfd70146392ff65e7065c2125daf527728) feat: dep bump note in changelog ([#87](https://www.github.com/jbolda/covector/pull/87)) on 2020-07-10
- Note in sub-bullets when a bump was due to a dependency (and that helps note where there summary text is from as well.)
  - [de3248d](https://www.github.com/jbolda/covector/commit/de3248dfd70146392ff65e7065c2125daf527728) feat: dep bump note in changelog ([#87](https://www.github.com/jbolda/covector/pull/87)) on 2020-07-10
- Allow complex commands specified as an object. This let's one specify a dryRunCommand that is executed in --dry-run mode instead (so no accidental publishes!) or to set pipe to true that the output is returned from the main covector function. The pipe likely won't be used directly, but can be consumed within the action to create a Github Release, etc.
  - Bumped due to a bump in covector.
  - [3ca050c](https://www.github.com/jbolda/covector/commit/3ca050c2c51821d229209e18391535c266b6b200) feat: advanced commands ([#71](https://www.github.com/jbolda/covector/pull/71)) on 2020-07-06

## \[0.1.0]

- Add option to execute commands in "--dry-run" mode which will output the anticipated commands without running them and additional relevant information (such as the command pipe).
- Skip over packages without a path. This let's us create "virtual packages" and configure a package such as "all" that let's us easily bump everything.

## \[0.0.3]

Bumped due to dependency.

## \[0.0.2]

- We missed files in the changelog deps array so they diverged when bumped.
