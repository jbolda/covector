---
"@covector/apply": minor
---

`catalog:` references in package.json are left untouched during dependency bumps: pnpm rewrites them at publish time from the catalog tables in pnpm-workspace.yaml, and previously they were corrupted to a bare major version.
