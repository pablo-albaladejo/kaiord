---
"@kaiord/workout-spa-editor": patch
---

When a reply that follows a confirmed chat action is stopped or times out, the history replayed to the model now names the actions that already ran in that turn (and which failed), by tool name only. The assistant no longer offers to repeat an action it already carried out. Nothing shown in the transcript changes.
