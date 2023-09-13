# Changelog

## \[0.10.1]

### Dependencies

- Upgraded to `covector@0.10.1`

## \[0.10.0]

### New Features

- [`54f9d7a`](https://www.github.com/jbolda/covector/commit/54f9d7ac68a28e03c46d2354f5ecfdc261f23529)([#280](https://www.github.com/jbolda/covector/pull/280)) Support built-in commands to simplify typical operations.

### Enhancements

- [`5b7ab24`](https://www.github.com/jbolda/covector/commit/5b7ab24f3e6b51743bf62711ff761f919467a207)([#274](https://www.github.com/jbolda/covector/pull/274)) Add support to Cargo's `build-dependencies` and target-specific dependencies.

### Dependencies

- Upgraded to `covector@0.10.0`

## \[0.9.0]

### Dependencies

- [`7b6201c`](https://www.github.com/jbolda/covector/commit/7b6201c2e7e0d9120610a2a882c0b4523f4ab6dc)([#264](https://www.github.com/jbolda/covector/pull/264)) Bump Typescript to v4.9, and deeply update types in the lower level functions to start.

### New Features

- [`0b33560`](https://www.github.com/jbolda/covector/commit/0b335606a4998f94ad88006ccc6cf0e7cb2538b1)([#244](https://www.github.com/jbolda/covector/pull/244)) Add changelog tags (section or category) to group different change files.

### Enhancements

- [`2ba699d`](https://www.github.com/jbolda/covector/commit/2ba699d8759d9526563a9665568c2779269ae7a5)([#243](https://www.github.com/jbolda/covector/pull/243)) Update the changelog format to fix multi-line change files and reduce commit noise.

## \[0.8.0]

- Run the Github Action with Node v16. The previous version, Node v12, will no longer be supported.
  - [d40c111](https://www.github.com/jbolda/covector/commit/d40c1115f4b6896d91f52b02df8fbfca87285434) chore(action): Use Node.js 16.x ([#249](https://www.github.com/jbolda/covector/pull/249)) on 2022-12-19
- Update `@actions/core` and `@actions/github` to remove deprecation warnings.
  - [3783b53](https://www.github.com/jbolda/covector/commit/3783b53def27bd1c239549f813a6dc37a23f1a71) chore(action): Update actions/core and actions/github dependencies ([#248](https://www.github.com/jbolda/covector/pull/248)) on 2022-12-21
- Update multiple devDeps, semver, yargs, inquirer, and packages in our action. This is primarily internal upgrades and don't affect external APIs.
  - [18ff898](https://www.github.com/jbolda/covector/commit/18ff898a64a0f3677c55d994d22177189700204a) dep update ([#240](https://www.github.com/jbolda/covector/pull/240)) on 2022-04-16
- Remove the `to-vfile` package as a dependency. This allows us to focus our file reference to our specific needs, and one less dependency to maintain. With this change, we also converted a handful of promises into generators for better compatibility and control with effection.
  - [1b33933](https://www.github.com/jbolda/covector/commit/1b33933be25094900f647527a82ddba0a08778fe) Remove vfile ([#234](https://www.github.com/jbolda/covector/pull/234)) on 2022-04-10
- Set the `target_commitish` field on created releases.
  - [8f4bad1](https://www.github.com/jbolda/covector/commit/8f4bad1ec6909eb9a46f5c5c05e3c7c36c4de9df) feat: set target_commitish for the release, closes [#250](https://www.github.com/jbolda/covector/pull/250) ([#251](https://www.github.com/jbolda/covector/pull/251)) on 2022-12-22
- Upgrade to `effection` v2. This is primarily an internal improvement, but will enable future features such as fetching from an endpoint to check if a version of a package was published. It also brings an updated dependency to gracefully shutdown windows processes.
  - [a0acf81](https://www.github.com/jbolda/covector/commit/a0acf81b2235ac142233d9c0e416d5e07af3cbb3) Effection v2 ([#227](https://www.github.com/jbolda/covector/pull/227)) on 2022-03-19
  - [a346221](https://www.github.com/jbolda/covector/commit/a346221102075e647693851fd1019d66641f8014) bump effection to latest on v2 ([#246](https://www.github.com/jbolda/covector/pull/246)) on 2022-10-26

## \[0.7.0]

- The action created a release for any `publish` keys in `pkgManger`, but didn't do it for anything specified in `packages`. This meant that if you elected not to use `pkgManager`, it would not create a release. This has been fixed and it will now create a release. We also added some debug output to improve the debugging experience.
  - [695feed](https://www.github.com/jbolda/covector/commit/695feed9133ff53b3edb9d6184f8f3a9f0959a0a) fix `packages` release creation (without `pkgManagers`) and add debug output ([#226](https://www.github.com/jbolda/covector/pull/226)) on 2021-09-23
- Include information about the created release in the actions outputs
  - [028ae89](https://www.github.com/jbolda/covector/commit/028ae8967a82c2dd8f8898f682599f5dcadb049d) Release info in action output ([#221](https://www.github.com/jbolda/covector/pull/221)) on 2021-09-09

## \[0.6.2]

- Preview version template overwrites the prerelease identifier
  - Bumped due to a bump in covector.
  - [b6e21bc](https://www.github.com/jbolda/covector/commit/b6e21bc1267fa7a09fb5311f2944e32385f2fbb4) Preveiw versioning for packages in prerelease mode ([#217](https://www.github.com/jbolda/covector/pull/217)) on 2021-07-08

## \[0.6.1]

- The ability to adjust the Github Release git tag was previously added, and the fallback used only worked for JavaScript packages. This fix uses the package nickname instead which will work for any package manager.
  - Bumped due to a bump in covector.
  - [e4eb944](https://www.github.com/jbolda/covector/commit/e4eb944ae48fa8e3ba419f92eaf0254065887fbf) fix: github release tag using package nickname ([#218](https://www.github.com/jbolda/covector/pull/218)) on 2021-07-02

## \[0.6.0]

- Adds the ability to update a Github Release if it exists and is a draft, or create it if it doesn't yet exist.
  - [6742580](https://www.github.com/jbolda/covector/commit/674258044048a259b5dce1bc02b241dd0f17e978) feat: publish existing draft GitHub Release ([#211](https://www.github.com/jbolda/covector/pull/211)) on 2021-06-18
- Allow one to specify the `releaseTag` that determines the Github Release tag used. This also let's you specify `false` to explicitly skip creating a Github Release for the package. resolves #203, resolves #204.
  - [6742580](https://www.github.com/jbolda/covector/commit/674258044048a259b5dce1bc02b241dd0f17e978) feat: publish existing draft GitHub Release ([#211](https://www.github.com/jbolda/covector/pull/211)) on 2021-06-18

## \[0.5.0]

- Adjust output from assemble and covector to expose the template that is piped into each command. This allows us to set it as an output in the github action.
  - [5797e79](https://www.github.com/jbolda/covector/commit/5797e792f532ad9bcb40c19cda080ca7713c0d91) feat: github action output template pipe ([#208](https://www.github.com/jbolda/covector/pull/208)) on 2021-05-18
- The `status` command did not previously have any output to act on. Add a new output that contains the covector output.
  - [e8c98f5](https://www.github.com/jbolda/covector/commit/e8c98f5c627e172f56c11d17022f198ca3cb9883) feat: yaml and generic file support ([#196](https://www.github.com/jbolda/covector/pull/196)) on 2021-05-07
- Bump `@effection/node` which fixes and now supports node 16 on Windows. (Other platforms had full support.)
  - [78222c4](https://www.github.com/jbolda/covector/commit/78222c47dcee04a8478d0e4abddb499b5eb95f74) bump @effection/node for node@16 windows support ([#210](https://www.github.com/jbolda/covector/pull/210)) on 2021-05-28
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
- Action generates pull request comments when it runs `covector preview`
  - [b528f44](https://www.github.com/jbolda/covector/commit/b528f44a33623579713eca50f5d0bab8b5d77a95) feat: pr comment generator for covector preview ([#191](https://www.github.com/jbolda/covector/pull/191)) on 2021-05-05

## \[0.4.3]

- Mock out full Github Release flow to help in testing the Github Action. Adjust command pipe to function to fix `undefined` being piped to Github Release body.
  - [a7e1b20](https://www.github.com/jbolda/covector/commit/a7e1b209c704829bc8cb54bd220862e627bbee01) fix: mock out full GitHub release flow ([#172](https://www.github.com/jbolda/covector/pull/172)) on 2021-03-27

## \[0.4.2]

- Pipe the previous command output into function commands. This is primarily for the Github Releases which injects functions and will need the changelog output from `pkgCommandsRan`.
  - [66539a8](https://www.github.com/jbolda/covector/commit/66539a800365ccfb28f95291b066e77114863382) fix: GitHub release pipe ([#164](https://www.github.com/jbolda/covector/pull/164)) on 2021-03-24

## \[0.4.1]

- The action `dist` folder was accidentally gitignored. We want to commit it so actions can run directly from the dist without install.
  - [ac2f857](https://www.github.com/jbolda/covector/commit/ac2f857403fe970fec04c29d19ec199acf97ac65) chore: fix gitignore for action ([#160](https://www.github.com/jbolda/covector/pull/160)) on 2021-03-18

## \[0.4.0]

- Bump effection to stable v1.
  - [29f9734](https://www.github.com/jbolda/covector/commit/29f9734b9703c473b85608fce617ff61c5ef091c) fix: piped commands ([#159](https://www.github.com/jbolda/covector/pull/159)) on 2021-03-17

## \[0.3.4]

- Fix `init` Rust based packages coming in as undefined.
  - Bumped due to a bump in covector.
  - [1b8eca7](https://www.github.com/jbolda/covector/commit/1b8eca7267a2d39549e8937c2e02279e27ab8824) fix: rust based packages undefined ([#151](https://www.github.com/jbolda/covector/pull/151)) on 2021-02-22

## \[0.3.3]

- The result of the action had the covector output scoped, and further on logs failed. Hoist it so it is in the correct scope.
  - [e0ceae9](https://www.github.com/jbolda/covector/commit/e0ceae980cafc3dcfdb6d4db4b2deb6c8e4c3a9b) fix: action output result undefined ([#145](https://www.github.com/jbolda/covector/pull/145)) on 2021-02-14

## \[0.3.2]

- The `core` method was not passed to the release util in the Github Action. This failed the Github Release creation.
  - [c9026bd](https://www.github.com/jbolda/covector/commit/c9026bdc47d828b7f5c17b6e4680d22fe7c623a6) fix: core not passed in action ([#143](https://www.github.com/jbolda/covector/pull/143)) on 2021-02-14

## \[0.3.1]

- Switch to currying github context as binding returned undefined.
  - [5b60ba1](https://www.github.com/jbolda/covector/commit/5b60ba11b4c1169953da5c2a709ad15a9c700605) fix: curry github release info ([#141](https://www.github.com/jbolda/covector/pull/141)) on 2021-02-14

## \[0.3.0]

- Add extra outputs for which packages published and a list of packages. This is useful for chaining runs of the action together.
  - [7d3b0d6](https://www.github.com/jbolda/covector/commit/7d3b0d66d5ae1e826595535904513656a41cfac0) feat: add action output to better show which packages published ([#130](https://www.github.com/jbolda/covector/pull/130)) on 2020-11-26
- Some workflows require different actions for different packages. Most of this can be codified into config. However there are cases where you may need to run a command for a dynamic set of packages.
  - [2748d90](https://www.github.com/jbolda/covector/commit/2748d90cfe2dbe94050ccc85e932aff4260627d4) feat: filter pkgs ([#128](https://www.github.com/jbolda/covector/pull/128)) on 2020-11-26
- Add `modifyConfig` property that takes a function which can modify the config file that is loaded. This will likely only be used in the Github Action to inject a JavaScript function into the publish sequences which creates a Github Release.
  - [6dc90bf](https://www.github.com/jbolda/covector/commit/6dc90bfe849c4c9441afce7a26a01aabf4a2196c) feat: reorder GitHub release step ([#136](https://www.github.com/jbolda/covector/pull/136)) on 2021-02-09

## \[0.2.6]

- The command sequence was piping to the return correctly, but in publish, we didn't properly concat the text. Fix that.
  - Bumped due to a bump in covector.
  - [095fe43](https://www.github.com/jbolda/covector/commit/095fe43d856ff5cf22995d2729afa449ebc3d4e3) fix: proper pipe publish output in action ([#114](https://www.github.com/jbolda/covector/pull/114)) on 2020-07-21

## \[0.2.5]

- Add extra outputs that says which command was run (for `version-or-publish`) and if something was published.
  - [65aad0f](https://www.github.com/jbolda/covector/commit/65aad0f34ccc3d3b17ce31dda5eb9aaa8efd563f) feat: adjust action output for better follow on step responses ([#111](https://www.github.com/jbolda/covector/pull/111)) on 2020-07-19

## \[0.2.4]

- Increase default timeout and allow it to be set from config.
  - Bumped due to a bump in covector.
  - [a80e2ee](https://www.github.com/jbolda/covector/commit/a80e2eecdc21318b9dd93e9a9fe2a5441703fea5) chore: increase default timeout ([#106](https://www.github.com/jbolda/covector/pull/106)) on 2020-07-17

## \[0.2.3]

Bumped due to dependency.

## \[0.2.3]

- Fix create release and upload errors on publish.
  - [f0443c1](https://www.github.com/jbolda/covector/commit/f0443c17e4584b026eecc6c8a5f34b362c02c498) fix: create release on publish ([#100](https://www.github.com/jbolda/covector/pull/100)) on 2020-07-14

## \[0.2.2]

Bumped due to dependency.

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

Bumped due to dependency.

## \[0.1.0]

Bumped due to dependency.

## \[0.0.3]

Bumped due to dependency.

## \[0.0.2]

Bumped due to dependency.
