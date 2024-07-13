---
"covector": patch:bug
"action": patch:bug
---

Missed some logger function which were improperly passed an non-message object. If rendering an object, it requires `msg` and `renderAsYAML`.
