---
"@kaiord/workout-spa-editor": minor
---

feat(spa-editor): Data Flows section in ProfileManager

Adds the user-facing Data Flows configuration UI under ProfileManager.
Grouped by managed data type (9 groups), each with Sources / Destinations
subsections, [+ Add] affordances filtered by bridge capability tokens, and
per-row mode + enabled controls. Zero-state banner when no policies exist.
N-bridge ready: each subsection accepts arbitrarily many policy rows.

PR 6 of 7.
