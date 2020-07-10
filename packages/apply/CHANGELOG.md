# Changelog

## [0.2.0]

-   Note in sub-bullets when a bump was due to a dependency (and that helps note where there summary text is from as well.)
    -   [de3248d](https://www.github.com/jbolda/covector/commit/de3248dfd70146392ff65e7065c2125daf527728) feat: dep bump note in changelog ([#87](https://www.github.com/jbolda/covector/pull/87)) on 2020-07-10
-   Version commands used to only run on changes, but ignore parents. Reconfigure that we resolve the parents and run commands on both direct changes and changes through a dependency.
    -   Bumped due to a bump in covector.
    -   [3ca050c](https://www.github.com/jbolda/covector/commit/3ca050c2c51821d229209e18391535c266b6b200) feat: advanced commands ([#71](https://www.github.com/jbolda/covector/pull/71)) on 2020-07-06
-   Output versions split up which is particularly useful for git tags.
    -   [14fb40d](https://www.github.com/jbolda/covector/commit/14fb40d50891766993d7e69c0c86c2ce3ffd2a8f) feat: split versions (great for git tags) ([#77](https://www.github.com/jbolda/covector/pull/77)) on 2020-07-08

## [0.1.0]

-   Add option to execute commands in "--dry-run" mode which will output the anticipated commands without running them and additional relevant information (such as the command pipe).
-   Apply properly checks for parents to do dep bumps.
-   Skip over packages without a path. This let's us create "virtual packages" and configure a package such as "all" that let's us easily bump everything.

## [0.0.6]

-   Package files should be referenced based on the "nickname" as noted in the config. The name in the package file is not a unique value.
