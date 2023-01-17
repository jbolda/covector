---
"@covector/assemble": patch
---

When collecting `git log` metadata for change files, running it in parallel caused occasional no-op which increasingly became more flaky with more files. Adjust this to run it serially which should be a neglible difference.
