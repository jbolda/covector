---
"covector": minor
"action": minor
---

Add `modifyConfig` property that takes a function which can modify the config file that is loaded. This will likely only be used in the Github Action to inject a JavaScript function into the publish sequences which creates a Github Release.
