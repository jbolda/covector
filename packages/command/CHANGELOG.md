# Changelog

## \[0.3.2]

- Mock out full Github Release flow to help in testing the Github Action. Adjust command pipe to function to fix `undefined` being piped to Github Release body.
  - [a7e1b20](https://www.github.com/jbolda/covector/commit/a7e1b209c704829bc8cb54bd220862e627bbee01) fix: mock out full GitHub release flow ([#172](https://www.github.com/jbolda/covector/pull/172)) on 2021-03-27

## \[0.3.1]

- Add missing dependencies that likely worked due to hoisting.
  - [60e8fc7](https://www.github.com/jbolda/covector/commit/60e8fc79cef13f2a2b442d772db0d9b8b9695ceb) chore: bump devDeps and fix tsconfig/rollup issues ([#165](https://www.github.com/jbolda/covector/pull/165)) on 2021-03-24
- Pull the most recent changelog into the chain of output. This opens up piping it into the Github Release.
  - [66539a8](https://www.github.com/jbolda/covector/commit/66539a800365ccfb28f95291b066e77114863382) fix: GitHub release pipe ([#164](https://www.github.com/jbolda/covector/pull/164)) on 2021-03-24
- Split up config merge function into two functions, one for version and one for publish, et al. This makes the types easier to reason about.
  - [66539a8](https://www.github.com/jbolda/covector/commit/66539a800365ccfb28f95291b066e77114863382) fix: GitHub release pipe ([#164](https://www.github.com/jbolda/covector/pull/164)) on 2021-03-24

## \[0.3.0]

- Bump effection to stable v1.
  - [29f9734](https://www.github.com/jbolda/covector/commit/29f9734b9703c473b85608fce617ff61c5ef091c) fix: piped commands ([#159](https://www.github.com/jbolda/covector/pull/159)) on 2021-03-17
- Convert covector to typescript.
  - [cf9a893](https://www.github.com/jbolda/covector/commit/cf9a8935f244bd47b5614368865cc724f65e8980) feat: typescript covector main with rollup ([#63](https://www.github.com/jbolda/covector/pull/63)) on 2020-07-02
  - [39acdc9](https://www.github.com/jbolda/covector/commit/39acdc9edc1e2fa7e0dcffa38e658810a9b8756e) feat: convert over @covector/files to typescript with rollup \[partial] ([#65](https://www.github.com/jbolda/covector/pull/65)) on 2020-07-06
  - [1090afd](https://www.github.com/jbolda/covector/commit/1090afd46e8a7a2c2cfe9d571be744b79ded86a1) feat: typescript going green ([#153](https://www.github.com/jbolda/covector/pull/153)) on 2021-03-17
- Temporarily use execa to shell for any commands with a pipe, `|`.
  - [29f9734](https://www.github.com/jbolda/covector/commit/29f9734b9703c473b85608fce617ff61c5ef091c) fix: piped commands ([#159](https://www.github.com/jbolda/covector/pull/159)) on 2021-03-17

## \[0.2.0]

- Allow running functions as a command instead of assuming everything runs in a shell. This is mostly for internal use to be used within the Github Action.
  - [6dc90bf](https://www.github.com/jbolda/covector/commit/6dc90bfe849c4c9441afce7a26a01aabf4a2196c) feat: reorder GitHub release step ([#136](https://www.github.com/jbolda/covector/pull/136)) on 2021-02-09
- Stream command output instead of waiting for completion. This is particularly helpful when a command hangs unexpectedly (such as when it asks for input in CI).
  - [d8cfcda](https://www.github.com/jbolda/covector/commit/d8cfcdac6ef972d466acb5da3d2329426b4bd2d9) stream command output through new @effection/node version ([#124](https://www.github.com/jbolda/covector/pull/124)) on 2020-11-23

## \[0.1.0]

- Allow multiple publish sequences. Any command beginning with `publish` will invoke the related `getPublishedVersion`, e.g. `publishNPM` would look for and check `getPublishedVersionNPM`. This allows separation of concerns and re-run-ability for multiple deploy targets.
  - [ed3698d](https://www.github.com/jbolda/covector/commit/ed3698df85140dd13e98569c4266df03f8bbfc16) feat: allow multiple publishes ([#113](https://www.github.com/jbolda/covector/pull/113)) on 2020-07-19

## \[0.0.3]

- Increase default timeout and allow it to be set from config.
  - [a80e2ee](https://www.github.com/jbolda/covector/commit/a80e2eecdc21318b9dd93e9a9fe2a5441703fea5) chore: increase default timeout ([#106](https://www.github.com/jbolda/covector/pull/106)) on 2020-07-17
- The `dryRunCommand` strings would never run. Fix that they run in `--dry-run` mode.
  - [b95249e](https://www.github.com/jbolda/covector/commit/b95249e88fb9fba1b1cc85c4a8fefa633ca9fd1c) feat: allow command to run from cwd ([#108](https://www.github.com/jbolda/covector/pull/108)) on 2020-07-17
- Allow running commands from the cwd within the config.
  - [b95249e](https://www.github.com/jbolda/covector/commit/b95249e88fb9fba1b1cc85c4a8fefa633ca9fd1c) feat: allow command to run from cwd ([#108](https://www.github.com/jbolda/covector/pull/108)) on 2020-07-17

## \[0.0.2]

- Shift getPublishedVersion check prior to commands running. Without this, postpublished would never run (since packages were just published and are update to date).
  - Bumped due to a bump in covector.
  - [922d224](https://www.github.com/jbolda/covector/commit/922d224c34a4e3e2f711877fe42fddd4faba55ab) fix: getPublishedVersion check shift ([#92](https://www.github.com/jbolda/covector/pull/92)) on 2020-07-10

## \[0.0.1]

- Pull and set git meta information on change files as an array of commits. This can then be piped into changelogs.
  - Bumped due to a bump in covector.
  - [cc19486](https://www.github.com/jbolda/covector/commit/cc19486f86b78aec2c719e5dd17a2d72cbc8d450) feat: new command package and piped git info ([#78](https://www.github.com/jbolda/covector/pull/78)) on 2020-07-09
  - [de3248d](https://www.github.com/jbolda/covector/commit/de3248dfd70146392ff65e7065c2125daf527728) feat: dep bump note in changelog ([#87](https://www.github.com/jbolda/covector/pull/87)) on 2020-07-10
- Split out child_process commands into separate package.
  - Bumped due to a bump in covector.
  - [cc19486](https://www.github.com/jbolda/covector/commit/cc19486f86b78aec2c719e5dd17a2d72cbc8d450) feat: new command package and piped git info ([#78](https://www.github.com/jbolda/covector/pull/78)) on 2020-07-09
