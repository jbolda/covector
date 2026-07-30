---
"@covector/files": patch
---

Read the version off `[workspace.package]` when a Cargo manifest inherits it, matching the existing write support. Applying a bump to a crate whose version is declared at the workspace root previously left the manifest unchanged.
