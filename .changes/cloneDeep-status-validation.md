---
"covector": patch
---

`status` command was mutating the package file representation when running the validation function. Use `cloneDeep` for the time being to work around it.
