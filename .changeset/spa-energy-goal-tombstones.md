---
"@kaiord/workout-spa-editor": patch
---

Clearing an energy goal now records a tombstone filed under the profile id, so another device's older copy can no longer bring it back on the next sync. The sync merge suppresses rows by their single-field primary key, not only by `id`. Tests now cover a deleted profile's rows that a device which never saw the delete edits later: the `profiles` tombstone drops them, so the profile cascade still needs no per-row tombstones.
