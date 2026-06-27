---
"@covector/changelog": minor:deps
---

Removed unified toolchain. We are mostly inserting or inspecting the first entry in the changelog. This should be safer to insert and not have to worry about a breaking change shifting the whole changelog.
