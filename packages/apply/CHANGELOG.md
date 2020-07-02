# Changelog

## [0.1.0]

-   Add option to execute commands in "--dry-run" mode which will output the anticipated commands without running them and additional relevant information (such as the command pipe).
-   Apply properly checks for parents to do dep bumps.
-   Skip over packages without a path. This let's us create "virtual packages" and configure a package such as "all" that let's us easily bump everything.

## [0.0.6]

-   Package files should be referenced based on the "nickname" as noted in the config. The name in the package file is not a unique value.
