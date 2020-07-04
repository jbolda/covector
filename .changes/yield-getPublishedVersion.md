---
"covector": patch
---

We were missing a `yield` on getPublishedVersion which was meaning everything would always try to publish.
