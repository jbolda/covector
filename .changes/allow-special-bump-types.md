---
"@covector/assemble": patch
---

Throw a hard error on an invalid bump types. If you specify something other than `major`, `minor`, or `patch`. You will receive an error in the `status` and `version` commands. Also adds a new config option, `additionalBumpTypes`, which allows specifying other bump types (that are ignored in versioning) but do not throw an error. This allows one to always require a change file even if the code does not require a version bump. This is generally easier to enforce then conditionally requiring a change file.
