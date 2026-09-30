---
"@kaiord/ai": patch
---

A chat action-tool call whose input fails the tool's schema is no longer offered for confirmation. The SDK already answers such a call with a tool error and continues the loop, so `runTurn` drops it and the turn pauses on the last valid action call instead.
