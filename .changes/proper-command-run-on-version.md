---
"covector": patch
"@covector/apply": patch
"@covector/assemble": patch
---

Version commands used to only run on changes, but ignore parents. Reconfigure that we resolve the parents and run commands on both direct changes and changes through a dependency.
