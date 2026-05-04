---
"@kaiord/workout-spa-editor": minor
---

Schema bump for the upcoming zone-method-aware reconcile (PR 1 of 6 of `zones-method-aware-reconcile`).

**No reconcile/UI behavior changes in this PR.** The new schema field stays unread and the migrated `method` values stay opaque to the existing reconcile until PR 2 ships the classifier.

**Changes:**

- `LinkedCoachingAccount` schema gains `lastSyncedZonesSnapshot?: LastSyncedZonesSnapshot` — captures the post-mapper Kaiord-domain zone arrays + threshold scalars from the most recent successful T2G sync. Used by the upcoming classifier (PR 2) to detect "user edited zones since last sync" without per-zone tracking.
- Dexie schema bumps to v9. `applyV9Upgrade` runs at db-open time on every existing profile and applies two row-level mutations (per design D-MA7):
  1. Normalize `method = "manual"` (introduced by sync-zones-band-writes in the prior `train2go-zones-sync-full-bands` change) → `"custom"`. The `"manual"` value didn't fit the existing vocabulary.
  2. Conservatively reclassify `method = "custom"` AND zones-clearly-not-defaults → `method = "user"`. False-negatives produce conflicts on next sync (handled by the upcoming new dialog gracefully); false-positives produce conflicts forever (avoided).

**Rollback safety:** IndexedDB doesn't permit version downgrade; "rollback" means deploying old JS bundle while the user's local DB stays at v9. Old code reading the v9-migrated profile encounters `method = "user"` (opaque to old reconcile) and `lastSyncedZonesSnapshot` (Zod `.optional()`, ignored). Pinned by `dexie-v9-rollback.test.ts` — frozen v8 reconcile against a v9-migrated profile produces identical applied/conflicts as the v8-state baseline. **No silent data loss.**

Test additions: 18 new cases (10 forward migration + 8 `hasUserData` heuristic + 3 rollback regression).
