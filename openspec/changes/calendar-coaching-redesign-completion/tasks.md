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

- [ ] 2.1 Write failing tests for `formatRelativeTime(date: Date | undefined, now: Date): string` at `packages/workout-spa-editor/src/utils/format-relative-time.test.ts` covering the seven branches in design D17 (`undefined` → `"never synced"`, `<60_000` → `"just now"`, minutes, hours, `yesterday` (cross-day under 48h), days, ISO-fallback for older). Use injected `now` so no fake-timers are needed.
- [ ] 2.2 Implement `format-relative-time.ts`. All seven branches return literal-string outputs (never interpolated user data) so the PII-toast lint passes.
- [ ] 2.3 Write failing tests for `CoachingSyncButton` connected-state asserting: `aria-label="Sync <Label>"`, no visible text label, `title` reads `"<Label> · <relative-time>"`, the spinner replaces the icon in place during sync (button disabled), and `prefers-reduced-motion: reduce` collapses the spinner to a static glyph (mock `window.matchMedia`). Cover the `lastSyncedAt === undefined` → `"never synced"` branch.
- [ ] 2.4 Update `CoachingSyncButton.tsx` to icon-only chrome with the slate color tokens per spec; reuse the existing tooltip primitive used elsewhere in `CalendarHeader`. The not-connected branch is unchanged.
- [ ] 2.5 Run `pnpm --filter @kaiord/workout-spa-editor test` and `pnpm lint` — clean.

## 3. PR-C — CoachingActivityDialog match/split actions (issue #432, TDD red → green)

- [ ] 3.1 Write failing RTL test for the **solo-plan** state of `CoachingActivityDialog`: the dialog renders both "Convert to workout" and "Match to…"; clicking "Match to…" opens the picker.
- [ ] 3.2 Write failing test asserting the **picker filter** lists same-day, same-sport, unmatched workouts for the active profile only — exclude wrong sport, wrong date, already-matched, and other-profile workouts (design + spec scenario "Match-to picker lists same-day same-sport unmatched workouts").
- [ ] 3.3 Write failing test asserting that **selecting** a workout in the picker invokes `matchSession({ source: "manual", profileId, coachingActivityId, workoutId })`, and on success the dialog re-renders in matched state without closing; "Convert to workout" disappears and "Linked workout" + "Split" appear.
- [ ] 3.4 Write failing test asserting that clicking **Split** in the matched state invokes `unmatchSession`, the dialog re-renders in solo-plan state without closing, and the actions revert.
- [ ] 3.5 Write failing test asserting the "Match to…" / "Split" buttons are **disabled while in flight** (use a deferred promise to hold the use case mid-call, assert button has `disabled` attribute, resolve, assert it re-enables).
- [ ] 3.6 Implement the dialog changes in `packages/workout-spa-editor/src/components/molecules/CoachingCard/CoachingActivityDialog.tsx`. Add `use-match-session.ts` and `use-unmatch-session.ts` hooks if needed (mirror the shape of `use-set-calendar-density.ts`). The dialog reads matched-state from the existing `useMatchedSessions` projection.
- [ ] 3.7 Run unit + RTL tests; full `pnpm --filter @kaiord/workout-spa-editor test` clean.
- [ ] 3.8 Write failing RTL test for **keyboard navigation** in the Match-to picker per `spa-coaching-integration` "CoachingActivityDialog" scenarios "Match-to picker keyboard navigation" and "Picker Escape closes only the picker": Tab focuses the first item; Arrow keys traverse; Enter selects; Escape closes the picker without closing the parent dialog.
- [ ] 3.9 Write failing RTL test for **profile-switch safety** per the dialog spec: open the dialog on profile P1; change `useActiveProfile` to P2 mid-flight; complete the match; assert `matchSession` was invoked with `profileId: P1` (the captured value), not P2.
- [ ] 3.10 Implement the picker's keyboard handlers and the open-time `profileId` capture in `CoachingActivityDialog`. The capture lives in a `useRef` initialized at dialog mount.

## 4. PR-D — dismissAutoMatchBanner use case (issue #433 part 1, TDD red → green)

