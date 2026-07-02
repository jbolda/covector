---
"@covector/files": patch
---

Handle Cargo dependencies declared with `{ workspace = true }` or as path-only (`{ path = "../pkg" }`): read them as version-less instead of throwing, and leave their declarations untouched when bumping dependent packages.
