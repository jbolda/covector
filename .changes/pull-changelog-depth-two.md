---
"covector": patch:bug
"@covector/changelog": patch:bug
---

The changelog function to pull the last version in the changelog did not properly consider headings deeper than level 1 and level 2. When a third level was added, this caused the function to return the full changelog. Search for next heading with a specific depth of 2.
