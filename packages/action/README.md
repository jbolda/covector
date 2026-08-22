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

| input            | description                                                         | required |
| ---------------- | ------------------------------------------------------------------- | -------- |
| command          | covector cli command to run                                         | true     |
| token            | Github Token or PAT for creating releases / posting messages        | false    |
| cwd              | The directory to run covector within, defaults to `process.cwd()`.  | false    |
| dryRun           | Run in dry-run mode, logging steps without executing them.          | false    |
| comment          | Opt-in to comment on PR with context when using the status command. | false    |
| recognizeContributors | Include contributor and reviewer names within changelogs.       | false    |
| createRelease    | Opt-in to create a release on publish                               | false    |
| draftRelease     | When creating a release, set it as a draft.                         | false    |
| filterPackages   | A comma separated list (no spaces) of packages to run commands on.  | false    |
| label            | "the Github pull request label that triggers preview packages"      | false    |
| previewVersion   | Template for how the preview packages should be versioned           | false    |
| identifier       | Identifier for prerelease version template                          | false    |
| releaseCommitish | Any branch or commit SHA the release's Git tag is created from      | false    |

Note that command can also use `version-or-publish` which is an input command unique to this action. It will dynamically determine if it needs to run `version` or `publish`. If there are no changes, we assume that `version` was run last, and the changes were deleted. With that assumption, we run `publish` if there are `No changes.` and `version` if there are changes.

The action also supports the `preview` command for pull requests. It only publishes preview packages when the pull request has the label (configured by the `label` option, default: `preview`). Use `previewVersion` to choose the version template (`date` or `sha`) and `identifier` to set the prerelease identifier. Preview results can be commented on the pull request when `comment: true` is enabled.

