# Changelog

## [0.2.1]

-   Add a validation guardrail within the `status` command. This will run a nearly identical version application function. It can catch an error during the PR process rather than during the versioning process.
    -   [4437766](https://www.github.com/jbolda/covector/commit/44377667fe7c64207bc84140fb4954b23dc4424f) feat: version bump guardrail ([#137](https://www.github.com/jbolda/covector/pull/137)) on 2021-02-10

## [0.2.0]

-   Change files were being deleted too quickly for git info to be retrieved. Shift to end of sequence.
    -   Bumped due to a bump in covector.
    -   [85bff4b](https://www.github.com/jbolda/covector/commit/85bff4b146d59a5bc4a093f3e7610d22876d7d0e) fix: delay change file deletion for git info retrieval ([#82](https://www.github.com/jbolda/covector/pull/82)) on 2020-07-09
-   Pull and set git meta information on change files as an array of commits. This can then be piped into changelogs.
    -   Bumped due to a bump in covector.
    -   [cc19486](https://www.github.com/jbolda/covector/commit/cc19486f86b78aec2c719e5dd17a2d72cbc8d450) feat: new command package and piped git info ([#78](https://www.github.com/jbolda/covector/pull/78)) on 2020-07-09
    -   [de3248d](https://www.github.com/jbolda/covector/commit/de3248dfd70146392ff65e7065c2125daf527728) feat: dep bump note in changelog ([#87](https://www.github.com/jbolda/covector/pull/87)) on 2020-07-10
-   Output versions split up which is particularly useful for git tags.
    -   [14fb40d](https://www.github.com/jbolda/covector/commit/14fb40d50891766993d7e69c0c86c2ce3ffd2a8f) feat: split versions (great for git tags) ([#77](https://www.github.com/jbolda/covector/pull/77)) on 2020-07-08

## [0.1.0]

-   Log change file deletes after all delete operations have been completed. This provides a stable output easier for testing.

## [0.0.8]

-   Properly delete the change files in an order that is determinate.
-   Package files should be referenced based on the "nickname" as noted in the config. The name in the package file is not a unique value.

## [0.0.7]

-   We missed files in the changelog deps array so they diverged when bumped.

## [0.0.6]

-   Add ability to read and write changelogs.
