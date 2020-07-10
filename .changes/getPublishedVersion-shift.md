---
"covector": patch
"@covector/command": patch
---

Shift getPublishedVersion check prior to commands running. Without this, postpublished would never run (since packages were just published and are update to date).