While it is convenient to use this preview feature, not all registries handle many package versions well. For example in the npm ecosystem, we recommend using [pkg.pr.new](https://pkg.pr.new/) for more ephemeral package previews in a PR. Reserve the `preview` command to publish on commit to a release branch, for example.

### pkg.pr.new Previews

[pkg.pr.new](https://pkg.pr.new/) works great for publishing preview packages directly from a pull request. It generates installable preview URLs compatible with all of the package managers without filling a registry with prerelease versions. Use the Covector `status` output to publish only the packages changed by the pull request.

The following is a common pattern we have used with our GitHub Actions to publish a preview version.

```yaml
name: PR package previews

on: pull_request

jobs:
  covector:
    name: Covector Status
    runs-on: ubuntu-latest
    outputs:
      status: ${{ steps.covector.outputs.status }}
      packagesReadyPathsSpaced: ${{ steps.covector.outputs.packagesReadyPathsSpaced }}
    steps:
      - uses: actions/checkout@v7
        with:
          fetch-depth: 0
      - name: Covector status
        id: covector
        uses: jbolda/covector/packages/action@covector-v0
        with:
          command: status

  preview:
    name: Publish Preview Packages
    needs: covector
    if: needs.covector.outputs.status != 'No changes.'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
        with:
          fetch-depth: 0
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v6
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm run build
      - run: pnpm dlx pkg-pr-new publish ${{ needs.covector.outputs.packagesReadyPathsSpaced }}
```

The install, build, and package-manager setup steps should match your repository. `packagesReadyPathsSpaced` contains shell-safe, space-separated package paths such as `'./packages/one' './packages/two'`. See the [pkg.pr.new documentation](https://github.com/stackblitz-labs/pkg.pr.new) for supported options and the generated installation instructions.

> [!note]
> The action versions above use release tags for readability. For production workflows, pin third-party actions to full commit SHAs and review updates regularly; tools such as [zizmor](https://docs.zizmor.sh/) can identify unpinned action references.

## Outputs

See the [action.yml](./action.yml) for outputs for your use or see below.

| output                   | description                                                                                             | command                           |
| ------------------------ | ------------------------------------------------------------------------------------------------------- | --------------------------------- |
| status                   | Returns either "No changes." or a dyanmic list of packages changed.                                     | status, version, publish          |
| willPublish              | Will be set as `"true"` (stringified boolean) if the next step is to try publishing.                    | status                            |
| packagesReady            | Comma separated list of packages with changes: `covector,action`                                        | status                            |
| packagesReadyPaths       | Command separated list of paths to packages with changes: `./packages/covector,./packages/action`       | status                            |
| packagesReadySpaced      | Space separated list of packages with changes: `'covector' 'action'`                                    | status                            |
| packagesReadyPathsSpaced | Space separated list of paths to packages with changes: `'./packages/covector' './packages/action'`     | status                            |
| change                   | The changes that were applied                                                                           | version, preview                  |
| commandRan               | The command ran (particularly useful for 'version-or-publish' input option).                            | all                               |
| successfulPublish        | Boolean as a string if we published. Useful to skip follow-on steps with nothing published.             | publish, preview                  |
| packagesPublished        | Comma separated list of all of the packages that published.                                             | publish, preview                  |
| templatePipe             | A stringified key/value pair object of the `pipe` that is passed to each command.                       | status, version, publish, preview |
| releaseId                | The ID of the created release. Only present when `createRelease` is set to true.                        | publish                           |
| releaseUrl               | The URL users can navigate to in order to view the release.                                             | publish                           |
| releaseUploadUrl         | The URL for uploading assets to the release, which could be used by GitHub Actions for additional uses. | publish                           |

When `createRelease` is enabled, the action also provides per-package release outputs. Replace `*` with the sanitized package name:

| output                 | description |
| ---------------------- | ----------- |
| `*-releaseId`          | The ID of the package's created release. |
| `*-releaseUrl`         | The URL of the package's created release. |
| `*-releaseUploadUrl`   | The upload URL of the package's created release. |

Besides these static outputs, we also supply dynamic outputs for each of your packages. Replace the `*` with your package name. Note, this will not be listed in the [action.yml](./action.yml). Outputs can only alphanumeric characters, and are replaced with a dash: `-`. For example, a scoped npm package of `@covector/awesome` would be `willPublish--covector-awesome`.

| output         | description                                                                      | command |
| -------------- | -------------------------------------------------------------------------------- | ------- |
| published-\*   | Will be set as `"true"` (stringified boolean) if the package has been published. | publish |
| willPublish-\* | Will be set as `"true"` (stringified boolean) if the package will be published.  | status  |
| version-\*     | The current version number .                                                     | status  |

Outputs will generally be specified in the [action.yml](./action.yml), but since these are dynamic, it is not possible. See the [docs noting this is an optional required](https://docs.github.com/en/actions/creating-actions/metadata-syntax-for-github-actions#outputs).

> If you don't declare an output in your action metadata file, you can still set outputs and use them in a workflow.

## Comments On Forks

The action runs in a reduced-permission environment on forks which will cause an API call to add a comment to fail. To work around this, with `comment: true` specified, it will upload the comment content as an artifact to the workflow if it fails. With the following additional workflow, it will pick up that workflow completion and post the comment as `workflow_run` has normal repository permissions.

```yml
name: Covector Comment

on:
  workflow_run:
    workflows: [covector status] # the `name` of the workflow run on `pull_request` running `status` with `comment: true`
    types:
      - completed

# note all other permissions are set to none if not specified
permissions:
  # to read the action artifacts
  actions: read
  # to write the comment
  pull-requests: write
# note that these set the permissions for `secrets.GITHUB_TOKEN`
#  if you plan to use your own token, use `permissions: {}` instead
#  to completely remove all default permissions for added security

jobs:
  download:
    runs-on: ubuntu-latest
    if: github.event.workflow_run.conclusion == 'success' &&
      (github.event.workflow_run.head_repository.full_name != github.repository || github.actor == 'dependabot[bot]')
    steps:
      - name: covector status
        uses: jbolda/covector/packages/action@covector-v0
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          command: "status"
```
