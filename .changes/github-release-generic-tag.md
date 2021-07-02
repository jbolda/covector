---
"@covector/assemble": patch
---

The ability to adjust the Github Release git tag was previously added, and the fallback used only worked for JavaScript packages. This fix uses the package nickname instead which will work for any package manager.
