---
"@kaiord/workout-spa-editor": patch
---

Manual sleep entry now records hours slept. The wellness dialog asks for hours (h:mm), an optional score, and an optional bedtime and wake time:

- A score on its own is stored without a duration. It was previously stored as a 0 h 0 min night.
- Older entries saved that way now read "Duration not recorded".
- The chat tool stores its sleep value as hours slept.

The Daily readiness rationale now names only the inputs it used, and says when the sleep score was entered by hand. The Sleep, Weight, Recovery and Activity pages each have an "Add data" action that opens the dialog on that metric. Their date windows now use the local calendar day.
