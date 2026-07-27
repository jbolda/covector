---
"@covector/apply": patch
---

Skip dependencies declared without a version of their own in a cargo `[target]` table, such as `{ workspace = true }` or a path-only entry. Bumping a package that another crate depends on through a target table previously threw.
