---
"covector": minor
"@covector/assemble": minor
"@covector/changelog": minor
---

Allow complex commands specified as an object. This let's one specify a `dryRunCommand` that is executed in `--dry-run` mode instead (so no accidental publishes!) or to set `pipe` to `true` that the output is returned from the main covector function. The pipe likely won't be used directly, but can be consumed within the action to create a Github Release, etc.
