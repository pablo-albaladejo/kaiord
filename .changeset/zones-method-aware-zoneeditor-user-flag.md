---
"@kaiord/workout-spa-editor": patch
---

ZoneEditor manual band edits now flip `method = "user"` (PR 3 of 6 of `zones-method-aware-reconcile`).

When the user edits any zone band via the Profile Manager `ZoneEditor`, the corresponding `<sport>.<kind>.method` is updated to `"user"` as part of the persistence write. Subsequent T2G syncs treat that table as `user-customized` (per the classifier in PR 2) and emit per-band conflicts rather than silent-replacing.

The dropdown's formula-recompute pathway (`setZoneMethod`) is unchanged — it preserves the chosen method id (`"karvonen-5"`, `"coggan-7"`, etc.) so formula-derived zones stay classifiable as `method-derived`.

`updateSportZones` use case is the manual-band-edit signal; `setZoneMethod` is the dropdown signal. The two pathways are now semantically distinct per design D-MA3 of zones-method-aware-reconcile.

Test coverage: 4 new cases (4.3a-d) in `zones.test.ts` covering: train2go → user, custom → user, setZoneMethod stays formula, formula → user on band edit. Total 3261 tests pass (3257 → 3261).
