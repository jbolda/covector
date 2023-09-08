# Changelog

## \[0.7.0]

### Enhancements

- [`7498ecc`](https://www.github.com/jbolda/covector/commit/7498ecc332efd10a1d6d4b6cd487d2817c9a853d)([#289](https://www.github.com/jbolda/covector/pull/289)) Implement zod for config file schema parsing and checking. It will throw an error if the `config.json` has entries that do not match the schema.

### Dependencies

- [`cb35f38`](https://www.github.com/jbolda/covector/commit/cb35f38287580597539f3c69d748ee330939cf84)([#291](https://www.github.com/jbolda/covector/pull/291)) Bumps `js-yaml` minor to sync on the same version.
- [`cb35f38`](https://www.github.com/jbolda/covector/commit/cb35f38287580597539f3c69d748ee330939cf84)([#291](https://www.github.com/jbolda/covector/pull/291)) Bumps `semver` minor to latest.

## \[0.6.2]

### Enhancements

- [`5b7ab24`](https://www.github.com/jbolda/covector/commit/5b7ab24f3e6b51743bf62711ff761f919467a207)([#274](https://www.github.com/jbolda/covector/pull/274)) Add support to Cargo's `build-dependencies` and target-specific dependencies.

## \[0.6.1]

### Dependencies

- [`7b6201c`](https://www.github.com/jbolda/covector/commit/7b6201c2e7e0d9120610a2a882c0b4523f4ab6dc)([#264](https://www.github.com/jbolda/covector/pull/264)) Bump Typescript to v4.9, and deeply update types in the lower level functions to start.

### New Features

- [`84c9d9d`](https://www.github.com/jbolda/covector/commit/84c9d9dd8f9bfbb0e0116fc5b8bfc1f62fd2b5bd)([#268](https://www.github.com/jbolda/covector/pull/268)) Handle Rust projects with versions handled with workspace inheritance.

## \[0.6.0]

- Update multiple devDeps, semver, yargs, inquirer, and packages in our action. This is primarily internal upgrades and don't affect external APIs.
  - [18ff898](https://www.github.com/jbolda/covector/commit/18ff898a64a0f3677c55d994d22177189700204a) dep update ([#240](https://www.github.com/jbolda/covector/pull/240)) on 2022-04-16
- Bump inquirer and globby to highest CJS version.
  - [84eb245](https://www.github.com/jbolda/covector/commit/84eb2451d0ad0c27c10caa9c516e5d9d61cf7ce0) bump inquirer and globby to highest CJS version ([#254](https://www.github.com/jbolda/covector/pull/254)) on 2022-12-19
- Added a new function to read all of the package files and include their dependencies as an object for reference. This is helpful for further packages to understand if the dependency is range based and make judgements based on it.
  - [ba6e7f1](https://www.github.com/jbolda/covector/commit/ba6e7f1c9ead622844ff1c040fffb67b925f0bcf) skip bump for range ([#257](https://www.github.com/jbolda/covector/pull/257)) on 2023-01-12
- Remove the `to-vfile` package as a dependency. This allows us to focus our file reference to our specific needs, and one less dependency to maintain. With this change, we also converted a handful of promises into generators for better compatibility and control with effection.
  - [1b33933](https://www.github.com/jbolda/covector/commit/1b33933be25094900f647527a82ddba0a08778fe) Remove vfile ([#234](https://www.github.com/jbolda/covector/pull/234)) on 2022-04-10
- Upgrade to `effection` v2. This is primarily an internal improvement, but will enable future features such as fetching from an endpoint to check if a version of a package was published. It also brings an updated dependency to gracefully shutdown windows processes.
  - [a0acf81](https://www.github.com/jbolda/covector/commit/a0acf81b2235ac142233d9c0e416d5e07af3cbb3) Effection v2 ([#227](https://www.github.com/jbolda/covector/pull/227)) on 2022-03-19
  - [a346221](https://www.github.com/jbolda/covector/commit/a346221102075e647693851fd1019d66641f8014) bump effection to latest on v2 ([#246](https://www.github.com/jbolda/covector/pull/246)) on 2022-10-26

## \[0.5.1]

- Include a copy of the license in each package.
  - Bumped due to a bump in all.
  - [fa5c061](https://www.github.com/jbolda/covector/commit/fa5c061830d181ae9a52b183441890a25e07946a) chore: add license files to packages ([#225](https://www.github.com/jbolda/covector/pull/225)) on 2021-09-24

## \[0.5.0]

- Extract out types into separate package to remove issues with circular dependencies.
  - [519da36](https://www.github.com/jbolda/covector/commit/519da362eff5628901a1f640120d39dd8234fdda) chore: set paths / references for TS and add types package ([#213](https://www.github.com/jbolda/covector/pull/213)) on 2021-06-26

## \[0.4.0]

- Abstract out the file switches so `@covector/files` is the only package that considers file extensions.
  - [136d534](https://www.github.com/jbolda/covector/commit/136d5347b09361e70c3bbd9773973938295fa9ac) feat: normalize version number pulling and setting ([#206](https://www.github.com/jbolda/covector/pull/206)) on 2021-05-17
- Implement `errorOnVersionRange` which allows one to set a range which, when satisfied, will fail a `covector status` or `covector version`. This guardrail can help prevent a package from accidentally being bumped to the next major version.
  - [e388cc7](https://www.github.com/jbolda/covector/commit/e388cc7ee98080e33744898737635711f3f30987) feat: prerelease mode and publishing ([#180](https://www.github.com/jbolda/covector/pull/180)) on 2021-05-13
- This switches to using Typescript project references to build (previously rollup). It should affect the underlying packages or use.
  - [a9aedb1](https://www.github.com/jbolda/covector/commit/a9aedb1d5de01972b0576cc339788397e6ad829f) chore: build workflow updates ([#175](https://www.github.com/jbolda/covector/pull/175)) on 2021-04-07
  - [5506b19](https://www.github.com/jbolda/covector/commit/5506b195e176ecec1c49af83cac0f8c490ba845e) feat: add preview command to covector ([#187](https://www.github.com/jbolda/covector/pull/187)) on 2021-05-05
  - [e388cc7](https://www.github.com/jbolda/covector/commit/e388cc7ee98080e33744898737635711f3f30987) feat: prerelease mode and publishing ([#180](https://www.github.com/jbolda/covector/pull/180)) on 2021-05-13
- Add the ability to parse `pre.json` which is used in prereleases.
  - [e388cc7](https://www.github.com/jbolda/covector/commit/e388cc7ee98080e33744898737635711f3f30987) feat: prerelease mode and publishing ([#180](https://www.github.com/jbolda/covector/pull/180)) on 2021-05-13
- Add `versionPrerelease` to the pipe.
  - [e388cc7](https://www.github.com/jbolda/covector/commit/e388cc7ee98080e33744898737635711f3f30987) feat: prerelease mode and publishing ([#180](https://www.github.com/jbolda/covector/pull/180)) on 2021-05-13
- Add support for yaml based package files. Add support for generic file whose only content is a version number.
  - [e8c98f5](https://www.github.com/jbolda/covector/commit/e8c98f5c627e172f56c11d17022f198ca3cb9883) feat: yaml and generic file support ([#196](https://www.github.com/jbolda/covector/pull/196)) on 2021-05-07

## \[0.3.1]

- Pull the most recent changelog into the chain of output. This opens up piping it into the Github Release.
  - [66539a8](https://www.github.com/jbolda/covector/commit/66539a800365ccfb28f95291b066e77114863382) fix: GitHub release pipe ([#164](https://www.github.com/jbolda/covector/pull/164)) on 2021-03-24

## \[0.3.0]

- Convert covector to typescript.
  - [cf9a893](https://www.github.com/jbolda/covector/commit/cf9a8935f244bd47b5614368865cc724f65e8980) feat: typescript covector main with rollup ([#63](https://www.github.com/jbolda/covector/pull/63)) on 2020-07-02
  - [39acdc9](https://www.github.com/jbolda/covector/commit/39acdc9edc1e2fa7e0dcffa38e658810a9b8756e) feat: convert over @covector/files to typescript with rollup \[partial] ([#65](https://www.github.com/jbolda/covector/pull/65)) on 2020-07-06
  - [1090afd](https://www.github.com/jbolda/covector/commit/1090afd46e8a7a2c2cfe9d571be744b79ded86a1) feat: typescript going green ([#153](https://www.github.com/jbolda/covector/pull/153)) on 2021-03-17

## \[0.2.1]

- Add a validation guardrail within the `status` command. This will run a nearly identical version application function. It can catch an error during the PR process rather than during the versioning process.
  - [4437766](https://www.github.com/jbolda/covector/commit/44377667fe7c64207bc84140fb4954b23dc4424f) feat: version bump guardrail ([#137](https://www.github.com/jbolda/covector/pull/137)) on 2021-02-10

## \[0.2.0]

- Change files were being deleted too quickly for git info to be retrieved. Shift to end of sequence.
  - Bumped due to a bump in covector.
  - [85bff4b](https://www.github.com/jbolda/covector/commit/85bff4b146d59a5bc4a093f3e7610d22876d7d0e) fix: delay change file deletion for git info retrieval ([#82](https://www.github.com/jbolda/covector/pull/82)) on 2020-07-09
- Pull and set git meta information on change files as an array of commits. This can then be piped into changelogs.
  - Bumped due to a bump in covector.
  - [cc19486](https://www.github.com/jbolda/covector/commit/cc19486f86b78aec2c719e5dd17a2d72cbc8d450) feat: new command package and piped git info ([#78](https://www.github.com/jbolda/covector/pull/78)) on 2020-07-09
  - [de3248d](https://www.github.com/jbolda/covector/commit/de3248dfd70146392ff65e7065c2125daf527728) feat: dep bump note in changelog ([#87](https://www.github.com/jbolda/covector/pull/87)) on 2020-07-10
- Output versions split up which is particularly useful for git tags.
  - [14fb40d](https://www.github.com/jbolda/covector/commit/14fb40d50891766993d7e69c0c86c2ce3ffd2a8f) feat: split versions (great for git tags) ([#77](https://www.github.com/jbolda/covector/pull/77)) on 2020-07-08

## \[0.1.0]

- Log change file deletes after all delete operations have been completed. This provides a stable output easier for testing.

## \[0.0.8]

- Properly delete the change files in an order that is determinate.
- Package files should be referenced based on the "nickname" as noted in the config. The name in the package file is not a unique value.

## \[0.0.7]

- We missed files in the changelog deps array so they diverged when bumped.

## \[0.0.6]

- Add ability to read and write changelogs.
