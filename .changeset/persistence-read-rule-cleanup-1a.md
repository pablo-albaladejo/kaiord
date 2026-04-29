---
"@kaiord/workout-spa-editor": none
---

chore(spa-editor): foundation for profile state migration to Dexie + useLiveQuery

Phase 1A of `persistence-read-rule-cleanup` (`#385` cleanup). No user-visible behavior change.

- Adds `transaction<T>` to `PersistencePort`; Dexie adapter delegates to `db.transaction("rw", db.tables, fn)`; in-memory adapter implements snapshot/revert.
- Adds 3 live read hooks (`useProfilesLive`, `useProfileByIdLive`, `useActiveProfileLive`) — the latter is a single composed `useLiveQuery` that joins `meta.activeProfileId` with `profiles.get(id)` for atomic same-tab reads.
- Adds 9 profile application use cases under `application/profile/` (4 CRUD + 5 zone variants); helpers relocated from `store/profile-store/helpers/` to `application/profile/helpers/`.
- Migrates 4 lower-risk read sites (`ProfileEditView`, `LayoutHeader`, `TargetPicker`, `ZoneIndicator`) to the new live hooks; legacy `useProfileStore` continues to back the 4 high-risk sites until Phase 1B.
- Captures pre-1B perf baseline at `src/__perf__/profile-state-baseline.json` for the Phase 1B `≤ 2× pre` gate.
