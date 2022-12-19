---
"@covector/command": minor
---

Remove `execa` as the command runner. We still attempt to handle of some the backward compatibility that can eventually be deprecated (such as the pipe defaulting to using a shell), but it enables more control over how the runner executes commands (or fails the commands).
