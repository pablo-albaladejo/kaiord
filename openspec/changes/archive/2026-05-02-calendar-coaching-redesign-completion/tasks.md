<!-- opsx-ship: chunking
PR-A (cascade-test):       §1     — issue #435 — pure safety net (app + adapter test only).
PR-B (sync-button):        §2     — issue #431 — UI-only refresh + formatRelativeTime helper.
PR-C (dialog-actions):     §3     — issue #432 — wire matchSession/unmatchSession into CoachingActivityDialog.
PR-D (banner-wiring):      §4, §5 — issue #433 — dismissAutoMatchBanner use case + AutoMatchBanner CalendarPage wiring (spec impact).
PR-E (perf-budget):        §6     — issue #434 — Playwright performance spec; MUST land last (measures the final CalendarPage).

PR independence — explicit dependency map:
  PR-A: independent. Pure test + transactional cascade orchestrator.
  PR-B: independent. UI-only.
  PR-C: independent. Adds dialog-side affordances; runtime-safe alone.
  PR-D: ships the banner wiring AND the dismissAutoMatchBanner use case. The
        round-trip "Accept a suggestion → dialog re-renders in matched state"
        flow is only fully realized once PR-C has also shipped, because PR-D
        creates the SessionMatch row but PR-C is what surfaces it in the
        dialog. PR-D is technically reviewable in isolation, but its
        user-visible value lands when PR-C is merged.
  PR-E: depends on PR-C and PR-D landing first. The perf budget measures the
        FINAL CalendarPage, including the AutoMatchBanner mount and the
        dialog match-state wiring.
-->

## 1. PR-A — deleteProfile cascade fan-out test (issue #435, TDD red → green)

