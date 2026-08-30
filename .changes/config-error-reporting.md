---
"@covector/files": patch
---

Report the underlying error when loading `config.json` fails for a reason other than schema validation. A JSON syntax error, or an error thrown while a schema transform resolves a package `path`, was passed to a helper that only accepts a `ZodError` and surfaced as `Invalid zodError param; expected instance of ZodError` instead of the actual problem.
