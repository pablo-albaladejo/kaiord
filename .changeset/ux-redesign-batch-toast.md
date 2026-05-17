---
"@kaiord/workout-spa-editor": patch
---

UX redesign Phase 1 leftover: surface a success toast when a batch
of raw workouts finishes processing. `useBatchRunner` gains an
optional `onSuccess(count)` callback that fires only when the
`processBatch` await resolves cleanly — cancellation and errors
short-circuit through the existing `catch` so no toast appears in
those paths. `useBatchState` wires `useToastContext().success` to
the callback with a static `"Batch processed"` title and a
`"${count} workouts"` description (R-PIIInterpolation compliant —
the title is a bare literal; the dynamic count flows through the
description field). Removes the "did anything happen?" dead-end on
the calendar's batch-process flow identified in the deep-dive trace.
