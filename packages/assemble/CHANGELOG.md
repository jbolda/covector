# Changelog

## [0.2.2]

-   Pass split versions through to pipe.
    -   Bumped due to a bump in @covector/assemble.
    -   [6370826](https://www.github.com/jbolda/covector/commit/63708261d633d22ada1c7e14667b4107ea7e68c3) fix: pass split versions through to pipe ([#96](https://www.github.com/jbolda/covector/pull/96)) on 2020-07-11

## [0.2.1]

-   Assemble process was async and the pkgFile needed a proper await. Switch to a generator to yield in the loop.
    -   [1bb67ea](https://www.github.com/jbolda/covector/commit/1bb67ea671b6fbe9b21af9feb72612d166fd7662) fix: missing publish pipe ([#94](https://www.github.com/jbolda/covector/pull/94)) on 2020-07-10

## [0.2.0]

-   Note in sub-bullets when a bump was due to a dependency (and that helps note where there summary text is from as well.)
    -   [de3248d](https://www.github.com/jbolda/covector/commit/de3248dfd70146392ff65e7065c2125daf527728) feat: dep bump note in changelog ([#87](https://www.github.com/jbolda/covector/pull/87)) on 2020-07-10
-   Pull and set git meta information on change files as an array of commits. This can then be piped into changelogs.
    -   Bumped due to a bump in covector.
    -   [cc19486](https://www.github.com/jbolda/covector/commit/cc19486f86b78aec2c719e5dd17a2d72cbc8d450) feat: new command package and piped git info ([#78](https://www.github.com/jbolda/covector/pull/78)) on 2020-07-09
    -   [de3248d](https://www.github.com/jbolda/covector/commit/de3248dfd70146392ff65e7065c2125daf527728) feat: dep bump note in changelog ([#87](https://www.github.com/jbolda/covector/pull/87)) on 2020-07-10
-   Allow complex commands specified as an object. This let's one specify a dryRunCommand that is executed in --dry-run mode instead (so no accidental publishes!) or to set pipe to true that the output is returned from the main covector function. The pipe likely won't be used directly, but can be consumed within the action to create a Github Release, etc.
    -   Bumped due to a bump in covector.
    -   [3ca050c](https://www.github.com/jbolda/covector/commit/3ca050c2c51821d229209e18391535c266b6b200) feat: advanced commands ([#71](https://www.github.com/jbolda/covector/pull/71)) on 2020-07-06
-   Version commands used to only run on changes, but ignore parents. Reconfigure that we resolve the parents and run commands on both direct changes and changes through a dependency.
    -   Bumped due to a bump in covector.
    -   [3ca050c](https://www.github.com/jbolda/covector/commit/3ca050c2c51821d229209e18391535c266b6b200) feat: advanced commands ([#71](https://www.github.com/jbolda/covector/pull/71)) on 2020-07-06
-   Add config option to specify an asset that is uploaded on publish to the Github Release.
    -   [3f6e0b3](https://www.github.com/jbolda/covector/commit/3f6e0b335e88ebd07186ebeec57d4f438a274e1f) feat: add config option to specify assets to upload at publish ([#86](https://www.github.com/jbolda/covector/pull/86)) on 2020-07-10

## [0.1.0]

-   Add option to execute commands in "--dry-run" mode which will output the anticipated commands without running them and additional relevant information (such as the command pipe).
-   Allow use of any arbitrary command as defined in the configuration.
-   Allow arrays for commands and run pre/post versions of each command.
-   Pipe pkgFile to the publish commands. This let's one pull the version command (which is useful for git tags).

## [0.0.4]

-   Pass cwd down to assemble config merging. It reads package files and needs the dir.
-   Package files should be referenced based on the "nickname" as noted in the config. The name in the package file is not a unique value.