- [ ] 4.1 Write failing test for `dismissAutoMatchBanner` use case at `packages/workout-spa-editor/src/application/dismiss-auto-match-banner.test.ts` covering every scenario in `spa-session-match` "dismissAutoMatchBanner use case": first-dismissal-on-clean-week, second-dismissal-appends, idempotent-re-dismiss-updates-timestamp, the read companion `isAutoMatchBannerDismissed` returning true/false, repository write failure surfaces to caller (re-throw), empty-string profileId is rejected (`InvalidInputError`), and the 257th distinct pair is a no-op. Use the in-memory `AutoMatchDismissalRepository` test double + injected clock.
- [ ] 4.2 Implement the two use cases in `packages/workout-spa-editor/src/application/dismiss-auto-match-banner.ts` and `is-auto-match-banner-dismissed.ts`. Keep them ≤ 40 lines each.
- [ ] 4.3 Write failing test for the Dexie `AutoMatchDismissalRepository` adapter at `packages/workout-spa-editor/src/adapters/dexie/dexie-auto-match-dismissal-repository.test.ts` (extend if exists) covering: put/get round-trip on the new `dismissedPairs` shape preserves order; `deleteByProfile` cascades; `delete(profileId, weekStart)` is idempotent on missing rows; legacy single-timestamp rows are surfaced as `dismissedPairs: []` per spec scenario "Legacy single-timestamp row is treated as empty dismissedPairs"; the row schema does not require a Dexie schema bump (the field is non-indexed).
- [ ] 4.4 Update the Dexie adapter to read/write the new field; verify the existing `[profileId+weekStart]` PK and `profileId` index still satisfy the cascade requirements (no schema change needed).
- [ ] 4.5 Run `pnpm --filter @kaiord/workout-spa-editor test` — green.

## 5. PR-D — AutoMatchBanner CalendarPage wiring (issue #433 part 2, TDD red → green)

> Test-runner annotation: tasks 5.1a–5.1e + 5.1g are RTL (Vitest + Testing Library). Task 5.1f is the only Playwright e2e in §5 — it lives in the existing `e2e-frontend` matrix because full-page reload (F5) requires a real browser context that Vitest's jsdom cannot reproduce. PR-D's CI footprint is therefore one additional e2e test (~5–10 s) plus the §5 Vitest tests.

- [ ] 5.1a Write failing **RTL test**: banner appears with ≥ 1 undismissed suggestion.
- [ ] 5.1b Write failing **RTL test**: per-pair Reject hides only that row reactively (asserts `useLiveQuery` re-fires on dismissal).
- [ ] 5.1c Write failing **RTL test**: banner unmounts when zero rows remain (every suggestion accepted, rejected, or filtered).
- [ ] 5.1d Write failing **RTL test**: Accept invokes `matchSession` with `source: "auto-suggestion"`.
- [ ] 5.1e Write failing **RTL test**: dismissed pair stays hidden across SPA week navigation away-and-back (route-level navigation, not full reload).
- [ ] 5.1f Write failing **Playwright e2e test**: dismissal survives full browser reload (F5) — spec scenario "Dismissal survives full browser reload"; lives in `packages/workout-spa-editor/e2e/auto-match-banner.spec.ts`; runs in the existing `e2e-frontend` shard, not in the unit-test job.
- [ ] 5.1g Write failing **RTL test**: profile-switch isolates dismissal state per spec scenario "Profile switch isolates dismissal state".
- [ ] 5.2 Wire `AutoMatchBanner` into `CalendarPage`: render only when `useAutoMatchSuggestions(activeProfileId, weekStart)` returns ≥ 1 suggestion AND the consumer-layer filter (per-pair `isAutoMatchBannerDismissed`) leaves at least one row. The dismissal lookup MUST use `useLiveQuery` keyed on `(profileId, weekStart)` so dismissals reactively re-render the banner across tabs and across full page reloads. The lookup MUST re-key on profile switch (changing `activeProfileId` invalidates the prior subscription).
- [ ] 5.3 Wire per-row Reject to `dismissAutoMatchBanner({ profileId, weekStart, activityId, workoutId })` and per-row Accept to `matchSession({ source: "auto-suggestion", ... })`. Confirm via test that the spec scenarios in `spa-calendar` and `spa-session-match` pass end-to-end.
- [ ] 5.4 Add a Storybook story for `AutoMatchBanner` × CalendarPage integration (0 / 1 / 3 suggestions, 1 already dismissed); run a11y addon, zero violations.
- [ ] 5.4a Write failing **RTL test** asserting that when `AutoMatchBanner` is mounted inside `CalendarPage` with ≥ 1 suggestion, the rendered tree exposes a non-empty live region (`getByRole("status")` or an element carrying `aria-live="polite"`) so screen readers announce suggestion availability after auto-match completes. Storybook a11y catches static structure; this RTL test catches the runtime announce-on-mount path that Storybook does not exercise.
- [ ] 5.5 Run `pnpm --filter @kaiord/workout-spa-editor test` and `pnpm lint` — clean.

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