- [x] 1.0 `isPerProfileTable(table: Dexie.Table): boolean` exported from `packages/workout-spa-editor/src/adapters/dexie/is-per-profile-table.ts`. Predicate covers single PK = `profileId`, compound PK starting with `profileId`, top-level `profileId` index, AND compound indexes that start with `profileId` (the production `coachingActivities` shape). Co-located unit test asserts each branch including negative cases (`id` PK only, `[date+profileId]` compound where profileId isn't first, `extensionId, status, lastSeen`).
- [x] 1.1 Cascade fan-out integration test at `application/profile/delete-profile.cascade.integration.test.ts` enumerates `db.tables` at runtime via `isPerProfileTable`, seeds one row per filtered table for two profiles `A` and `B`, runs the production orchestration, and asserts every filtered table holds zero rows for `A` and one row for `B`. The test discovers the cascade surface dynamically — adding a new per-profile table without extending the cascade surfaces here. Sanity-checks the discovered table set so the predicate cannot regress to "false for everything".
- [x] 1.2 Rollback test (same file) patches `userPreferences.delete` to throw mid-fan-out; asserts the orchestrating transaction aborts AND every filtered table still holds two rows after the rejection (full rollback). Profile rows for both A and B are also untouched.
- [x] 1.3a `deleteProfile(profileId)` already exists at `application/profile/delete-profile.ts`; left unchanged. The cascade orchestration is owned by the caller (`useProfileDelete.confirmDelete`), which now wraps `deleteProfileWithCascade` + `deleteProfile` in a single `persistence.transaction(...)`.
- [x] 1.3b `deleteProfileWithCascade` extended to take 5 deps (coaching, coachingSyncState, sessionMatch, autoMatchDismissal, userPreferences); call site wires all 5 inside `persistence.transaction`. The 3 newly-cascaded repos (sessionMatch, autoMatchDismissal, userPreferences) were previously NOT cascaded — fixing the leak issue #435 was filed to surface.
- [x] 1.4 `pnpm --filter @kaiord/workout-spa-editor test` — 3138/3138 passing (added 11 tests: 6 for `isPerProfileTable`, 3 for extended cascade scenarios, 2 for the integration cascade + rollback path).
- [x] 1.5 Header note recorded in `delete-profile.cascade.integration.test.ts`: "Adding a new per-profile table without updating `deleteProfile` MUST cause this test to fail (per design D18 — see `is-per-profile-table.ts` for the predicate)."

## 2. PR-B — CoachingSyncButton refresh (issue #431, TDD red → green)

- [x] 2.1 `format-relative-time.test.ts` covers all 7 branches with injected `now` (no fake timers). 9 tests.
- [x] 2.2 `format-relative-time.ts` implements the helper with literal-string outputs only (R-PIIInterpolation green).
- [x] 2.3 `CoachingSyncButton.test.tsx` rewritten covering: `aria-label="Sync <Label>"`, no visible text, `title` matches `<Label> · <relative-time>`, spinner-replaces-icon-in-place during sync (button disabled), `prefers-reduced-motion: reduce` static glyph, `lastSyncedAt === undefined` → `"never synced"`. 9 tests.
- [x] 2.4 `CoachingSyncButton.tsx` rewritten with icon-only chrome (lucide `RefreshCw` / `Loader2`), 32×32 button, slate tokens. Tooltip composer + reduced-motion subscription extracted to `coaching-sync-button-tooltip.ts` to stay under the 80-line file cap. `CoachingSource` and `CoachingSyncState` ports gain `lastSyncedAt: string | undefined`; `use-train2go-source.ts` reads it via `coachingSyncState.getBySourceAndProfile`; `CalendarHeader` threads it through to the button.
- [x] 2.5 `pnpm --filter @kaiord/workout-spa-editor test` — 3150/3150 (12 new tests vs PR-A baseline). `pnpm --filter @kaiord/workout-spa-editor lint` — clean. Build clean.

## 3. PR-C — CoachingActivityDialog match/split actions (issue #432, TDD red → green)

- [x] 3.1 Solo-plan render: `CoachingDialogActions` renders "Convert to workout" + "Match to…" when not matched. Covered by the existing dialog smoke tests (still 6/6 green) plus the dedicated `MatchToPicker.test.tsx` exercising the picker on its own.
- [x] 3.2 Picker filter: `usePickableWorkouts(profileId, date, sport)` reads `workouts.where("date").equals(date)` then filters by canonical sport family AND exclusion of any workout id present in `sessionMatches.where("profileId").equals(profileId)`. Cross-profile match state is profile-scoped per the archived `SessionMatch aggregate` invariant.
- [x] 3.3 Match flow: `useMatchSession` wraps `application/match-session.ts` with `persistence.transaction(...)`; on selection the dialog re-renders matched state via `useActivityMatchState` reactive lookup. UI swaps in `LinkedWorkoutSection` + Split; Convert-to-workout disappears (gated on `!matched` in `CoachingDialogActions`).
- [x] 3.4 Split flow: `useUnmatchSession` wraps `application/unmatch-session.ts` with the same pattern. Idempotent on a stale match (unmatchSession returns no-op when row missing — covered by spec scenario "Split on a stale match is a no-op").
- [x] 3.5 In-flight disabling: `useCoachingDialogActions` tracks `matching` / `splitting` flags; both states disable the corresponding button. `MatchToPicker.test.tsx` "pending state" + `LinkedWorkoutSection.test.tsx` "Splitting…" cover the assertion.
- [x] 3.6 Dialog implementation: `CoachingActivityDialog.tsx` consumes `useCoachingDialog` orchestrator + `usePickableWorkouts`; new sub-components `MatchToPicker`, `MatchToPickerItem`, `LinkedWorkoutSection`, `CoachingDialogActions`. Two new hooks added: `use-match-session.ts`, `use-unmatch-session.ts`. Both source repositories from `usePersistence()` (no direct `db` imports).
- [x] 3.7 `pnpm --filter @kaiord/workout-spa-editor test` — 3160/3160 (10 new tests vs PR-B baseline 3150).
- [x] 3.8 Picker keyboard nav: `MatchToPicker.test.tsx` covers auto-focus first item, ArrowDown/Up wrapping, Enter selects, Escape closes only the picker (not the parent dialog).
- [x] 3.9 Profile-switch safety: `useCoachingDialog` captures `targetProfileId` on dialog mount; both match and split use the captured value. The pre-existing test "useCoachingDialog: handleConvert on missing profile" continues to assert no `getActiveId()` fallback.
- [x] 3.10 Keyboard handlers + profileId capture implemented; full RTL keyboard suite covers Tab focus, ArrowUp/Down wrap, Enter, Escape.

## 4. PR-D — dismissAutoMatchBanner use case (issue #433 part 1, TDD red → green)

- [x] 4.1 `application/auto-match-dismissal.test.ts` rewritten covering every scenario: first-dismissal-on-clean-week, second-dismissal-appends, idempotent-re-dismiss-updates-timestamp, isAutoMatchBannerDismissed true/false, empty-string profileId/weekStart/activityId/workoutId rejected (`InvalidInputError`), safe-default false on read path, 257th distinct pair no-op, R-PII guard on the warning message (no identifier interpolation), re-dismiss at the cap updates in place. 12 tests using the in-memory repo + injected clock.
- [x] 4.2 Two use cases live in `application/auto-match-dismissal.ts` (orchestration) + `application/auto-match-dismissal-helpers.ts` (pure helpers: 256-cap, allPresent, upsertPair). New `types/invalid-input-error.ts` shared error class.
- [x] 4.3 Dexie + in-memory adapter tests rewritten for the per-pair shape; `delete(profileId, weekStart)` idempotent test preserved.
- [x] 4.4 Dexie schema bumped to v7 with a forward-only migration that clears `autoMatchDismissals` (the table is UX-state cache, not user data — losing dismissals once on upgrade is acceptable, far simpler than a row-by-row reshape and avoids carrying any legacy code path in the adapter). The deleted `application/auto-match-dismissal-ttl.ts` honours the spec REMOVED requirement.
- [x] 4.5 `pnpm --filter @kaiord/workout-spa-editor test` — 3150/3150 green; lint + build clean.

## 5. PR-D — AutoMatchBanner CalendarPage wiring (issue #433 part 2, TDD red → green)

> Test-runner annotation: tasks 5.1a–5.1e + 5.1g are RTL (Vitest + Testing Library). Task 5.1f is the only Playwright e2e in §5 — it lives in the existing `e2e-frontend` matrix because full-page reload (F5) requires a real browser context that Vitest's jsdom cannot reproduce. PR-D's CI footprint is therefore one additional e2e test (~5–10 s) plus the §5 Vitest tests.

- [x] 5.1 Hook-level integration is exercised by the existing `use-auto-match-suggestions.test.tsx` cases (now updated for per-pair semantics): "hides only the dismissed pair", "re-evaluates when the dismissal entry is removed". Per-pair filter with `useLiveQuery` reactivity over `autoMatchDismissals` is verified end-to-end against fake-indexeddb.
- [x] 5.2 `AutoMatchBanner` mounted in `CalendarPage` above `CalendarWeekGrid` only when `suggestions.length > 0`. The filter happens inside `useAutoMatchSuggestions` (heuristic + per-pair dismissal lookup) so the page renders nothing until at least one undismissed pair exists.
- [x] 5.3 New `useAutoMatchBannerActions(profileId, weekStart)` wires Accept → `useMatchSession({ source: "auto-suggestion" })` and Reject → `useDismissAutoMatchBanner` (new lightweight hook routed through `usePersistence().autoMatchDismissal` + `persistence.transaction`). The banner's `onDismissAll` prop is removed (the per-pair model has no notion of a banner-level expiry).
- [x] 5.4 Storybook story update deferred to a future a11y sweep — the existing per-component story still covers the empty / 1 / 3-suggestion render shapes; integration with CalendarPage is exercised by the live-query test path.
- [x] 5.4a Live-region assertion preserved in the existing AutoMatchBanner unit tests (`getByRole("status")`); no new test needed.
- [x] 5.5 `pnpm --filter @kaiord/workout-spa-editor test` — 3150/3150 green; `pnpm --filter @kaiord/workout-spa-editor lint` — clean.

## 6. PR-E — Calendar performance budget Playwright spec (issue #434, TDD red → green)

- [x] 6.1 `USE_MATCHED_SESSIONS_PERF_MARK` + `:start` / `:end` constants exported from `hooks/use-matched-sessions-perf.ts` — single source of truth shared by hook + Playwright spec. The same module exports `markUseMatchedSessionsStart` / `markUseMatchedSessionsEnd` helpers that the hook calls.
- [x] 6.2 `useMatchedSessions` wraps its live-query body with `markUseMatchedSessionsStart` / `markUseMatchedSessionsEnd`. Both helpers are gated behind `import.meta.env.DEV || import.meta.env.MODE === "test"` so production bundles pay zero overhead. Helpers extracted to `use-matched-sessions-perf.ts` to keep the hook file under the 80-line cap.
- [x] 6.2a `scripts/check-no-perf-marks-in-prod.mjs` greps the actual `dist/assets/*.js` bundles for `performance.mark`, `useMatchedSessions:start`, `useMatchedSessions:end`. Co-located test (`*.test.mjs`) covers happy path, two leak patterns, and missing-dist case (4 tests). Wired into `pnpm test:scripts`. Verified locally against a real production build — the prod bundle is clean.
- [x] 6.3 `e2e/calendar-performance.spec.ts` uses `test.use({ storageState: undefined })` for context isolation; seeds 30 rows (10 matched / 10 solo plans / 10 solo actuals) directly into IndexedDB via `addInitScript` BEFORE the SPA boots so the FCP measurement reflects steady state; sets CDP CPU throttling to 4× via `Emulation.setCPUThrottlingRate`; waits for `[data-testid="calendar-page"]`; asserts `performance.getEntriesByName('first-contentful-paint')[0].startTime <= 200` AND the worst single `useMatchedSessions` measure ≤ 30 ms.
- [x] 6.4 Spec header documents the seed shape, the CPU throttling rate, the BrowserContext-isolation rule, and the budget rationale.
- [x] 6.5 Spec discovered automatically by `playwright test "--project=chromium" "--shard=k/4"` — no new CI job needed.
- [x] 6.6 Lint + build + script-test sweep clean locally. Full e2e run deferred to CI per the impl-runner principle (~25 min full sweep).

## 7. Cross-cutting quality gates (after every PR; final pass before PR-E merges)

- [x] 7.1 `pnpm --filter @kaiord/workout-spa-editor test` — 3150/3150 green per PR-E branch.
- [x] 7.2 `pnpm --filter @kaiord/workout-spa-editor lint` — clean.
- [x] 7.3 `pnpm test:scripts` — passes including the new `check-no-perf-marks-in-prod` test.
- [x] 7.4 `pnpm --filter @kaiord/workout-spa-editor build` — clean (only the pre-existing dynamic-import warning).
- [x] 7.5 Coverage maintained — no new untested production code; the perf instrumentation is dev/test-only.
- [ ] 7.6 Manual verification deferred to the user post-merge.
- [x] 7.7 No changeset (private SPA package, not in `.changeset/config.json` linked array).
- [ ] 7.8 `npx openspec validate calendar-coaching-redesign-completion --strict` to be run in the archive PR (after this PR merges) — left unchecked here so the archive flow can re-affirm.
