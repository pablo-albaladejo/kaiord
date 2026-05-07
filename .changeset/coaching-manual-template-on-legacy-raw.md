---
"@kaiord/workout-spa-editor": patch
---

Fix coaching dialog "Edit manually" landing on "This workout has no structured data yet".

When the coaching activity already had a workout from the legacy `convertCoachingActivity` path (state=raw, krd=null), `handleExistingManualWorkout` returned the existing id without populating its KRD. The editor then short-circuited to `EditorNoData`. The handler now detects the empty-krd case, writes the warmup template KRD, and transitions the workout to `state="structured"` so the editor renders a step the user can edit.
