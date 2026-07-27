---
"@covector/apply": patch
---

Leave a dependency requirement that spans a range or floats alone instead of collapsing it onto the bumped version. A comparator range (`>=1.0 <2`), a wildcard (`1.x`), and `*` already cover the bumped version, and were previously narrowed to a single pin — `">=1.0 <2"` became `"=1.1"`. This covers requirements written behind the pnpm workspace protocol prefix (`workspace:1.x`) as well as plain ones.
