<!-- opsx-ship: chunking
PR-1 (single-PR): §1, §2, §3 — mechanical /opsx-sync lift; no code changes; pure docs.
-->

## 1. Lift archived spa-session-match into openspec/specs/

- [x] 1.1 Read the archived `2026-05-01-calendar-coaching-redesign/specs/spa-session-match/spec.md` (485 lines) AND the existing live `openspec/specs/spa-session-match/spec.md` (4 requirements).
- [x] 1.2 Compose the merged live spec: extend the existing 4 requirements with the 9 lifted requirements (`SessionMatch aggregate`, `matchSession`, `unmatchSession`, `SessionMatchRepository port`, `autoMatchSessions`, `Sport family canonical mapping`, `Compliance score derivation`, `Compliance score limitations (v1)`, `useAutoMatchSuggestions view-model hook`, `Auto-match suggestion banner`).
- [x] 1.3 Apply the per-pair-model reconciliation (per design D15 of the completion change): drop `Auto-match dismissal TTL is a named constant`; drop `Rejected suggestions are session-scoped (not persisted)`; rewrite the lifted `Auto-match suggestion banner` to remove "Dismiss-all" and 24h TTL, replace per-row Reject with `dismissAutoMatchBanner` invocation; rewrite the lifted `useAutoMatchSuggestions` hook to filter against `dismissedPairs` per-pair (not via `isAutoMatchBannerDismissed` 24h check).
- [x] 1.4 Enhance the existing `Cascade hooks on coaching-activity and workout deletion` requirement with the cascade-table inventory (lifted from the archived `Cascade hooks run inside a single Dexie transaction` requirement). Inventory now lists `autoMatchDismissals` under both `coachingActivities` and `workouts` parents, making the per-pair purge explicit.
- [x] 1.5 Update the live spec's `> Synced:` marker to today's date with this change's slug.

## 2. Lift archived spa-user-preferences into openspec/specs/

- [x] 2.1 Read the archived `2026-05-01-calendar-coaching-redesign/specs/spa-user-preferences/spec.md` (133 lines).
- [x] 2.2 Create the live spec at `openspec/specs/spa-user-preferences/spec.md` from the archived content. Preserve all 5 requirements (`UserPreferences aggregate`, `UserPreferencesRepository port`, `getUserPreferences use case`, `setCalendarDensity use case`, `Reactive preference reads via useLiveQuery`).
- [x] 2.3 Minimal reconciliation: cascade-hook requirement now references the `spa-session-match` cascade-table inventory rather than re-stating its own contract. Table names use camelCase per project convention.
- [x] 2.4 Update the new spec's `> Synced:` marker to today's date with this change's slug.

## 3. Validation + change folder + PR

- [x] 3.1 `pnpm lint:specs` passes; `npx openspec validate --specs --strict` passes (32 → 33 specs).
- [x] 3.2 `npx openspec validate sync-session-match-user-preferences-specs --strict` passes on the change folder.
- [x] 3.3 No code changes; `pnpm -r test` not required (pure docs PR; `test:scripts` runs in pre-commit hook regardless).
- [ ] 3.4 PR opens; reviewer can compare diff against the archived sources to confirm the lift is verbatim modulo the documented per-pair-model reconciliation.
- [ ] 3.5 No changeset (private SPA package, not in `.changeset/config.json` linked array, and no behavior change).
