---
"@covector/apply": patch
---

Packages should be read and associated with the related key in the config. Previously we would key based on the package file name which may not match the config key. They may not match as in polyglot we may have names that overlap between languages.
