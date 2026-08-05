---
"@covector/apply": patch:bug
"@covector/assemble": patch:bug
"@covector/changelog": patch:bug
"@covector/command": patch:bug
"@covector/files": patch:bug
---

Restrict published tarballs to the built `dist/` output. Internal packages were publishing without `dist/` because the root `.gitignore` excludes it and no `files` field overrode that so `tsdown` used the `.gitignore`.
