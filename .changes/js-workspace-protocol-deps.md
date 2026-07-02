---
"@covector/apply": patch
---

Leave pnpm/yarn `workspace:*` (and `workspace:^` / `workspace:~`) dependency declarations untouched when bumping dependent packages instead of rewriting them to a bare major version; a declaration with an embedded range like `workspace:^1.2.3` keeps the protocol prefix and bumps the range within it.
