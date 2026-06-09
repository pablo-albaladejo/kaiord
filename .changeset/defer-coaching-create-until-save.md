---
"@kaiord/workout-spa-editor": minor
---

Coaching "Edit manually" defers persistence until Save (+ AI sport fix + junk cleanup)

Clicking "Edit manually" on a coaching activity no longer eagerly persists a
workout: it opens a store-only draft editor (`/workout/new?coaching=…`, mirroring
the scratch flow) and the workout + its SessionMatch are written only on an
explicit Save. Leaving without saving persists nothing. If a workout already
exists for the activity, the existing one opens instead (idempotency).

Also: the AI "expand with AI" path now resolves the Train2Go sport before
prompting the model and force-sets the resolved sport/subSport, so both
`record.sport` and the KRD sport carry the real sport (cycling/training/…) instead
of collapsing to `generic`. The shared builder now sets `record.sport` from the
resolved sport for the manual path too.

A one-time, guarded maintenance pass removes the untouched 1-step template
workouts (and their orphaned session matches) left behind by earlier eager
"Edit manually" clicks, matched by step shape + `modifiedAt===null` +
`createdAt===updatedAt` so no user-edited workout is ever removed.
