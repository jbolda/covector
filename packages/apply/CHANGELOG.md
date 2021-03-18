# Changelog

## \[0.3.0]

- Convert covector to typescript.
  - [cf9a893](https://www.github.com/jbolda/covector/commit/cf9a8935f244bd47b5614368865cc724f65e8980) feat: typescript covector main with rollup ([#63](https://www.github.com/jbolda/covector/pull/63)) on 2020-07-02
  - [39acdc9](https://www.github.com/jbolda/covector/commit/39acdc9edc1e2fa7e0dcffa38e658810a9b8756e) feat: convert over @covector/files to typescript with rollup \[partial] ([#65](https://www.github.com/jbolda/covector/pull/65)) on 2020-07-06
  - [1090afd](https://www.github.com/jbolda/covector/commit/1090afd46e8a7a2c2cfe9d571be744b79ded86a1) feat: typescript going green ([#153](https://www.github.com/jbolda/covector/pull/153)) on 2021-03-17

## \[0.2.3]

- Fix additional bump types to be a no-op bump.
  - [15431f0](https://www.github.com/jbolda/covector/commit/15431f0661a30c8cb336194e39709147bfbd1aea) fix: additional bump type is no-op ([#149](https://www.github.com/jbolda/covector/pull/149)) on 2021-02-22

## \[0.2.2]

- Add missing workspace dependencies. These were likely only functioning due to hoisting.
  - [948ca7c](https://www.github.com/jbolda/covector/commit/948ca7ca7f6332abb6ffd13ff68d21560f275b57) feat: init command ([#139](https://www.github.com/jbolda/covector/pull/139)) on 2021-02-12
- Add a validation guardrail within the `status` command. This will run a nearly identical version application function. It can catch an error during the PR process rather than during the versioning process.
  - [4437766](https://www.github.com/jbolda/covector/commit/44377667fe7c64207bc84140fb4954b23dc4424f) feat: version bump guardrail ([#137](https://www.github.com/jbolda/covector/pull/137)) on 2021-02-10

## \[0.2.1]

- Deep clone changes that are getting passed into the changelog. We were editing references and those edits were showing up in erroneous places.
  - [38fba3c](https://www.github.com/jbolda/covector/commit/38fba3c6791154f335dde10740cde6ad556b6ef3) fix: deepclone change entries to prevent referencial edits ([#109](https://www.github.com/jbolda/covector/pull/109)) on 2020-07-17

## \[0.2.0]

- Note in sub-bullets when a bump was due to a dependency (and that helps note where there summary text is from as well.)
  - [de3248d](https://www.github.com/jbolda/covector/commit/de3248dfd70146392ff65e7065c2125daf527728) feat: dep bump note in changelog ([#87](https://www.github.com/jbolda/covector/pull/87)) on 2020-07-10
- Version commands used to only run on changes, but ignore parents. Reconfigure that we resolve the parents and run commands on both direct changes and changes through a dependency.
  - Bumped due to a bump in covector.
  - [3ca050c](https://www.github.com/jbolda/covector/commit/3ca050c2c51821d229209e18391535c266b6b200) feat: advanced commands ([#71](https://www.github.com/jbolda/covector/pull/71)) on 2020-07-06
- Output versions split up which is particularly useful for git tags.
  - [14fb40d](https://www.github.com/jbolda/covector/commit/14fb40d50891766993d7e69c0c86c2ce3ffd2a8f) feat: split versions (great for git tags) ([#77](https://www.github.com/jbolda/covector/pull/77)) on 2020-07-08

## \[0.1.0]

- Add option to execute commands in "--dry-run" mode which will output the anticipated commands without running them and additional relevant information (such as the command pipe).
- Apply properly checks for parents to do dep bumps.
- Skip over packages without a path. This let's us create "virtual packages" and configure a package such as "all" that let's us easily bump everything.

## \[0.0.6]

- Package files should be referenced based on the "nickname" as noted in the config. The name in the package file is not a unique value.
