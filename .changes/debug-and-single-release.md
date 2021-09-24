---
"action": patch
---

The action created a release for any `publish` keys in `pkgManger`, but didn't do it for anything specified in `packages`. This meant that if you elected not to use `pkgManager`, it would not create a release. This has been fixed and it will now create a release. We also added some debug output to improve the debugging experience.
