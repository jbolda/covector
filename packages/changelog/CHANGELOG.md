# Changelog

## [0.2.0]

-   Pipe git info into changelog using sub-bullet points for each commit it was involved in.
    -   [cc19486](https://www.github.com/jbolda/covector/commit/cc19486f86b78aec2c719e5dd17a2d72cbc8d450) feat: new command package and piped git info ([#78](https://www.github.com/jbolda/covector/pull/78)) on 2020-07-09
    -   [de3248d](https://www.github.com/jbolda/covector/commit/de3248dfd70146392ff65e7065c2125daf527728) feat: dep bump note in changelog ([#87](https://www.github.com/jbolda/covector/pull/87)) on 2020-07-10
-   Note in sub-bullets when a bump was due to a dependency (and that helps note where there summary text is from as well.)
    -   [de3248d](https://www.github.com/jbolda/covector/commit/de3248dfd70146392ff65e7065c2125daf527728) feat: dep bump note in changelog ([#87](https://www.github.com/jbolda/covector/pull/87)) on 2020-07-10
-   Allow complex commands specified as an object. This let's one specify a dryRunCommand that is executed in --dry-run mode instead (so no accidental publishes!) or to set pipe to true that the output is returned from the main covector function. The pipe likely won't be used directly, but can be consumed within the action to create a Github Release, etc.
    -   Bumped due to a bump in covector.
    -   [3ca050c](https://www.github.com/jbolda/covector/commit/3ca050c2c51821d229209e18391535c266b6b200) feat: advanced commands ([#71](https://www.github.com/jbolda/covector/pull/71)) on 2020-07-06

## [0.1.0]

-   Add option to execute commands in "--dry-run" mode which will output the anticipated commands without running them and additional relevant information (such as the command pipe).
-   Skip over packages without a path. This let's us create "virtual packages" and configure a package such as "all" that let's us easily bump everything.

## [0.0.3]

Bumped due to dependency.

## [0.0.2]

-   We missed files in the changelog deps array so they diverged when bumped.
