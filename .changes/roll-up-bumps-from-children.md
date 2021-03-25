---
"@covector/assemble": patch
---

Roll up bumps from children recursively to bump parents unlimited levels deep. These bumps are done as a `patch` bump as they are automatic. Any parent bumps that would result in a `minor` or `major` change will likely include breaking changes in the package itself. This would imply that a specific change file would be included for it as well, as opposed to relying on a bump from a child.
