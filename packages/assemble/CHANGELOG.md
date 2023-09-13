# Changelog

## \[0.10.2]

### Enhancements

- [`7498ecc`](https://www.github.com/jbolda/covector/commit/7498ecc332efd10a1d6d4b6cd487d2817c9a853d)([#289](https://www.github.com/jbolda/covector/pull/289)) Implement zod for config file schema parsing and checking. It will throw an error if the `config.json` has entries that do not match the schema.

### Dependencies

- Upgraded to `@covector/files@0.7.0`

## \[0.10.1]

### Enhancements

- [`de4f709`](https://www.github.com/jbolda/covector/commit/de4f709f251d7daa7b8cc56e3f7e12aede8b3e47)([#285](https://www.github.com/jbolda/covector/pull/285)) Consider getPublishedVersion can be either a string or an object.

### Dependencies

- Upgraded to `@covector/files@0.6.2`
- Upgraded to `@covector/command@0.7.0`

## \[0.10.0]

### Dependencies

- [`7b6201c`](https://www.github.com/jbolda/covector/commit/7b6201c2e7e0d9120610a2a882c0b4523f4ab6dc)([#264](https://www.github.com/jbolda/covector/pull/264)) Bump Typescript to v4.9, and deeply update types in the lower level functions to start.

### New Features

- [`0b33560`](https://www.github.com/jbolda/covector/commit/0b335606a4998f94ad88006ccc6cf0e7cb2538b1)([#244](https://www.github.com/jbolda/covector/pull/244)) Add changelog tags (section or category) to group different change files.

## \[0.9.0]

- Package file objects now include the dependencies keyed by the name with an array including the dependency type. This information is now passed to the commands pipeline.
  - [ba6e7f1](https://www.github.com/jbolda/covector/commit/ba6e7f1c9ead622844ff1c040fffb67b925f0bcf) skip bump for range ([#257](https://www.github.com/jbolda/covector/pull/257)) on 2023-01-12
- Update multiple devDeps, semver, yargs, inquirer, and packages in our action. This is primarily internal upgrades and don't affect external APIs.
  - [18ff898](https://www.github.com/jbolda/covector/commit/18ff898a64a0f3677c55d994d22177189700204a) dep update ([#240](https://www.github.com/jbolda/covector/pull/240)) on 2022-04-16
- When collecting `git log` metadata for change files, running it in parallel caused occasional no-op which increasingly became more flaky with more files. Adjust this to run it serially which should be a neglible difference.
  - [bf94c90](https://www.github.com/jbolda/covector/commit/bf94c905e05ea8402c596564eea1fa8bcb8d975b) undefined commits in changelog, `git log` needs to be run serially ([#261](https://www.github.com/jbolda/covector/pull/261)) on 2023-01-16
- Remove the `to-vfile` package as a dependency. This allows us to focus our file reference to our specific needs, and one less dependency to maintain. With this change, we also converted a handful of promises into generators for better compatibility and control with effection.
  - [1b33933](https://www.github.com/jbolda/covector/commit/1b33933be25094900f647527a82ddba0a08778fe) Remove vfile ([#234](https://www.github.com/jbolda/covector/pull/234)) on 2022-04-10
- Upgrade to `effection` v2. This is primarily an internal improvement, but will enable future features such as fetching from an endpoint to check if a version of a package was published. It also brings an updated dependency to gracefully shutdown windows processes.
  - [a0acf81](https://www.github.com/jbolda/covector/commit/a0acf81b2235ac142233d9c0e416d5e07af3cbb3) Effection v2 ([#227](https://www.github.com/jbolda/covector/pull/227)) on 2022-03-19
  - [a346221](https://www.github.com/jbolda/covector/commit/a346221102075e647693851fd1019d66641f8014) bump effection to latest on v2 ([#246](https://www.github.com/jbolda/covector/pull/246)) on 2022-10-26

## \[0.8.2]

- Include a copy of the license in each package.
  - Bumped due to a bump in all.
  - [fa5c061](https://www.github.com/jbolda/covector/commit/fa5c061830d181ae9a52b183441890a25e07946a) chore: add license files to packages ([#225](https://www.github.com/jbolda/covector/pull/225)) on 2021-09-24

## \[0.8.1]

- The ability to adjust the Github Release git tag was previously added, and the fallback used only worked for JavaScript packages. This fix uses the package nickname instead which will work for any package manager.
  - [e4eb944](https://www.github.com/jbolda/covector/commit/e4eb944ae48fa8e3ba419f92eaf0254065887fbf) fix: github release tag using package nickname ([#218](https://www.github.com/jbolda/covector/pull/218)) on 2021-07-02

## \[0.8.0]

- Allow one to specify the `releaseTag` that determines the Github Release tag used. This also let's you specify `false` to explicitly skip creating a Github Release for the package. resolves #203, resolves #204.
  - [6742580](https://www.github.com/jbolda/covector/commit/674258044048a259b5dce1bc02b241dd0f17e978) feat: publish existing draft GitHub Release ([#211](https://www.github.com/jbolda/covector/pull/211)) on 2021-06-18
- Extract out types into separate package to remove issues with circular dependencies.
  - [519da36](https://www.github.com/jbolda/covector/commit/519da362eff5628901a1f640120d39dd8234fdda) chore: set paths / references for TS and add types package ([#213](https://www.github.com/jbolda/covector/pull/213)) on 2021-06-26

## \[0.7.0]

- Adjust output from assemble and covector to expose the template that is piped into each command. This allows us to set it as an output in the github action.
  - [5797e79](https://www.github.com/jbolda/covector/commit/5797e792f532ad9bcb40c19cda080ca7713c0d91) feat: github action output template pipe ([#208](https://www.github.com/jbolda/covector/pull/208)) on 2021-05-18
- Assemble considers preMode and will return `pre*` bumps to be used in apply.
  - [e388cc7](https://www.github.com/jbolda/covector/commit/e388cc7ee98080e33744898737635711f3f30987) feat: prerelease mode and publishing ([#180](https://www.github.com/jbolda/covector/pull/180)) on 2021-05-13
- Implement `errorOnVersionRange` which allows one to set a range which, when satisfied, will fail a `covector status` or `covector version`. This guardrail can help prevent a package from accidentally being bumped to the next major version.
  - [e388cc7](https://www.github.com/jbolda/covector/commit/e388cc7ee98080e33744898737635711f3f30987) feat: prerelease mode and publishing ([#180](https://www.github.com/jbolda/covector/pull/180)) on 2021-05-13
- Improve types on generator based shell commands. This won't affect the published assets, but improve use to downstream TS users (and covector).
  - [e388cc7](https://www.github.com/jbolda/covector/commit/e388cc7ee98080e33744898737635711f3f30987) feat: prerelease mode and publishing ([#180](https://www.github.com/jbolda/covector/pull/180)) on 2021-05-13
- This switches to using Typescript project references to build (previously rollup). It should affect the underlying packages or use.
  - [a9aedb1](https://www.github.com/jbolda/covector/commit/a9aedb1d5de01972b0576cc339788397e6ad829f) chore: build workflow updates ([#175](https://www.github.com/jbolda/covector/pull/175)) on 2021-04-07
  - [5506b19](https://www.github.com/jbolda/covector/commit/5506b195e176ecec1c49af83cac0f8c490ba845e) feat: add preview command to covector ([#187](https://www.github.com/jbolda/covector/pull/187)) on 2021-05-05
  - [e388cc7](https://www.github.com/jbolda/covector/commit/e388cc7ee98080e33744898737635711f3f30987) feat: prerelease mode and publishing ([#180](https://www.github.com/jbolda/covector/pull/180)) on 2021-05-13
- Pass head branch name into covector for running preview in action
  Tag gets piped into template in assemble
  Fix published boolean bug in command
  - [2bdc840](https://www.github.com/jbolda/covector/commit/2bdc84046523f3dca61f3623f1ea893445c9fffb) feat: Add dist-tag for preview publishing... and fix the published boolean bug ([#200](https://www.github.com/jbolda/covector/pull/200)) on 2021-05-13
- Add support for yaml based package files. Add support for generic file whose only content is a version number.
  - [e8c98f5](https://www.github.com/jbolda/covector/commit/e8c98f5c627e172f56c11d17022f198ca3cb9883) feat: yaml and generic file support ([#196](https://www.github.com/jbolda/covector/pull/196)) on 2021-05-07
- Throw an error if we receive a malformed change file or one that is otherwise missing any changes. Closes #201.
  - [073202b](https://www.github.com/jbolda/covector/commit/073202b3517ebda6f2edb9ce743ccf69a01d3e48) fix: throw error on empty change file ([#205](https://www.github.com/jbolda/covector/pull/205)) on 2021-05-12

## \[0.6.1]

- Mock out full Github Release flow to help in testing the Github Action. Adjust command pipe to function to fix `undefined` being piped to Github Release body.
  - Bumped due to a bump in @covector/command.
  - [a7e1b20](https://www.github.com/jbolda/covector/commit/a7e1b209c704829bc8cb54bd220862e627bbee01) fix: mock out full GitHub release flow ([#172](https://www.github.com/jbolda/covector/pull/172)) on 2021-03-27

## \[0.6.0]

- Roll up bumps from children recursively to bump parents unlimited levels deep. These bumps are done as a `patch` bump as they are automatic. Any parent bumps that would result in a `minor` or `major` change will likely include breaking changes in the package itself. This would imply that a specific change file would be included for it as well, as opposed to relying on a bump from a child.
  - [1ff1290](https://www.github.com/jbolda/covector/commit/1ff12906d125aeff3d5574092efe1fa469e06198) feat: roll up all bumps as a patch ([#170](https://www.github.com/jbolda/covector/pull/170)) on 2021-03-25
- Split up config merge function into two functions, one for version and one for publish, et al. This makes the types easier to reason about.
  - [66539a8](https://www.github.com/jbolda/covector/commit/66539a800365ccfb28f95291b066e77114863382) fix: GitHub release pipe ([#164](https://www.github.com/jbolda/covector/pull/164)) on 2021-03-24

## \[0.5.0]

- Convert covector to typescript.
  - [cf9a893](https://www.github.com/jbolda/covector/commit/cf9a8935f244bd47b5614368865cc724f65e8980) feat: typescript covector main with rollup ([#63](https://www.github.com/jbolda/covector/pull/63)) on 2020-07-02
  - [39acdc9](https://www.github.com/jbolda/covector/commit/39acdc9edc1e2fa7e0dcffa38e658810a9b8756e) feat: convert over @covector/files to typescript with rollup \[partial] ([#65](https://www.github.com/jbolda/covector/pull/65)) on 2020-07-06
  - [1090afd](https://www.github.com/jbolda/covector/commit/1090afd46e8a7a2c2cfe9d571be744b79ded86a1) feat: typescript going green ([#153](https://www.github.com/jbolda/covector/pull/153)) on 2021-03-17

## \[0.4.1]

- Fix additional bump types to be a no-op bump.
  - [15431f0](https://www.github.com/jbolda/covector/commit/15431f0661a30c8cb336194e39709147bfbd1aea) fix: additional bump type is no-op ([#149](https://www.github.com/jbolda/covector/pull/149)) on 2021-02-22

## \[0.4.0]

- Allow running functions as a command instead of assuming everything runs in a shell. This is mostly for internal use to be used within the Github Action.
  - [6dc90bf](https://www.github.com/jbolda/covector/commit/6dc90bfe849c4c9441afce7a26a01aabf4a2196c) feat: reorder GitHub release step ([#136](https://www.github.com/jbolda/covector/pull/136)) on 2021-02-09
- Throw a hard error on an invalid bump types. If you specify something other than `major`, `minor`, or `patch`. You will receive an error in the `status` and `version` commands. Also adds a new config option, `additionalBumpTypes`, which allows specifying other bump types (that are ignored in versioning) but do not throw an error. This allows one to always require a change file even if the code does not require a version bump. This is generally easier to enforce then conditionally requiring a change file.
  - [a446b43](https://www.github.com/jbolda/covector/commit/a446b43443603ae86b9667b4d04e0f69b068293d) feat: extra bump types ([#138](https://www.github.com/jbolda/covector/pull/138)) on 2021-02-10
- Some workflows require different actions for different packages. Most of this can be codified into config. However there are cases where you may need to run a command for a dynamic set of packages.
  - [2748d90](https://www.github.com/jbolda/covector/commit/2748d90cfe2dbe94050ccc85e932aff4260627d4) feat: filter pkgs ([#128](https://www.github.com/jbolda/covector/pull/128)) on 2020-11-26
- Add missing workspace dependencies. These were likely only functioning due to hoisting.
  - [948ca7c](https://www.github.com/jbolda/covector/commit/948ca7ca7f6332abb6ffd13ff68d21560f275b57) feat: init command ([#139](https://www.github.com/jbolda/covector/pull/139)) on 2021-02-12

## \[0.3.0]

- Allow multiple publish sequences. Any command beginning with `publish` will invoke the related `getPublishedVersion`, e.g. `publishNPM` would look for and check `getPublishedVersionNPM`. This allows separation of concerns and re-run-ability for multiple deploy targets.
  - [ed3698d](https://www.github.com/jbolda/covector/commit/ed3698df85140dd13e98569c4266df03f8bbfc16) feat: allow multiple publishes ([#113](https://www.github.com/jbolda/covector/pull/113)) on 2020-07-19

## \[0.2.5]

- Deep clone changes that are getting passed into the changelog. We were editing references and those edits were showing up in erroneous places.
  - [38fba3c](https://www.github.com/jbolda/covector/commit/38fba3c6791154f335dde10740cde6ad556b6ef3) fix: deepclone change entries to prevent referencial edits ([#109](https://www.github.com/jbolda/covector/pull/109)) on 2020-07-17
- Allow running commands from the cwd within the config.
  - [b95249e](https://www.github.com/jbolda/covector/commit/b95249e88fb9fba1b1cc85c4a8fefa633ca9fd1c) feat: allow command to run from cwd ([#108](https://www.github.com/jbolda/covector/pull/108)) on 2020-07-17

## \[0.2.4]

- Stringify remaining portion of change file. Previously we were just looping on `paragraph` which would miss links.
  - Bumped due to a bump in @covector/assemble.
  - [afc5ceb](https://www.github.com/jbolda/covector/commit/afc5ceb747609979d82e380d7be086a40cdc48ef) fix: stringify remaining change file ([#103](https://www.github.com/jbolda/covector/pull/103)) on 2020-07-15

## \[0.2.3]

- Throw an error if a change file is added that targets a package that does not exist in the config.
  - [48c1c99](https://www.github.com/jbolda/covector/commit/48c1c995fd69b028ec975fc577986b23adfb55b9) feat: throw error on non-existant package, closes [#57](https://www.github.com/jbolda/covector/pull/57) ([#102](https://www.github.com/jbolda/covector/pull/102)) on 2020-07-14

## \[0.2.2]

- Pass split versions through to pipe.
  - Bumped due to a bump in @covector/assemble.
  - [6370826](https://www.github.com/jbolda/covector/commit/63708261d633d22ada1c7e14667b4107ea7e68c3) fix: pass split versions through to pipe ([#96](https://www.github.com/jbolda/covector/pull/96)) on 2020-07-11

## \[0.2.1]

- Assemble process was async and the pkgFile needed a proper await. Switch to a generator to yield in the loop.
  - [1bb67ea](https://www.github.com/jbolda/covector/commit/1bb67ea671b6fbe9b21af9feb72612d166fd7662) fix: missing publish pipe ([#94](https://www.github.com/jbolda/covector/pull/94)) on 2020-07-10

## \[0.2.0]

- Note in sub-bullets when a bump was due to a dependency (and that helps note where there summary text is from as well.)
  - [de3248d](https://www.github.com/jbolda/covector/commit/de3248dfd70146392ff65e7065c2125daf527728) feat: dep bump note in changelog ([#87](https://www.github.com/jbolda/covector/pull/87)) on 2020-07-10
- Pull and set git meta information on change files as an array of commits. This can then be piped into changelogs.
  - Bumped due to a bump in covector.
  - [cc19486](https://www.github.com/jbolda/covector/commit/cc19486f86b78aec2c719e5dd17a2d72cbc8d450) feat: new command package and piped git info ([#78](https://www.github.com/jbolda/covector/pull/78)) on 2020-07-09
  - [de3248d](https://www.github.com/jbolda/covector/commit/de3248dfd70146392ff65e7065c2125daf527728) feat: dep bump note in changelog ([#87](https://www.github.com/jbolda/covector/pull/87)) on 2020-07-10
- Allow complex commands specified as an object. This let's one specify a dryRunCommand that is executed in --dry-run mode instead (so no accidental publishes!) or to set pipe to true that the output is returned from the main covector function. The pipe likely won't be used directly, but can be consumed within the action to create a Github Release, etc.
  - Bumped due to a bump in covector.
  - [3ca050c](https://www.github.com/jbolda/covector/commit/3ca050c2c51821d229209e18391535c266b6b200) feat: advanced commands ([#71](https://www.github.com/jbolda/covector/pull/71)) on 2020-07-06
- Version commands used to only run on changes, but ignore parents. Reconfigure that we resolve the parents and run commands on both direct changes and changes through a dependency.
  - Bumped due to a bump in covector.
  - [3ca050c](https://www.github.com/jbolda/covector/commit/3ca050c2c51821d229209e18391535c266b6b200) feat: advanced commands ([#71](https://www.github.com/jbolda/covector/pull/71)) on 2020-07-06
- Add config option to specify an asset that is uploaded on publish to the Github Release.
  - [3f6e0b3](https://www.github.com/jbolda/covector/commit/3f6e0b335e88ebd07186ebeec57d4f438a274e1f) feat: add config option to specify assets to upload at publish ([#86](https://www.github.com/jbolda/covector/pull/86)) on 2020-07-10

## \[0.1.0]

- Add option to execute commands in "--dry-run" mode which will output the anticipated commands without running them and additional relevant information (such as the command pipe).
- Allow use of any arbitrary command as defined in the configuration.
- Allow arrays for commands and run pre/post versions of each command.
- Pipe pkgFile to the publish commands. This let's one pull the version command (which is useful for git tags).

## \[0.0.4]

- Pass cwd down to assemble config merging. It reads package files and needs the dir.
- Package files should be referenced based on the "nickname" as noted in the config. The name in the package file is not a unique value.
