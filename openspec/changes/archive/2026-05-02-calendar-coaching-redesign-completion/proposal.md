> Completed: 2026-05-02

## Why

The `2026-05-01-calendar-coaching-redesign` change (archived) shipped the structural redesign — three card states, the `SessionMatch` aggregate, density toggle, status palette — but its §8.5/§8.6, §9, §10.3, §11, and §12.4a tasks (originally chunked under PR 3 and PR 4) were deferred to follow-up issues #431–#435 and never landed. The resulting state is incoherent in three ways: (a) the auto-match heuristic exists end-to-end yet **never reaches the user** because `AutoMatchBanner` is built and unit-tested but unmounted in `CalendarPage`; (b) the `match`/`unmatch` use cases are wired into the data layer but the `CoachingActivityDialog` still treats coaching activities and workouts as two disconnected stacks, so users cannot manually fuse a plan to an actual or split a wrong match; (c) the perf budget that was supposed to gate the redesigned `CalendarPage` was deferred — and must be set against the **final** shape, not the current half-shipped one.

A separate spec-drift problem compounds the above: the archive operation promoted `spa-calendar` and `spa-coaching-integration` deltas into `openspec/specs/` but did **not** promote the new `spa-session-match` and `spa-user-preferences` capabilities, so the SessionMatch domain (already running in production) has no active spec. This change addresses the in-scope drift by introducing `spa-session-match` as a new capability with the requirements actually exercised by issues #431–#435. The remaining promotion (the archived spec content already shipped to code but not yet in `openspec/specs/`) is out of scope here and SHALL be handled by a follow-up `/opsx-sync` operation tracked separately.

## What Changes

- Wire `AutoMatchBanner` into `CalendarPage` (#433): render when `useAutoMatchSuggestions(activeProfileId, weekStart)` returns ≥ 1 suggestion; Accept invokes `matchSession({source: "auto-suggestion"})`; per-row Reject removes the row without writing; "Dismiss all" persists a per-suggestion dismissal via a new `dismissAutoMatchBanner` use case (writes a row to the existing `autoMatchDismissals` Dexie table — schema unchanged).
- Surface `matchSession` / `unmatchSession` from inside `CoachingActivityDialog` (#432): a "Linked workout" section when **MATCHED** with a "Split" action; a "Match to…" picker when **SOLO PLAN** (lists same-day, same-sport unmatched workouts); the existing "Convert to Workout" action is hidden when matched.
- Refresh `CoachingSyncButton` connected-state chrome (#431): icon-only 32×32 with a tooltip showing the relative last-sync time ("synced 5m ago", "synced yesterday", "never synced"); spinner overlays the icon during sync. Adds a new pure helper `formatRelativeTime` co-located with its tests. Not-connected state is unchanged.
- Add a Playwright performance-budget spec for the redesigned `CalendarPage` (#434): FCP ≤ 200 ms on a synthetic 30-card week (10 matched / 10 solo plans / 10 solo actuals) under CDP CPU throttling 4×; `useMatchedSessions` MUST not contribute > 30 ms (measured via `performance.measure` markers around the hook). Spec runs in the existing `e2e-frontend` matrix and fails the build if either budget is exceeded.
- Add a transactional cascade fan-out integration test for `deleteProfile` (#435): the test seeds one row per per-profile table for two profiles, deletes profile A, asserts every per-profile table retains only profile B's row, and asserts that injecting a mid-fan-out failure rolls every table back. The test enumerates `db.tables` rather than hard-coding the cascade list, so adding a new per-profile table without updating `deleteProfile` MUST break this test.

## Capabilities

### New Capabilities

- `spa-session-match`: scoped to the **new** behavior introduced by this change — the `dismissAutoMatchBanner` use case, the per-pair dismissal persistence model, and the `AutoMatchDismissalRepository` port contract. Establishing the capability here gives the new requirements a home; the broader SessionMatch surface (matchSession / unmatchSession / autoMatchSessions / useMatchedSessions / compliance score) is already running in production from PRs #410 and #415, and SHALL be promoted into this capability's spec by a follow-up `/opsx-sync` step rather than re-authored here.

### Modified Capabilities

- `spa-calendar`: extends the existing CalendarHeader and Coaching-activities requirements with the connected-state CoachingSyncButton chrome (icon-only, relative-time tooltip), the AutoMatchBanner visibility and dismissal-idempotency contract, and a non-functional performance-budget requirement that pins FCP and `useMatchedSessions` ceilings.
- `spa-coaching-integration`: extends the existing `CoachingActivityDialog` requirement with the match/unmatch surfaces — Linked-workout section + Split action when matched; Match-to picker when solo plan; Convert-to-Workout hidden when matched.

## Impact

- **Affected packages**: `@kaiord/workout-spa-editor` only. No changes to `@kaiord/core`, format adapters, CLI, MCP, or extension packages.
- **Affected layers (hexagonal)**:
  - Domain: no new types. `MatchSuggestion` and `AutoMatchDismissal` already exist from the archived change.
  - Application: new pure helper `formatRelativeTime(date: Date | undefined, now: Date): string`; new use cases `dismissAutoMatchBanner(input, deps)` and `isAutoMatchBannerDismissed(input, deps)` (both already exist as named applications in the archive proposal — this change formally adds the missing implementations and tests).
  - Ports: `AutoMatchDismissalRepository` (already declared by the archived change; spec-only formalization here).
  - Infrastructure (Dexie): no new tables, no schema bump. The `autoMatchDismissals` table was added in Dexie v5 by the archived change.
  - UI: `AutoMatchBanner` mounted in `CalendarPage`; `CoachingSyncButton` connected-state rewritten; `CoachingActivityDialog` gains the match-to picker, the linked-workout section with Split, and the conditional hide of Convert-to-Workout.
  - Tests: ~6–8 unit tests (formatRelativeTime, dismissAutoMatchBanner use cases, picker filter), 1 integration test (deleteProfile cascade fan-out + rollback), 1 Playwright e2e for AutoMatchBanner full happy-path, 1 Playwright performance spec.
- **Public API**: no breaking changes. SPA package is private; component surface is internal.
- **Persistence migration**: none. Tables already exist.
- **Dependencies**: no new runtime dependencies. Reuses lucide-react `RefreshCw`, existing radix tooltip, Playwright's CDP session API.
- **Quality gates**: zero new ESLint/TypeScript warnings; mechanical guards continue to pass; coverage ≥ 70% on `@kaiord/workout-spa-editor`. The new performance spec gates the e2e-frontend job in CI.
- **Spec drift**: `spa-session-match` is created at archive time with only the requirements added here (dismissAutoMatchBanner + AutoMatchDismissalRepository). The remaining archive content (matchSession, unmatchSession, autoMatchSessions, etc.) stays out of scope and will be folded in by a separate `/opsx-sync` PR.
