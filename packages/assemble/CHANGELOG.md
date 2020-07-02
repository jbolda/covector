# Changelog

## [0.1.0]

-   Add option to execute commands in "--dry-run" mode which will output the anticipated commands without running them and additional relevant information (such as the command pipe).
-   Allow use of any arbitrary command as defined in the configuration.
-   Allow arrays for commands and run pre/post versions of each command.
-   Pipe pkgFile to the publish commands. This let's one pull the version command (which is useful for git tags).

## [0.0.4]

-   Pass cwd down to assemble config merging. It reads package files and needs the dir.
-   Package files should be referenced based on the "nickname" as noted in the config. The name in the package file is not a unique value.
