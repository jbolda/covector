# Covector Github Action

To use, add this action to your github workflow.

```yml
- name: covector version or publish
  uses: jbolda/covector/packages/action@covector-v0
  id: covector
  with:
    command: "version-or-publish"
```

## Inputs

See the [action.yml](./action.yml) for inputs to specify or see below.

| input          | description                                                        | required |
| -------------- | ------------------------------------------------------------------ | -------- |
| command        | covector cli command to run                                        | true     |
| token          | Github Token or PAT for creating releases / posting messages       | false    |
| cwd            | The directory to run covector within, defaults to `process.cwd()`. | false    |
| createRelease  | Opt-in to create a release on publish                              | false    |
| draftRelease   | When creating a release, set it as a draft.                        | false    |
| filterPackages | A comma separated list (no spaces) of packages to run commands on. | false    |
| label          | "the Github pull request label that triggers preview packages"     | false    |
| previewVersion | Template for how the preview packages should be versioned          | false    |
| identifier     | Identifier for prerelease version template                         | false    |

Note that command can also use `version-or-publish` which is an input command unique to this action. It will dynamically determine if it needs to run `version` or `publish`. If there are no changes, we assume that `version` was run last, and the changes were deleted. With that assumption, we run `publish` if there are `No changes.` and `version` if there are changes.

## Outputs

See the [action.yml](./action.yml) for outputs for your use or see below.

| output            | description                                                                                 | command                           |
| ----------------- | ------------------------------------------------------------------------------------------- | --------------------------------- |
| status            | Returns either "No changes." or a dyanmic list of packages changed.                         | status, version, publish          |
| change            | The changes that were applied                                                               | version, preview                  |
| commandRan        | The command ran (particularly useful for 'version-or-publish' input option).                | all                               |
| successfulPublish | Boolean as a string if we published. Useful to skip follow-on steps with nothing published. | publish, preview                  |
| packagesPublished | Comma separated list of all of the packages that published.                                 | publish, preview                  |
| templatePipe      | A stringified key/value pair object of the `pipe` that is passed to each command.           | status, version, publish, preview |

Besides these static outputs, we also supply dynamic outputs for each of your packages. Replace the `*` with your package name. Note, this will not be listed in the [action.yml](./action.yml).

| output       | description                                                                      | command |
| ------------ | -------------------------------------------------------------------------------- | ------- |
| published-\* | Will be set as `"true"` (stringified boolean) if the package has been published. | publish |

