---
"covector": patch
"@covector/command": minor
"@covector/assemble": minor
---

Allow multiple publish sequences. Any command beginning with `publish` will invoke the related `getPublishedVersion`, e.g. `publishNPM` would look for and check `getPublishedVersionNPM`. This allows separation of concerns and re-run-ability for multiple deploy targets.
