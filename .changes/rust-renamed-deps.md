---
"@covector/files": patch
"@covector/apply": patch
---

Bump the requirement of a Cargo dependency declared under an alias. A dependency renamed with `package`, such as `ffi = { package = "javascriptcore-rs-sys", version = "1.1" }`, keeps its requirement under the alias, and covector only matched dependencies by their table key, so the crate's own version moved while the requirement pointing at it stayed behind. The alias is now found through `package` in `[dependencies]`, `[dev-dependencies]`, `[build-dependencies]`, `[target.*.dependencies]`, and a workspace root's `[workspace.dependencies]`.
