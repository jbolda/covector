---
"covector": housekeeping
"@covector/apply": housekeeping
"@covector/assemble": housekeeping
"@covector/changelog": housekeeping
"@covector/files": housekeeping
"@covector/command": housekeeping
"@covector/toml": housekeeping
"@covector/types": housekeeping
"action": housekeeping
---

Switch to Vitest for the test runner. This improves speed and enables improved ability to update to current standards. Additionally, we use `pino-test` with the changes to the logger to more specifically check log output. Along with this, we switch multiple test fixtures to run commands that would return more standard output across OS which reduces test flakiness.
