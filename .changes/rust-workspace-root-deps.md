---
"@covector/apply": minor
"@covector/files": minor
---

Bump version requirements for member crates declared in a cargo workspace root manifest's `[workspace.dependencies]` table. Requirements keep their form (partial pins stay partial, range prefixes are preserved), while path-only entries, `*` requirements, and comparator or wildcard ranges (`>=1.2, <2`, `1.*`) are left untouched.
