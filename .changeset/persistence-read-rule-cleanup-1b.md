---
"@kaiord/workout-spa-editor": patch
---

fix(spa-editor): migrate profile state to Dexie + useLiveQuery — closes #385

Phase 1B of `persistence-read-rule-cleanup`. User-visible fix for #385: Connect Train2Go updates the calendar header in real time, profiles survive a refresh, and the active-profile join is observed atomically within a tab.

- Migrates the 4 high-risk read sites (`useProfileManager`, `useAiGeneration` via `useLatestRef`, `useSportZoneEditor`, the `use-active-profile` shim consumers) to the Dexie-backed live hooks introduced in Phase 1A; every write goes through the application use cases so persistence rejections surface as toasts instead of silently swallowing.
- Adds three #385 regression tests under `src/__regressions__/issue-385.test.tsx` (Train2Go reactive Sync button; profiles survive refresh; sibling-driven `setActiveProfile` is atomic).
- Deletes `src/store/profile-store.ts` + `src/store/profile-store/` (recursive) + `src/hooks/use-active-profile.ts`.
- Switches the perf gate to compare-mode against the Phase 1A baseline (`profile-state-baseline.json`); fails the build if `LayoutHeader` or `useAiGeneration` render counts exceed 2× baseline. Both metrics still measure 2 renders post-1B.

Behavior change documented in tasks.md: `deleteProfile` now clears `meta.activeProfileId` when it matches the deleted id (legacy reassign-to-first-remaining is intentionally dropped per the design's `clear-if-matching` rule). Users re-select an active profile after deletion.
