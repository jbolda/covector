---
"covector": patch
"@covector/apply": patch
"@covector/assemble": patch
"@covector/files": patch
---

Implement `errorOnVersionRange` which allows one to set a range which, when satisfied, will fail a `covector status` or `covector version`. This guardrail can help prevent a package from accidentally being bumped to the next major version.
