# Changelog

## \[0.9.1]

### Dependencies

- Upgraded to `@covector/files@0.7.0`
- [`cb35f38`](https://www.github.com/jbolda/covector/commit/cb35f38287580597539f3c69d748ee330939cf84)([#291](https://www.github.com/jbolda/covector/pull/291)) Bumps `semver` minor to latest.

## \[0.9.0]

### Enhancements

- [`5b7ab24`](https://www.github.com/jbolda/covector/commit/5b7ab24f3e6b51743bf62711ff761f919467a207)([#274](https://www.github.com/jbolda/covector/pull/274)) Add support to Cargo's `build-dependencies` and target-specific dependencies.
- [`7156ce0`](https://www.github.com/jbolda/covector/commit/7156ce0f6e45a852461ca24a4bc8b808419777a4)([#277](https://www.github.com/jbolda/covector/pull/277)) Add change for all exact deps rolled up to handle it with the changelog deps section. Add the version number to the changelog deps section.

### Bug Fixes

- [`7156ce0`](https://www.github.com/jbolda/covector/commit/7156ce0f6e45a852461ca24a4bc8b808419777a4)([#277](https://www.github.com/jbolda/covector/pull/277)) Fix `undefined` error when dep with range was bumped.
- [`db3b43d`](https://www.github.com/jbolda/covector/commit/db3b43d4f98d8760d307303a66570fd5a165b4ec)([#273](https://www.github.com/jbolda/covector/pull/273)) Try to determine actual package name when bumping dependencies to support nicknames in the packages configuration.

### Dependencies

- Upgraded to `@covector/files@0.6.2`

## \[0.8.0]

### Dependencies

- [`7b6201c`](https://www.github.com/jbolda/covector/commit/7b6201c2e7e0d9120610a2a882c0b4523f4ab6dc)([#264](https://www.github.com/jbolda/covector/pull/264)) Bump Typescript to v4.9, and deeply update types in the lower level functions to start.

### Enhancements

- [`2ba699d`](https://www.github.com/jbolda/covector/commit/2ba699d8759d9526563a9665568c2779269ae7a5)([#243](https://www.github.com/jbolda/covector/pull/243)) Update the changelog format to fix multi-line change files and reduce commit noise.

## \[0.7.0]

- The dependency bumps will now use the next version of the package as derived from the existing change files. Previously, it presumed that a applying a dependency bump was sufficient which worked most of the time, but ignored some edge cases.
  - [aa7ea83](https://www.github.com/jbolda/covector/commit/aa7ea83b1463219643cb3098cc6bb7f5c6458374) dep bumps use main version directly vs presuming increment is correct ([#256](https://www.github.com/jbolda/covector/pull/256)) on 2022-12-27
- Update multiple devDeps, semver, yargs, inquirer, and packages in our action. This is primarily internal upgrades and don't affect external APIs.
  - [18ff898](https://www.github.com/jbolda/covector/commit/18ff898a64a0f3677c55d994d22177189700204a) dep update ([#240](https://www.github.com/jbolda/covector/pull/240)) on 2022-04-16
- Apply parent bumps dependent on the how the dependency is specified. For a range bump, we don't assume that that requires a bump from a child. If a bump is expected, then a change file specific to the change is more explicit.
  - [ba6e7f1](https://www.github.com/jbolda/covector/commit/ba6e7f1c9ead622844ff1c040fffb67b925f0bcf) skip bump for range ([#257](https://www.github.com/jbolda/covector/pull/257)) on 2023-01-12
- This fixes the bug where we would look the range requirement on dependencies.
  - [763ee33](https://www.github.com/jbolda/covector/commit/763ee33420f88a58161013b3cb7d3eea5ababea8) feat: keep dependency version requirement ([#252](https://www.github.com/jbolda/covector/pull/252)) on 2022-12-21
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

- Preview version template overwrites the prerelease identifier
  - [b6e21bc](https://www.github.com/jbolda/covector/commit/b6e21bc1267fa7a09fb5311f2944e32385f2fbb4) Preveiw versioning for packages in prerelease mode ([#217](https://www.github.com/jbolda/covector/pull/217)) on 2021-07-08

## \[0.5.0]

- Extract out types into separate package to remove issues with circular dependencies.
  - [519da36](https://www.github.com/jbolda/covector/commit/519da362eff5628901a1f640120d39dd8234fdda) chore: set paths / references for TS and add types package ([#213](https://www.github.com/jbolda/covector/pull/213)) on 2021-06-26

## \[0.4.0]

- Abstract out the file switches so `@covector/files` is the only package that considers file extensions.
  - [136d534](https://www.github.com/jbolda/covector/commit/136d5347b09361e70c3bbd9773973938295fa9ac) feat: normalize version number pulling and setting ([#206](https://www.github.com/jbolda/covector/pull/206)) on 2021-05-17
- Apply accepts a `prereleaseIdentifier` used to increment a prerelease version number.
  - [e388cc7](https://www.github.com/jbolda/covector/commit/e388cc7ee98080e33744898737635711f3f30987) feat: prerelease mode and publishing ([#180](https://www.github.com/jbolda/covector/pull/180)) on 2021-05-13
- Implement `errorOnVersionRange` which allows one to set a range which, when satisfied, will fail a `covector status` or `covector version`. This guardrail can help prevent a package from accidentally being bumped to the next major version.
  - [e388cc7](https://www.github.com/jbolda/covector/commit/e388cc7ee98080e33744898737635711f3f30987) feat: prerelease mode and publishing ([#180](https://www.github.com/jbolda/covector/pull/180)) on 2021-05-13
- This switches to using Typescript project references to build (previously rollup). It should affect the underlying packages or use.
  - [a9aedb1](https://www.github.com/jbolda/covector/commit/a9aedb1d5de01972b0576cc339788397e6ad829f) chore: build workflow updates ([#175](https://www.github.com/jbolda/covector/pull/175)) on 2021-04-07
  - [5506b19](https://www.github.com/jbolda/covector/commit/5506b195e176ecec1c49af83cac0f8c490ba845e) feat: add preview command to covector ([#187](https://www.github.com/jbolda/covector/pull/187)) on 2021-05-05
  - [e388cc7](https://www.github.com/jbolda/covector/commit/e388cc7ee98080e33744898737635711f3f30987) feat: prerelease mode and publishing ([#180](https://www.github.com/jbolda/covector/pull/180)) on 2021-05-13
- Add `versionPrerelease` to the pipe.
  - [e388cc7](https://www.github.com/jbolda/covector/commit/e388cc7ee98080e33744898737635711f3f30987) feat: prerelease mode and publishing ([#180](https://www.github.com/jbolda/covector/pull/180)) on 2021-05-13
- Add preview command for versioning and publishing preview packages
  - [f6db347](https://www.github.com/jbolda/covector/commit/f6db347f22fa027da85da85a6328296407e60b51) feat: preparations of covector/action for building and publishing preview packages ([#179](https://www.github.com/jbolda/covector/pull/179)) on 2021-04-13
  - [5506b19](https://www.github.com/jbolda/covector/commit/5506b195e176ecec1c49af83cac0f8c490ba845e) feat: add preview command to covector ([#187](https://www.github.com/jbolda/covector/pull/187)) on 2021-05-05
- Add support for yaml based package files. Add support for generic file whose only content is a version number.
  - [e8c98f5](https://www.github.com/jbolda/covector/commit/e8c98f5c627e172f56c11d17022f198ca3cb9883) feat: yaml and generic file support ([#196](https://www.github.com/jbolda/covector/pull/196)) on 2021-05-07

## \[0.3.2]

- Mock out full Github Release flow to help in testing the Github Action. Adjust command pipe to function to fix `undefined` being piped to Github Release body.
  - Bumped due to a bump in @covector/assemble.
  - [a7e1b20](https://www.github.com/jbolda/covector/commit/a7e1b209c704829bc8cb54bd220862e627bbee01) fix: mock out full GitHub release flow ([#172](https://www.github.com/jbolda/covector/pull/172)) on 2021-03-27

## \[0.3.1]

- Add missing dependencies that likely worked due to hoisting.
  - [60e8fc7](https://www.github.com/jbolda/covector/commit/60e8fc79cef13f2a2b442d772db0d9b8b9695ceb) chore: bump devDeps and fix tsconfig/rollup issues ([#165](https://www.github.com/jbolda/covector/pull/165)) on 2021-03-24

## \[0.3.0]

- Convert covector to typescript.
  - [cf9a893](https://www.github.com/jbolda/covector/commit/cf9a8935f244bd47b5614368865cc724f65e8980) feat: typescript covector main with rollup ([#63](https://www.github.com/jbolda/covector/pull/63)) on 2020-07-02
  - [39acdc9](https://www.github.com/jbolda/covector/commit/39acdc9edc1e2fa7e0dcffa38e658810a9b8756e) feat: convert over @covector/files to typescript with rollup \[partial] ([#65](https://www.github.com/jbolda/covector/pull/65)) on 2020-07-06
  - [1090afd](https://www.github.com/jbolda/covector/commit/1090afd46e8a7a2c2cfe9d571be744b79ded86a1) feat: typescript going green ([#153](https://www.github.com/jbolda/covector/pull/153)) on 2021-03-17

## \[0.2.3]

- Fix additional bump types to be a no-op bump.
  - [15431f0](https://www.github.com/jbolda/covector/commit/15431f0661a30c8cb336194e39709147bfbd1aea) fix: additional bump type is no-op ([#149](https://www.github.com/jbolda/covector/pull/149)) on 2021-02-22

## \[0.2.2]

- Add missing workspace dependencies. These were likely only functioning due to hoisting.
  - [948ca7c](https://www.github.com/jbolda/covector/commit/948ca7ca7f6332abb6ffd13ff68d21560f275b57) feat: init command ([#139](https://www.github.com/jbolda/covector/pull/139)) on 2021-02-12
- Add a validation guardrail within the `status` command. This will run a nearly identical version application function. It can catch an error during the PR process rather than during the versioning process.
  - [4437766](https://www.github.com/jbolda/covector/commit/44377667fe7c64207bc84140fb4954b23dc4424f) feat: version bump guardrail ([#137](https://www.github.com/jbolda/covector/pull/137)) on 2021-02-10

## \[0.2.1]

- Deep clone changes that are getting passed into the changelog. We were editing references and those edits were showing up in erroneous places.
  - [38fba3c](https://www.github.com/jbolda/covector/commit/38fba3c6791154f335dde10740cde6ad556b6ef3) fix: deepclone change entries to prevent referencial edits ([#109](https://www.github.com/jbolda/covector/pull/109)) on 2020-07-17

## \[0.2.0]

- Note in sub-bullets when a bump was due to a dependency (and that helps note where there summary text is from as well.)
  - [de3248d](https://www.github.com/jbolda/covector/commit/de3248dfd70146392ff65e7065c2125daf527728) feat: dep bump note in changelog ([#87](https://www.github.com/jbolda/covector/pull/87)) on 2020-07-10
- Version commands used to only run on changes, but ignore parents. Reconfigure that we resolve the parents and run commands on both direct changes and changes through a dependency.
  - Bumped due to a bump in covector.
  - [3ca050c](https://www.github.com/jbolda/covector/commit/3ca050c2c51821d229209e18391535c266b6b200) feat: advanced commands ([#71](https://www.github.com/jbolda/covector/pull/71)) on 2020-07-06
- Output versions split up which is particularly useful for git tags.
  - [14fb40d](https://www.github.com/jbolda/covector/commit/14fb40d50891766993d7e69c0c86c2ce3ffd2a8f) feat: split versions (great for git tags) ([#77](https://www.github.com/jbolda/covector/pull/77)) on 2020-07-08

## \[0.1.0]

- Add option to execute commands in "--dry-run" mode which will output the anticipated commands without running them and additional relevant information (such as the command pipe).
- Apply properly checks for parents to do dep bumps.
- Skip over packages without a path. This let's us create "virtual packages" and configure a package such as "all" that let's us easily bump everything.

## \[0.0.6]

- Package files should be referenced based on the "nickname" as noted in the config. The name in the package file is not a unique value.
