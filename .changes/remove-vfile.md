---
"covector": minor
"@covector/apply": minor
"@covector/assemble": minor
"@covector/changelog": minor
"@covector/files": minor
"@covector/types": minor
"action": minor
---

Remove the `to-vfile` package as a dependency. This allows us to focus our file reference to our specific needs, and one less dependency to maintain. With this change, we also converted a handful of promises into generators for better compatibility and control with effection.
