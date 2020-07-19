# Changelog

## [0.1.0]

-   Allow multiple publish sequences. Any command beginning with `publish` will invoke the related `getPublishedVersion`, e.g. `publishNPM` would look for and check `getPublishedVersionNPM`. This allows separation of concerns and re-run-ability for multiple deploy targets.
    -   [ed3698d](https://www.github.com/jbolda/covector/commit/ed3698df85140dd13e98569c4266df03f8bbfc16) feat: allow multiple publishes ([#113](https://www.github.com/jbolda/covector/pull/113)) on 2020-07-19

## [0.0.3]

-   Increase default timeout and allow it to be set from config.
    -   [a80e2ee](https://www.github.com/jbolda/covector/commit/a80e2eecdc21318b9dd93e9a9fe2a5441703fea5) chore: increase default timeout ([#106](https://www.github.com/jbolda/covector/pull/106)) on 2020-07-17
-   The `dryRunCommand` strings would never run. Fix that they run in `--dry-run` mode.
    -   [b95249e](https://www.github.com/jbolda/covector/commit/b95249e88fb9fba1b1cc85c4a8fefa633ca9fd1c) feat: allow command to run from cwd ([#108](https://www.github.com/jbolda/covector/pull/108)) on 2020-07-17
-   Allow running commands from the cwd within the config.
    -   [b95249e](https://www.github.com/jbolda/covector/commit/b95249e88fb9fba1b1cc85c4a8fefa633ca9fd1c) feat: allow command to run from cwd ([#108](https://www.github.com/jbolda/covector/pull/108)) on 2020-07-17

## [0.0.2]

-   Shift getPublishedVersion check prior to commands running. Without this, postpublished would never run (since packages were just published and are update to date).
    -   Bumped due to a bump in covector.
    -   [922d224](https://www.github.com/jbolda/covector/commit/922d224c34a4e3e2f711877fe42fddd4faba55ab) fix: getPublishedVersion check shift ([#92](https://www.github.com/jbolda/covector/pull/92)) on 2020-07-10

## [0.0.1]

-   Pull and set git meta information on change files as an array of commits. This can then be piped into changelogs.
    -   Bumped due to a bump in covector.
    -   [cc19486](https://www.github.com/jbolda/covector/commit/cc19486f86b78aec2c719e5dd17a2d72cbc8d450) feat: new command package and piped git info ([#78](https://www.github.com/jbolda/covector/pull/78)) on 2020-07-09
    -   [de3248d](https://www.github.com/jbolda/covector/commit/de3248dfd70146392ff65e7065c2125daf527728) feat: dep bump note in changelog ([#87](https://www.github.com/jbolda/covector/pull/87)) on 2020-07-10
-   Split out child_process commands into separate package.
    -   Bumped due to a bump in covector.
    -   [cc19486](https://www.github.com/jbolda/covector/commit/cc19486f86b78aec2c719e5dd17a2d72cbc8d450) feat: new command package and piped git info ([#78](https://www.github.com/jbolda/covector/pull/78)) on 2020-07-09
