---
"covector": housekeeping:internal
"@covector/apply": housekeeping:internal
"@covector/assemble": housekeeping:internal
"@covector/changelog": housekeeping:internal
"@covector/files": housekeeping:internal
"@covector/command": housekeeping:internal
"@covector/toml": housekeeping:internal
"@covector/types": housekeeping:internal
"action": housekeeping:internal
---

Switch to Vitest for the test runner. This improves speed and enables improved ability to update to current standards. Additionally, we use `pino-test` with the changes to the logger to more specifically check log output. Along with this, we switch multiple test fixtures to run commands that would return more standard output across OS which reduces test flakiness.
