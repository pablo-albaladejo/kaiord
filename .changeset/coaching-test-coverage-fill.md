---
"@kaiord/workout-spa-editor": patch
---

test: close 6 coaching test gaps from train2go-profile-link verify report

Adds 6 surgical test assertions for previously-untested coaching invariants:
manual-sync bypass of the staleness gate, coachingActivities row preservation
on convert, useCoachingConvert navigation + onClose, profile-switch reactivity
on the calendar header, lossless userId at the JSON parse boundary, and
abort-mid-poll for attemptLink. Tests-only — no production code changes.
