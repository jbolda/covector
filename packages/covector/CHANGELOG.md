# Changelog

## [0.1.1]

-   We were missing a yield on getPublishedVersion which was meaning everything would always try to publish.

## [0.1.0]

-   Add option to execute commands in "--dry-run" mode which will output the anticipated commands without running them and additional relevant information (such as the command pipe).
-   Allow use of any arbitrary command as defined in the configuration.
-   Allow arrays for commands and run pre/post versions of each command.

## [0.0.17]

-   Temporarily switch to execa for covector as it properly deals with piped and errors.

## [0.0.16]

Bumped due to dependency.

## [0.0.15]

-   Add ability to read and write changelogs.
