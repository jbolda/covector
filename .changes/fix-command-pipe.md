---
"@covector/assemble": patch
---

Assemble process was async and the pkgFile needed a proper await. Switch to a generator to `yield` in the loop.
