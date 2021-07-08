# Changelog

## \[0.7.2]

- Preview version template overwrites the prerelease identifier
  - Bumped due to a bump in @covector/apply.
  - [b6e21bc](https://www.github.com/jbolda/covector/commit/b6e21bc1267fa7a09fb5311f2944e32385f2fbb4) Preveiw versioning for packages in prerelease mode ([#217](https://www.github.com/jbolda/covector/pull/217)) on 2021-07-08

## \[0.7.1]

- The ability to adjust the Github Release git tag was previously added, and the fallback used only worked for JavaScript packages. This fix uses the package nickname instead which will work for any package manager.
  - Bumped due to a bump in @covector/assemble.
  - [e4eb944](https://www.github.com/jbolda/covector/commit/e4eb944ae48fa8e3ba419f92eaf0254065887fbf) fix: github release tag using package nickname ([#218](https://www.github.com/jbolda/covector/pull/218)) on 2021-07-02

## \[0.7.0]

- Remove the `files` property of `package.json` to properly publish all of the `dist` files.
  - [bfb1832](https://www.github.com/jbolda/covector/commit/bfb1832e676f14567ec3482bae872dbe6e892fb4) Include all file in dist directory ([#216](https://www.github.com/jbolda/covector/pull/216)) on 2021-06-30
- Extract out types into separate package to remove issues with circular dependencies.
  - [519da36](https://www.github.com/jbolda/covector/commit/519da362eff5628901a1f640120d39dd8234fdda) chore: set paths / references for TS and add types package ([#213](https://www.github.com/jbolda/covector/pull/213)) on 2021-06-26

## \[0.6.0]

- Adjust output from assemble and covector to expose the template that is piped into each command. This allows us to set it as an output in the github action.
  - [5797e79](https://www.github.com/jbolda/covector/commit/5797e792f532ad9bcb40c19cda080ca7713c0d91) feat: github action output template pipe ([#208](https://www.github.com/jbolda/covector/pull/208)) on 2021-05-18
- Bump `@effection/node` which fixes and now supports node 16 on Windows. (Other platforms had full support.)
  - [78222c4](https://www.github.com/jbolda/covector/commit/78222c47dcee04a8478d0e4abddb499b5eb95f74) bump @effection/node for node@16 windows support ([#210](https://www.github.com/jbolda/covector/pull/210)) on 2021-05-28
- Implement `errorOnVersionRange` which allows one to set a range which, when satisfied, will fail a `covector status` or `covector version`. This guardrail can help prevent a package from accidentally being bumped to the next major version.
  - [e388cc7](https://www.github.com/jbolda/covector/commit/e388cc7ee98080e33744898737635711f3f30987) feat: prerelease mode and publishing ([#180](https://www.github.com/jbolda/covector/pull/180)) on 2021-05-13
- Update `covector init` to create the yml with `actions/setup-node@v2`.
  - [2db4726](https://www.github.com/jbolda/covector/commit/2db47268d9300b77d089ab4049a789d36ea83999) fix: remove postinstall and adjust node setup for CI ([#182](https://www.github.com/jbolda/covector/pull/182)) on 2021-04-08
- Update `init` to only use simple string based commands. These are easier to grok for users first starting with covector and looking to understand what the `init` has created. Also prefer the `pkgFile` based names in the publish step to make it easier for someone to switch to using nicknames for packages easier (and less foot-guns).
  - [5692f42](https://www.github.com/jbolda/covector/commit/5692f42372528bc249a057d738059e34e3706b04) fix: improve init output for easier onboarding ([#178](https://www.github.com/jbolda/covector/pull/178)) on 2021-04-14
- This switches to using Typescript project references to build (previously rollup). It should affect the underlying packages or use.
  - [a9aedb1](https://www.github.com/jbolda/covector/commit/a9aedb1d5de01972b0576cc339788397e6ad829f) chore: build workflow updates ([#175](https://www.github.com/jbolda/covector/pull/175)) on 2021-04-07
  - [5506b19](https://www.github.com/jbolda/covector/commit/5506b195e176ecec1c49af83cac0f8c490ba845e) feat: add preview command to covector ([#187](https://www.github.com/jbolda/covector/pull/187)) on 2021-05-05
  - [e388cc7](https://www.github.com/jbolda/covector/commit/e388cc7ee98080e33744898737635711f3f30987) feat: prerelease mode and publishing ([#180](https://www.github.com/jbolda/covector/pull/180)) on 2021-05-13
- Pass head branch name into covector for running preview in action
  Tag gets piped into template in assemble
  Fix published boolean bug in command
  - [2bdc840](https://www.github.com/jbolda/covector/commit/2bdc84046523f3dca61f3623f1ea893445c9fffb) feat: Add dist-tag for preview publishing... and fix the published boolean bug ([#200](https://www.github.com/jbolda/covector/pull/200)) on 2021-05-13
- Add preview command for versioning and publishing preview packages
  - [f6db347](https://www.github.com/jbolda/covector/commit/f6db347f22fa027da85da85a6328296407e60b51) feat: preparations of covector/action for building and publishing preview packages ([#179](https://www.github.com/jbolda/covector/pull/179)) on 2021-04-13
  - [5506b19](https://www.github.com/jbolda/covector/commit/5506b195e176ecec1c49af83cac0f8c490ba845e) feat: add preview command to covector ([#187](https://www.github.com/jbolda/covector/pull/187)) on 2021-05-05
- Add support for yaml based package files. Add support for generic file whose only content is a version number.
  - [e8c98f5](https://www.github.com/jbolda/covector/commit/e8c98f5c627e172f56c11d17022f198ca3cb9883) feat: yaml and generic file support ([#196](https://www.github.com/jbolda/covector/pull/196)) on 2021-05-07

## \[0.5.3]

- Mock out full Github Release flow to help in testing the Github Action. Adjust command pipe to function to fix `undefined` being piped to Github Release body.
  - Bumped due to a bump in @covector/command.
  - [a7e1b20](https://www.github.com/jbolda/covector/commit/a7e1b209c704829bc8cb54bd220862e627bbee01) fix: mock out full GitHub release flow ([#172](https://www.github.com/jbolda/covector/pull/172)) on 2021-03-27

## \[0.5.2]

- Add missing dependencies that likely worked due to hoisting.
  - [60e8fc7](https://www.github.com/jbolda/covector/commit/60e8fc79cef13f2a2b442d772db0d9b8b9695ceb) chore: bump devDeps and fix tsconfig/rollup issues ([#165](https://www.github.com/jbolda/covector/pull/165)) on 2021-03-24
- The `init` should consider if there is an existing `.github` folder. Also, set the default action version to `major.minor`.
  - [0c7fa68](https://www.github.com/jbolda/covector/commit/0c7fa680932b0010f07aeb72d6f400a58ce088b1) fix: init github folder ([#162](https://www.github.com/jbolda/covector/pull/162)) on 2021-03-18
- Pipe the previous command output into function commands. This is primarily for the Github Releases which injects functions and will need the changelog output from `pkgCommandsRan`.
  - [66539a8](https://www.github.com/jbolda/covector/commit/66539a800365ccfb28f95291b066e77114863382) fix: GitHub release pipe ([#164](https://www.github.com/jbolda/covector/pull/164)) on 2021-03-24
- Pull the most recent changelog into the chain of output. This opens up piping it into the Github Release.
  - [66539a8](https://www.github.com/jbolda/covector/commit/66539a800365ccfb28f95291b066e77114863382) fix: GitHub release pipe ([#164](https://www.github.com/jbolda/covector/pull/164)) on 2021-03-24
- Split up config merge function into two functions, one for version and one for publish, et al. This makes the types easier to reason about.
  - [66539a8](https://www.github.com/jbolda/covector/commit/66539a800365ccfb28f95291b066e77114863382) fix: GitHub release pipe ([#164](https://www.github.com/jbolda/covector/pull/164)) on 2021-03-24

## \[0.5.1]

- The action `dist` folder was accidentally gitignored. We want to commit it so actions can run directly from the dist without install.
  - [ac2f857](https://www.github.com/jbolda/covector/commit/ac2f857403fe970fec04c29d19ec199acf97ac65) chore: fix gitignore for action ([#160](https://www.github.com/jbolda/covector/pull/160)) on 2021-03-18

## \[0.5.0]

- Bump effection to stable v1.
  - [29f9734](https://www.github.com/jbolda/covector/commit/29f9734b9703c473b85608fce617ff61c5ef091c) fix: piped commands ([#159](https://www.github.com/jbolda/covector/pull/159)) on 2021-03-17
- Convert covector to typescript.
  - [cf9a893](https://www.github.com/jbolda/covector/commit/cf9a8935f244bd47b5614368865cc724f65e8980) feat: typescript covector main with rollup ([#63](https://www.github.com/jbolda/covector/pull/63)) on 2020-07-02
  - [39acdc9](https://www.github.com/jbolda/covector/commit/39acdc9edc1e2fa7e0dcffa38e658810a9b8756e) feat: convert over @covector/files to typescript with rollup \[partial] ([#65](https://www.github.com/jbolda/covector/pull/65)) on 2020-07-06
  - [1090afd](https://www.github.com/jbolda/covector/commit/1090afd46e8a7a2c2cfe9d571be744b79ded86a1) feat: typescript going green ([#153](https://www.github.com/jbolda/covector/pull/153)) on 2021-03-17

## \[0.4.5]

- Fix `init` Rust based packages coming in as undefined.
  - [1b8eca7](https://www.github.com/jbolda/covector/commit/1b8eca7267a2d39549e8937c2e02279e27ab8824) fix: rust based packages undefined ([#151](https://www.github.com/jbolda/covector/pull/151)) on 2021-02-22

## \[0.4.4]

- The result of the action had the covector output scoped, and further on logs failed. Hoist it so it is in the correct scope.
  - [e0ceae9](https://www.github.com/jbolda/covector/commit/e0ceae980cafc3dcfdb6d4db4b2deb6c8e4c3a9b) fix: action output result undefined ([#145](https://www.github.com/jbolda/covector/pull/145)) on 2021-02-14

## \[0.4.3]

- The `core` method was not passed to the release util in the Github Action. This failed the Github Release creation.
  - [c9026bd](https://www.github.com/jbolda/covector/commit/c9026bdc47d828b7f5c17b6e4680d22fe7c623a6) fix: core not passed in action ([#143](https://www.github.com/jbolda/covector/pull/143)) on 2021-02-14

## \[0.4.2]

- Switch to currying github context as binding returned undefined.
  - [5b60ba1](https://www.github.com/jbolda/covector/commit/5b60ba11b4c1169953da5c2a709ad15a9c700605) fix: curry github release info ([#141](https://www.github.com/jbolda/covector/pull/141)) on 2021-02-14

## \[0.4.0]

- Some workflows require different actions for different packages. Most of this can be codified into config. However there are cases where you may need to run a command for a dynamic set of packages.
  - [2748d90](https://www.github.com/jbolda/covector/commit/2748d90cfe2dbe94050ccc85e932aff4260627d4) feat: filter pkgs ([#128](https://www.github.com/jbolda/covector/pull/128)) on 2020-11-26
- Add `init` command that helps to bootstrap the configuration.
  - [948ca7c](https://www.github.com/jbolda/covector/commit/948ca7ca7f6332abb6ffd13ff68d21560f275b57) feat: init command ([#139](https://www.github.com/jbolda/covector/pull/139)) on 2021-02-12
- Add `modifyConfig` property that takes a function which can modify the config file that is loaded. This will likely only be used in the Github Action to inject a JavaScript function into the publish sequences which creates a Github Release.
  - [6dc90bf](https://www.github.com/jbolda/covector/commit/6dc90bfe849c4c9441afce7a26a01aabf4a2196c) feat: reorder GitHub release step ([#136](https://www.github.com/jbolda/covector/pull/136)) on 2021-02-09
- Add a validation guardrail within the `status` command. This will run a nearly identical version application function. It can catch an error during the PR process rather than during the versioning process.
  - [4437766](https://www.github.com/jbolda/covector/commit/44377667fe7c64207bc84140fb4954b23dc4424f) feat: version bump guardrail ([#137](https://www.github.com/jbolda/covector/pull/137)) on 2021-02-10

## \[0.3.1]

- The command sequence was piping to the return correctly, but in publish, we didn't properly concat the text. Fix that.
  - [095fe43](https://www.github.com/jbolda/covector/commit/095fe43d856ff5cf22995d2729afa449ebc3d4e3) fix: proper pipe publish output in action ([#114](https://www.github.com/jbolda/covector/pull/114)) on 2020-07-21

## \[0.3.0]

- Allow multiple publish sequences. Any command beginning with `publish` will invoke the related `getPublishedVersion`, e.g. `publishNPM` would look for and check `getPublishedVersionNPM`. This allows separation of concerns and re-run-ability for multiple deploy targets.
  - [ed3698d](https://www.github.com/jbolda/covector/commit/ed3698df85140dd13e98569c4266df03f8bbfc16) feat: allow multiple publishes ([#113](https://www.github.com/jbolda/covector/pull/113)) on 2020-07-19

## \[0.2.6]

- Increase default timeout and allow it to be set from config.
  - [a80e2ee](https://www.github.com/jbolda/covector/commit/a80e2eecdc21318b9dd93e9a9fe2a5441703fea5) chore: increase default timeout ([#106](https://www.github.com/jbolda/covector/pull/106)) on 2020-07-17

## \[0.2.5]

- Stringify remaining portion of change file. Previously we were just looping on `paragraph` which would miss links.
  - Bumped due to a bump in @covector/assemble.
  - [afc5ceb](https://www.github.com/jbolda/covector/commit/afc5ceb747609979d82e380d7be086a40cdc48ef) fix: stringify remaining change file ([#103](https://www.github.com/jbolda/covector/pull/103)) on 2020-07-15

## \[0.2.4]

- Throw an error if a change file is added that targets a package that does not exist in the config.
  - [48c1c99](https://www.github.com/jbolda/covector/commit/48c1c995fd69b028ec975fc577986b23adfb55b9) feat: throw error on non-existant package, closes [#57](https://www.github.com/jbolda/covector/pull/57) ([#102](https://www.github.com/jbolda/covector/pull/102)) on 2020-07-14

## \[0.2.3]

- Pass split versions through to pipe.
  - Bumped due to a bump in @covector/assemble.
  - [6370826](https://www.github.com/jbolda/covector/commit/63708261d633d22ada1c7e14667b4107ea7e68c3) fix: pass split versions through to pipe ([#96](https://www.github.com/jbolda/covector/pull/96)) on 2020-07-11

## \[0.2.2]

- In --dry-run mode, output the expected commands with data piped in.
  - Bumped due to a bump in covector.
  - [1bb67ea](https://www.github.com/jbolda/covector/commit/1bb67ea671b6fbe9b21af9feb72612d166fd7662) fix: missing publish pipe ([#94](https://www.github.com/jbolda/covector/pull/94)) on 2020-07-10

## \[0.2.1]

- Shift getPublishedVersion check prior to commands running. Without this, postpublished would never run (since packages were just published and are update to date).
  - Bumped due to a bump in covector.
  - [922d224](https://www.github.com/jbolda/covector/commit/922d224c34a4e3e2f711877fe42fddd4faba55ab) fix: getPublishedVersion check shift ([#92](https://www.github.com/jbolda/covector/pull/92)) on 2020-07-10

## \[0.2.0]

- Added new dryRunCommand to specify a different command to run instead in --dry-run mode instead of skipping the specified command.
  - Bumped due to a bump in covector.
  - [3ca050c](https://www.github.com/jbolda/covector/commit/3ca050c2c51821d229209e18391535c266b6b200) feat: advanced commands ([#71](https://www.github.com/jbolda/covector/pull/71)) on 2020-07-06
- Change files were being deleted too quickly for git info to be retrieved. Shift to end of sequence.
  - Bumped due to a bump in covector.
  - [85bff4b](https://www.github.com/jbolda/covector/commit/85bff4b146d59a5bc4a093f3e7610d22876d7d0e) fix: delay change file deletion for git info retrieval ([#82](https://www.github.com/jbolda/covector/pull/82)) on 2020-07-09
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
- Adjust covector publish command to return the pkg as part of the out.
  - Bumped due to a bump in covector.
  - [a1ac9f7](https://www.github.com/jbolda/covector/commit/a1ac9f7b03be0a76bf3cfb664f330fc29e5c0c4e) feature: github release on publish ([#76](https://www.github.com/jbolda/covector/pull/76)) on 2020-07-08
- Split out child_process commands into separate package.
  - Bumped due to a bump in covector.
  - [cc19486](https://www.github.com/jbolda/covector/commit/cc19486f86b78aec2c719e5dd17a2d72cbc8d450) feat: new command package and piped git info ([#78](https://www.github.com/jbolda/covector/pull/78)) on 2020-07-09

## \[0.1.1]

- We were missing a yield on getPublishedVersion which was meaning everything would always try to publish.

## \[0.1.0]

- Add option to execute commands in "--dry-run" mode which will output the anticipated commands without running them and additional relevant information (such as the command pipe).
- Allow use of any arbitrary command as defined in the configuration.
- Allow arrays for commands and run pre/post versions of each command.

## \[0.0.17]

- Temporarily switch to execa for covector as it properly deals with piped and errors.

## \[0.0.16]

Bumped due to dependency.

## \[0.0.15]

- Add ability to read and write changelogs.
