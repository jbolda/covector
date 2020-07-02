# Changelog

## [0.1.0]

-   Log change file deletes after all delete operations have been completed. This provides a stable output easier for testing.

## [0.0.8]

-   Properly delete the change files in an order that is determinate.
-   Package files should be referenced based on the "nickname" as noted in the config. The name in the package file is not a unique value.

## [0.0.7]

-   We missed files in the changelog deps array so they diverged when bumped.

## [0.0.6]

-   Add ability to read and write changelogs.
