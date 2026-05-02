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

- [ ] 6.1 Export a single constant `USE_MATCHED_SESSIONS_PERF_MARK = 'useMatchedSessions'` from `packages/workout-spa-editor/src/hooks/use-matched-sessions-perf.ts` so the perf mark name is shared by both the hook and the spec (no magic strings).
- [ ] 6.2 Add `performance.mark(\`${USE_MATCHED_SESSIONS_PERF_MARK}:start\`)` / `performance.mark(\`${USE_MATCHED_SESSIONS_PERF_MARK}:end\`)`and a corresponding`performance.measure(USE_MATCHED_SESSIONS_PERF_MARK, start, end)`inside the`useMatchedSessions`hook body. Gate ALL three calls behind`import.meta.env.DEV || import.meta.env.MODE === 'test'` so production bundles pay zero overhead. Add a unit test asserting the marks are emitted under the test environment.
- [ ] 6.2a Add a Node-based build-output assertion at `scripts/check-no-perf-marks-in-prod.mjs` with a co-located `scripts/check-no-perf-marks-in-prod.test.mjs` (per the project's "every non-trivial script has a sibling test"). Wire it into `pnpm test:scripts`. The script: after `pnpm --filter @kaiord/workout-spa-editor build`, greps the resulting `dist/assets/*.js` bundles for `performance.mark` AND for the literal `useMatchedSessions` mark name; fails if either appears. Deterministic alternative to mocking `import.meta.env.PROD` in Vitest (which fails because `import.meta.env` is resolved at Vite transform time, not at test runtime). Document in the test header that the assertion targets the production tree-shake outcome.
- [ ] 6.3 Write the Playwright spec at `packages/workout-spa-editor/e2e/calendar-performance.spec.ts`: use a fresh `BrowserContext` per test (`test.use({ storageState: undefined })` or equivalent) so seeded rows do NOT leak across test runs or to a developer's browser profile. `test.beforeEach` seeds 30 rows (10 matched / 10 solo plan / 10 solo actual) for the visible week via `db.bulkPut`; `test.afterEach` clears the seeded rows (defense in depth even with isolated context). The test sets CDP CPU throttling to factor 4×; navigates to `/calendar`; waits for `[data-route-heading]` to be visible; asserts `performance.getEntriesByName('first-contentful-paint')[0].startTime <= 200` AND the `useMatchedSessions` measurement (read via `performance.getEntriesByName(USE_MATCHED_SESSIONS_PERF_MARK)`) ≤ 30 ms.
- [ ] 6.4 Document the seed-data shape, CPU throttling configuration, and BrowserContext-isolation rule in the spec file header, per spec scenario "documented baseline" and design D16.
- [ ] 6.5 Verify the spec runs in the existing `e2e-frontend` matrix (one of the 4 shards) without adding a new CI job; the existing `pnpm test:e2e --project=chromium --shard=k/4` distributor picks it up automatically.
- [ ] 6.6 Run the spec locally (full e2e is ~25 min — limit to `--grep "performance budget"` for fast iteration); confirm it passes against the current `main`-equivalent state of this branch.

## 7. Cross-cutting quality gates (after every PR; final pass before PR-E merges)

- [ ] 7.1 `pnpm -r test` — all packages green.
- [ ] 7.2 `pnpm lint` — full repo (lint + type check + format check + mechanical guards) zero warnings, zero errors.
- [ ] 7.3 `pnpm test:scripts` — mechanical guards pass (no Zustand→Dexie writethrough, no PII interpolation, no library dual-mount).
- [ ] 7.4 `pnpm --filter @kaiord/workout-spa-editor build` — clean (dynamic-import warnings unrelated to this change are acceptable).
- [ ] 7.5 Coverage on `packages/workout-spa-editor` ≥ 70% (existing threshold).
- [ ] 7.6 Manual verification in dev server: open `/calendar` with an active Train2Go account; confirm the redesigned sync button reads correctly across `never synced`, fresh, and stale states; confirm AutoMatchBanner appears + per-row reject persists across week navigation AND across full browser reload (F5 — not just SPA route change); open a coaching activity dialog in solo-plan state and walk through Match → Split round-trip; switch the active profile while a coaching dialog is open and confirm the in-flight match writes to the original profile (per spec scenario "Profile switch mid-dialog preserves the original profile"); verify perf marks are visible in DevTools Performance tab in dev mode.
- [ ] 7.7 No changeset (per `package.json` "private: true" on `@kaiord/workout-spa-editor` and absence from `.changeset/config.json` `linked` array — the change does not touch any publishable package).
- [ ] 7.8 `npx openspec validate calendar-coaching-redesign-completion --strict` passes one final time before PR-E merges.
