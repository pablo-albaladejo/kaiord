---
"@kaiord/workout-spa-editor": minor
---

Persistent coaching integration: link Train2Go to a Kaiord profile.

Coaching activities (Train2Go today, future TrainingPeaks/etc.) are now
persisted in IndexedDB scoped per Kaiord profile, survive reload, and
auto-sync on calendar mount and week change with a 10-minute staleness gate.
Each profile carries its own `linkedAccounts: LinkedCoachingAccount[]` so
multi-profile users can link different platforms per profile.

Connect / disconnect lives in **Profile Settings → Linked Accounts**, not on
the calendar. The Sync button only appears for sources linked to the active
profile. Click on a coaching card opens a dialog with description and a
"Convert to workout" action that creates an editable raw `WorkoutRecord`
(idempotent within a profile, distinct between profiles via namespaced
`sourceId`).

Includes a Dexie v4 migration that adds `coachingActivities` and
`coachingSyncState` tables and backfills `linkedAccounts: []` on existing
profiles. Bridge-discovery `syncState` is unchanged byte-identically.
Telemetry events emitted at the application boundary; payloads are PII-free.
