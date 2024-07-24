# Changelog

## \[0.12.3]

### Bug Fixes

- [`e81201f`](https://www.github.com/jbolda/covector/commit/e81201fe12a06292ea6bebfb62951a718bee3d74) ([#350](https://www.github.com/jbolda/covector/pull/350) by [@chippers](https://www.github.com/jbolda/covector/../../chippers)) Fix GitHub pull request comment link to correctly point at the docs.

## \[0.12.2]

### Enhancements

- [`ef274be`](https://www.github.com/jbolda/covector/commit/ef274be8ad5722c9a2362d931bdd9a1653687e06) ([#347](https://www.github.com/jbolda/covector/pull/347) by [@jbolda](https://www.github.com/jbolda/covector/../../jbolda)) Add `cwd` option to pass to the CLI. Useful for local development, at minimum.

### Bug Fixes

- [`7fe7243`](https://www.github.com/jbolda/covector/commit/7fe7243ec96c925da189348c33bcb04ac0ac56b0) ([#348](https://www.github.com/jbolda/covector/pull/348) by [@jbolda](https://www.github.com/jbolda/covector/../../jbolda)) Prerelease versions which post comments require the config passed in the return signature.

## \[0.12.1]

### Enhancements

- [`1a1f4c6`](https://www.github.com/jbolda/covector/commit/1a1f4c6e08e08893d841d4ac0f057d4f72b7712c) ([#344](https://www.github.com/jbolda/covector/pull/344) by [@jbolda](https://www.github.com/jbolda/covector/../../jbolda)) Enable new features in `covector init` and adjust permissions to suit. This includes tagging contributors in the changelog and writing a comment in PRs with additional context (non-forks only through `init`).

### Bug Fixes

- [`055a319`](https://www.github.com/jbolda/covector/commit/055a3191f0783e99f15028cc8b16b1780d3d8167) ([#343](https://www.github.com/jbolda/covector/pull/343) by [@jbolda](https://www.github.com/jbolda/covector/../../jbolda)) Missed some logger function which were improperly passed an non-message object. If rendering an object, it requires `msg` and `renderAsYAML`.

## \[0.12.0]

### Enhancements

- [`b0d3dc0`](https://www.github.com/jbolda/covector/commit/b0d3dc0fca525a5739a25f947b0d9b3b00dd49b1) ([#334](https://www.github.com/jbolda/covector/pull/334) by [@jbolda](https://www.github.com/jbolda/covector/../../jbolda)) The `covector add` command now considers the `additionalBumpTypes` and `changeTags` configs and includes these in consideration of adding a change file.
- [`d0ad041`](https://www.github.com/jbolda/covector/commit/d0ad041b064bd99559a7fef52bb5e77b1a632756) ([#323](https://www.github.com/jbolda/covector/pull/323) by [@jbolda](https://www.github.com/jbolda/covector/../../jbolda)) Bump actions within the covector init command to the latest: actions/checkout@v4 and peter-evans/create-pull-request@v6.
- [`e2c83dc`](https://www.github.com/jbolda/covector/commit/e2c83dc5e98b9d8ddbf428af2dda32168e4df9ec) ([#318](https://www.github.com/jbolda/covector/pull/318) by [@jbolda](https://www.github.com/jbolda/covector/../../jbolda)) Add `exports` to `package.json` for improved capability and an enhanced experience when developed covector and testing locally.
- [`dda5430`](https://www.github.com/jbolda/covector/commit/dda5430e44d6dddc1946f13e5e4306a2d534e6ab) ([#337](https://www.github.com/jbolda/covector/pull/337) by [@jbolda](https://www.github.com/jbolda/covector/../../jbolda)) When there are no changes, also include a link to create a new change file.
- [`c72c060`](https://www.github.com/jbolda/covector/commit/c72c060e7d14434d946d1a481a0cc6c8e67ed229) ([#316](https://www.github.com/jbolda/covector/pull/316) by [@jbolda](https://www.github.com/jbolda/covector/../../jbolda)) Use node v20 in GitHub Action.
- [`ce43ad7`](https://www.github.com/jbolda/covector/commit/ce43ad7fd924319b544b30785217070436182d71) ([#319](https://www.github.com/jbolda/covector/pull/319) by [@jbolda](https://www.github.com/jbolda/covector/../../jbolda)) Add logger instance to allow custom loggers based on the usage context. It enables different structured logs for the CLI vs within a GitHub Action, as well as for local development and testing.
- [`24cb7c1`](https://www.github.com/jbolda/covector/commit/24cb7c1d00c7f06b908e1560db9016bc1a2c7d10) ([#335](https://www.github.com/jbolda/covector/pull/335) by [@jbolda](https://www.github.com/jbolda/covector/../../jbolda)) Use clack instead of inquirer for handling user input. The user experience is improved and the dependencies are more slim. Additionally, switch `getPublishedVersion` to `fetch:check` which provides a cleaner version check for the npm and crates registries.

### Dependencies

- Upgraded to `@covector/apply@0.10.0`
- Upgraded to `@covector/assemble@0.12.0`
- Upgraded to `@covector/changelog@0.12.0`
- Upgraded to `@covector/files@0.8.0`
- Upgraded to `@covector/command@0.8.0`

### Changes Supporting Covector Development

- [`ce43ad7`](https://www.github.com/jbolda/covector/commit/ce43ad7fd924319b544b30785217070436182d71) ([#319](https://www.github.com/jbolda/covector/pull/319) by [@jbolda](https://www.github.com/jbolda/covector/../../jbolda)) Switch to Vitest for the test runner. This improves speed and enables improved ability to update to current standards. Additionally, we use `pino-test` with the changes to the logger to more specifically check log output. Along with this, we switch multiple test fixtures to run commands that would return more standard output across OS which reduces test flakiness.

## \[0.11.0]

- [`9480736`](https://www.github.com/jbolda/covector/commit/9480736961fb92b1861938015b1be3fd53ee5355) ([#299](https://www.github.com/jbolda/covector/pull/299) by [@jbolda](https://www.github.com/jbolda/covector/../../jbolda)) Return additional `status` content from `covector` to enable posting a comment in PR providing additional context of the expected change files.
- [`9e111fc`](https://www.github.com/jbolda/covector/commit/9e111fcf2431690b8719ca493e6580a42e72c457) ([#304](https://www.github.com/jbolda/covector/pull/304) by [@jbolda](https://www.github.com/jbolda/covector/../../jbolda)) `status` command was mutating the package file representation when running the validation function. Use `cloneDeep` for the time being to work around it.
- [`9202dca`](https://www.github.com/jbolda/covector/commit/9202dca0d8d0fd114ecceb4154c58bc764b85c43) ([#307](https://www.github.com/jbolda/covector/pull/307) by [@jbolda](https://www.github.com/jbolda/covector/../../jbolda)) Pass `createContext` function from action through to changelog to enable passing specific context usable within changelogs.
- [`9480736`](https://www.github.com/jbolda/covector/commit/9480736961fb92b1861938015b1be3fd53ee5355) ([#299](https://www.github.com/jbolda/covector/pull/299) by [@jbolda](https://www.github.com/jbolda/covector/../../jbolda)) Allow running status command without logging. This allows the command to also serve more utilitarian purposes as well.

### Dependencies

- Upgraded to `@covector/changelog@0.11.0`
- Upgraded to `@covector/apply@0.9.3`
- Upgraded to `@covector/assemble@0.11.0`
- Upgraded to `@covector/files@0.7.2`
- Upgraded to `@covector/command@0.7.1`

## \[0.10.2]

### Dependencies

- Upgraded to `@covector/files@0.7.1`
- Upgraded to `@covector/apply@0.9.2`
- Upgraded to `@covector/assemble@0.10.3`
- Upgraded to `@covector/changelog@0.10.1`

## \[0.10.1]

### Dependencies

- Upgraded to `@covector/changelog@0.10.0`
- Upgraded to `@covector/files@0.7.0`
- Upgraded to `@covector/apply@0.9.1`
- Upgraded to `@covector/assemble@0.10.2`

## \[0.10.0]

### New Features

- [`54f9d7a`](https://www.github.com/jbolda/covector/commit/54f9d7ac68a28e03c46d2354f5ecfdc261f23529)([#280](https://www.github.com/jbolda/covector/pull/280)) Support built-in commands to simplify typical operations.

### Enhancements

- [`5b7ab24`](https://www.github.com/jbolda/covector/commit/5b7ab24f3e6b51743bf62711ff761f919467a207)([#274](https://www.github.com/jbolda/covector/pull/274)) Add support to Cargo's `build-dependencies` and target-specific dependencies.
- [`7156ce0`](https://www.github.com/jbolda/covector/commit/7156ce0f6e45a852461ca24a4bc8b808419777a4)([#277](https://www.github.com/jbolda/covector/pull/277)) Add change for all exact deps rolled up to handle it with the changelog deps section. Add the version number to the changelog deps section.
- [`c413eae`](https://www.github.com/jbolda/covector/commit/c413eaeab09c9ff571861c5b3b733fe36427661c)([#279](https://www.github.com/jbolda/covector/pull/279)) Allow a command to retry on failure by passing a `retries` timeout list with the command.

### Bug Fixes

- [`7156ce0`](https://www.github.com/jbolda/covector/commit/7156ce0f6e45a852461ca24a4bc8b808419777a4)([#277](https://www.github.com/jbolda/covector/pull/277)) Fix `undefined` error when dep with range was bumped.
- [`db3b43d`](https://www.github.com/jbolda/covector/commit/db3b43d4f98d8760d307303a66570fd5a165b4ec)([#273](https://www.github.com/jbolda/covector/pull/273)) Try to determine actual package name when bumping dependencies to support nicknames in the packages configuration.
- [`828818e`](https://www.github.com/jbolda/covector/commit/828818eecf14c638ef9c74e3d243c02b8162d485)([#278](https://www.github.com/jbolda/covector/pull/278)) The changelog function to pull the last version in the changelog did not properly consider headings deeper than level 1 and level 2. When a third level was added, this caused the function to return the full changelog. Search for next heading with a specific depth of 2.

### Dependencies

- Upgraded to `@covector/assemble@0.10.1`
- Upgraded to `@covector/apply@0.9.0`
- Upgraded to `@covector/files@0.6.2`
- Upgraded to `@covector/changelog@0.9.0`
- Upgraded to `@covector/command@0.7.0`

## \[0.9.0]

### Dependencies

- [`7b6201c`](https://www.github.com/jbolda/covector/commit/7b6201c2e7e0d9120610a2a882c0b4523f4ab6dc)([#264](https://www.github.com/jbolda/covector/pull/264)) Bump Typescript to v4.9, and deeply update types in the lower level functions to start.

### New Features

- [`0b33560`](https://www.github.com/jbolda/covector/commit/0b335606a4998f94ad88006ccc6cf0e7cb2538b1)([#244](https://www.github.com/jbolda/covector/pull/244)) Add changelog tags (section or category) to group different change files.

### Enhancements

- [`2ba699d`](https://www.github.com/jbolda/covector/commit/2ba699d8759d9526563a9665568c2779269ae7a5)([#243](https://www.github.com/jbolda/covector/pull/243)) Update the changelog format to fix multi-line change files and reduce commit noise.

## \[0.8.0]

- A new command `covector add` to make it easier to add a new change file.
  - [0c2faba](https://www.github.com/jbolda/covector/commit/0c2faba52163e4f0ab098e221f6007da62a27bee) covector add ([#232](https://www.github.com/jbolda/covector/pull/232)) on 2022-03-26
- Split up the main entrypoint for covector into more focused source files. Primarily an internal change. Closes #166.
  - [7ea8a50](https://www.github.com/jbolda/covector/commit/7ea8a50d4620967f3d5c7ad9afb33f6d6fc45380) split up files tests ([#238](https://www.github.com/jbolda/covector/pull/238)) on 2022-04-14
- Update multiple devDeps, semver, yargs, inquirer, and packages in our action. This is primarily internal upgrades and don't affect external APIs.
  - [18ff898](https://www.github.com/jbolda/covector/commit/18ff898a64a0f3677c55d994d22177189700204a) dep update ([#240](https://www.github.com/jbolda/covector/pull/240)) on 2022-04-16
- Updated the init script to create actions with `actions/checkout@v3` and `actions/setup-node@v3`.
  - [691d81f](https://www.github.com/jbolda/covector/commit/691d81f5d4990d3aeb5aa37d46b738e1a0e96601) effection for exec of shell ([#239](https://www.github.com/jbolda/covector/pull/239)) on 2022-12-19
- We have context about the repo when we run an `init`. We can use that context to guess on the "default" base url, and set it in the prompt.
  - [d9dbd70](https://www.github.com/jbolda/covector/commit/d9dbd7003f2b44051c5d694f1ca6f6af705b94d4) `covector init` pulls url for config ([#241](https://www.github.com/jbolda/covector/pull/241)) on 2022-05-05
- Bump inquirer and globby to highest CJS version.
  - [84eb245](https://www.github.com/jbolda/covector/commit/84eb2451d0ad0c27c10caa9c516e5d9d61cf7ce0) bump inquirer and globby to highest CJS version ([#254](https://www.github.com/jbolda/covector/pull/254)) on 2022-12-19
- Read all package files up front in rather than dependent on specific change files. This is clearer to manage, neglible performance difference, and enables dynamic bumps based on dependencies with ranges.
  - [ba6e7f1](https://www.github.com/jbolda/covector/commit/ba6e7f1c9ead622844ff1c040fffb67b925f0bcf) skip bump for range ([#257](https://www.github.com/jbolda/covector/pull/257)) on 2023-01-12
- Remove the `to-vfile` package as a dependency. This allows us to focus our file reference to our specific needs, and one less dependency to maintain. With this change, we also converted a handful of promises into generators for better compatibility and control with effection.
  - [1b33933](https://www.github.com/jbolda/covector/commit/1b33933be25094900f647527a82ddba0a08778fe) Remove vfile ([#234](https://www.github.com/jbolda/covector/pull/234)) on 2022-04-10
- Upgrade to `effection` v2. This is primarily an internal improvement, but will enable future features such as fetching from an endpoint to check if a version of a package was published. It also brings an updated dependency to gracefully shutdown windows processes.
  - [a0acf81](https://www.github.com/jbolda/covector/commit/a0acf81b2235ac142233d9c0e416d5e07af3cbb3) Effection v2 ([#227](https://www.github.com/jbolda/covector/pull/227)) on 2022-03-19
  - [a346221](https://www.github.com/jbolda/covector/commit/a346221102075e647693851fd1019d66641f8014) bump effection to latest on v2 ([#246](https://www.github.com/jbolda/covector/pull/246)) on 2022-10-26

## \[0.7.3]

- Include a copy of the license in each package.
  - Bumped due to a bump in all.
  - [fa5c061](https://www.github.com/jbolda/covector/commit/fa5c061830d181ae9a52b183441890a25e07946a) chore: add license files to packages ([#225](https://www.github.com/jbolda/covector/pull/225)) on 2021-09-24

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
