<!-- opsx-ship: chunking
PR 0 (propose): the openspec/changes/calendar-coaching-redesign/ artifacts only — proposal, design, specs, tasks (this file). Quick docs-only PR for spec review.
PR 1 (foundations-application-hooks): §1, §2, §3 — domain types, ports, Dexie adapters, in-memory test doubles, application use cases, view-model hooks. Tested in isolation; no UI changes.
PR 2 (cards-visual-primitives): §4, §5 — CardShell, palette/contrast tokens, rewritten CoachingActivityCard + WorkoutCard, new MatchedSessionCard, Storybook stories with a11y addon. Fixes the overflow bug and ships the new visual language.
PR 3 (calendar-wiring-dialog-banner): §6, §7, §8, §9, §10 — DayColumn three-state rendering, CalendarWeekGrid wiring of matched-session bucket, CalendarHeader with density toggle / week-label / icon sync button, CoachingActivityDialog match/split actions, AutoMatchBanner.
PR 4 (perf-quality-gates): §11, §12 — Playwright performance test, ESLint layer-boundary rules, MatchSuggestion no-redeclaration rule, deleteProfile cascade fan-out test, manual verification + changeset confirmation.
-->

## 1. Foundations — domain types, ports, persistence (TDD red → green → refactor)

- [ ] 1.1 Write failing schema/shape tests for `SessionMatch` (uniqueness invariants documented as type-level/runtime checks; `source` enum literals `"manual" | "auto-suggestion" | "auto-conversion"`); then add the type and Zod schema in `packages/workout-spa-editor/src/types/session-match.ts`
- [ ] 1.2 Write failing tests for the new error classes (`SessionAlreadyMatchedError`, `CrossProfileMatchError`, `CoachingActivityNotFoundError`, `WorkoutNotFoundError`, `ProfileNotFoundError` reuse if present, otherwise add); then implement them in `packages/workout-spa-editor/src/types/session-match-errors.ts`
- [ ] 1.3 Write failing schema tests for `UserPreferences` (`calendarDensity` enum, `updatedAt` ISO format); then add the type and Zod schema in `packages/workout-spa-editor/src/types/user-preferences.ts`
- [ ] 1.4 Write failing schema tests for `AutoMatchDismissal` (`(profileId, weekStart)` composite key, `dismissedAt` ISO); then add the type and Zod schema in `packages/workout-spa-editor/src/types/auto-match-dismissal.ts`
- [ ] 1.5 Write failing port-contract tests for `SessionMatchRepository` against `InMemorySessionMatchRepository`: `put` rejects on uniqueness violation, `getByActivityId`, `getByWorkoutId`, `listByProfileAndWeek`, `delete` is idempotent, `deleteByActivityId` cascade-style helper, `deleteByWorkoutId`. Then implement the in-memory test-double in `packages/workout-spa-editor/src/test-utils/in-memory-session-match-repository.ts` and the port interface in `packages/workout-spa-editor/src/ports/session-match-repository.ts`
- [ ] 1.6 Write failing port-contract tests for `UserPreferencesRepository` (`get`, `put`, `delete` idempotent); then implement in-memory test-double and port interface
- [ ] 1.7 Write failing port-contract tests for `AutoMatchDismissalRepository` (`getByProfileAndWeek`, `put`, `delete` idempotent, `deleteByProfile`); then implement in-memory test-double and port interface
- [ ] 1.8 Write failing Dexie schema-version test asserting the new tables exist on a fresh DB and that the migration on a populated DB preserves all existing rows. Then bump the Dexie schema by one version, add tables `session_matches` (PK `id`, indexes `[profileId+coachingActivityId]`, `[profileId+workoutId]`, `profileId`), `user_preferences` (PK `profileId`), `auto_match_dismissals` (PK `[profileId+weekStart]`, indexed by `profileId`)
- [ ] 1.9 Write failing integration tests for `DexieSessionMatchRepository` against `fake-indexeddb` (uniqueness rejection, cascade hooks on activity delete and workout delete, cascade-hook atomicity inside a `db.transaction('rw', ...)` — including a simulated mid-transaction crash that rolls back). Then implement the adapter
- [ ] 1.10 Write failing integration tests for `DexieUserPreferencesRepository` (cascade on profile delete, transactional read-then-write); then implement the adapter
- [ ] 1.11 Write failing integration tests for `DexieAutoMatchDismissalRepository` (cascade on profile delete, 24h expiry interpretation lives in the use case not the repo); then implement the adapter
- [ ] 1.12 Generate a pre-change Dexie fixture (export current `coachingActivities`, `workouts`, `coachingSyncState`, `profiles` rows from a representative seeded DB) and check it in as `packages/workout-spa-editor/src/test-fixtures/dexie-pre-redesign.json`. Add a regeneration script `scripts/regen-dexie-fixture.mjs` documented in `scripts/README.md`
- [ ] 1.13 Write failing migration round-trip test that loads `dexie-pre-redesign.json` into a fresh `fake-indexeddb`, applies the schema migration, and asserts every pre-change row is readable byte-identically and the new tables (`session_matches`, `user_preferences`, `auto_match_dismissals`) exist and are empty

## 2. Application layer — pure functions and use cases (TDD)

- [ ] 2.1 Write failing tests for `parseCoachingDuration` covering: `"45 min"`, `"1h 30"`, `"1h30m"`, `"45'"`, `"PT1H30M"`, `"~45 min"`, `"45-50 min"` (lower bound), empty/undefined/garbage → `undefined`. Then implement in `packages/workout-spa-editor/src/application/parse-coaching-duration.ts`
- [ ] 2.2 Write failing tests for `computeComplianceScore`: hit-target (≈0.96), off-target (=0.5), missing planDur, missing actualDur, both missing, `planDur=0` division-by-zero guard, NaN guard. Then implement in `packages/workout-spa-editor/src/application/compute-compliance-score.ts`
- [ ] 2.3 Write failing tests for `complianceBucket(score | null)`: `null → "neutral"`, `0 → "amber"`, `0.499 → "amber"`, `0.5 → "mid"`, `0.799 → "mid"`, `0.8 → "emerald"`, `1.0 → "emerald"`. Then implement in `packages/workout-spa-editor/src/application/compliance-bucket.ts`
- [ ] 2.4 Write failing tests for `matchSession` happy path (manual match writes a row with `source: "manual"`, `createdAt` from injected clock, `id` from injected idGenerator); then implement in `packages/workout-spa-editor/src/application/match-session.ts` accepting injected `{ clock, idGenerator, repository, coachingRepository, workoutRepository }`
- [ ] 2.5 Write failing tests for `matchSession` error paths (activity not found, workout not found, double-match on activity side, double-match on workout side, cross-profile activity, same workout matched in two profiles is permitted); then make them pass
- [ ] 2.6 Write failing tests for `unmatchSession` (deletes the row, idempotent on missing, rejects cross-profile); then implement
- [ ] 2.7 Write failing tests for `autoMatchSessions`: single obvious pair, greedy assignment across two sports, score-below-threshold filtered, already-matched skip, missing-duration neutral score with `{code:"duration-unknown"}` reason, unparseable-duration treated as missing, deterministic tiebreaker on equal scores (by activityId then workoutId), zero-write semantics. Then implement in `packages/workout-spa-editor/src/application/auto-match-sessions.ts`
- [ ] 2.8 Write failing tests for `convertCoachingActivity` modified semantics: first-time conversion creates workout AND `SessionMatch{source:"auto-conversion"}`; idempotent re-conversion preserves existing match (no overwrite); re-conversion after manual unmatch does NOT recreate the match; re-conversion when the workout is already matched to a different activity does NOT overwrite. Then update `convertCoachingActivity` to call the new `matchSession` with the no-op-on-conflict semantic
- [ ] 2.9 Write failing tests for `getUserPreferences` (returns persisted row when present; returns derived default `{ calendarDensity }` from the optional `defaultDensity` parameter without writing when absent); then implement in `packages/workout-spa-editor/src/application/get-user-preferences.ts`
- [ ] 2.10 Write failing tests for `setCalendarDensity` (creates row on first call with `updatedAt` from injected clock; updates row in place on subsequent calls; idempotent on same value still refreshes `updatedAt`; throws `ProfileNotFoundError` when the transactional read finds no profile); then implement in `packages/workout-spa-editor/src/application/set-calendar-density.ts`
- [ ] 2.11 Write failing tests for `dismissAutoMatchBanner({profileId, weekStart})` (upserts row with `dismissedAt` from injected clock); then implement
- [ ] 2.12 Write failing tests for `isAutoMatchBannerDismissed({profileId, weekStart, now})` (returns true when row's `dismissedAt < 24h ago`, false otherwise, false when no row); then implement

## 3. View-model hooks (TDD)

- [ ] 3.1 Write failing tests for `useUserPreferences(profileId)` (re-renders on row write, re-evaluates on profileId change, never leaks previous-profile value). Then implement in `packages/workout-spa-editor/src/hooks/use-user-preferences.ts`
- [ ] 3.2 Write failing tests for `useMatchedSessions(profileId, days)` asserting: returns `MatchedSession[]` shape, `complianceScore` from `computeComplianceScore(parseCoachingDuration(...), workout.raw.duration?.value)`, performs exactly one `useLiveQuery` over `session_matches` plus one `bulkGet` on `coachingActivities` and one `bulkGet` on `workouts` (asserted via mock-call counts on the repository), null score on missing duration. Then implement in `packages/workout-spa-editor/src/hooks/use-matched-sessions.ts`
- [ ] 3.3 Write failing tests for `useCoachingActivities` extension (joins `session_matches` to populate the view-model `matchedWorkoutId`; persisted `coachingActivities` row never carries `matchedWorkoutId`; profile switch updates the join). Then extend the existing hook
- [ ] 3.4 Write failing test for `useAutoMatchSuggestions(profileId, weekStart)` returning suggestions when not dismissed; returning `[]` when dismissal row is < 24h old; re-emitting suggestions after dismissal expires. Then implement

## 4. Visual primitives — CardShell, status/colour/icon tokens (TDD)

- [ ] 4.1 Write failing tests for a `complianceBucketToBorder(bucket)` utility mapping `"neutral" → slate-400`, `"amber" → amber-600`, `"mid" → gradient class`, `"emerald" → emerald-600`. Then implement
- [ ] 4.2 Write failing tests for `statusToColour(status)` mapping `"pending" → amber-600`, `"completed" → emerald-600`, `"skipped" → slate-500` (verifying the chosen WCAG-conformant tokens). Then implement
- [ ] 4.3 Write failing tests for `statusToIcon(status)` mapping returns lucide `Clock` / `Check` / `Minus` plus an accessible-label string. Then implement
- [ ] 4.4 Write failing render tests for `CardShell` (renders title slot with `line-clamp-2`, metadata slot, `border-l-4` in the requested colour, no overflow at 140px width, accepts `aria-label` for the card root, respects `prefers-reduced-motion` for any internal animation). Then implement in `packages/workout-spa-editor/src/components/molecules/CardShell/CardShell.tsx`
- [ ] 4.5 Write failing contrast-measurement test (using a colour-contrast utility against `#ffffff` background) asserting all three status colours (`amber-600`, `emerald-600`, `slate-500`) AND the mid-bucket sampled gradient colour (`yellow-700` per `spa-calendar` "Compliance bucket boundaries") achieve ≥ 3:1 against white. Then add the contrast assertion to CI

## 5. Card components — fix overflow + new visual language (TDD)

- [ ] 5.1 Write failing render tests for the rewritten `CoachingActivityCard`: no rose dashed border, no duplicate sport label, status-driven `border-l-4`, title `line-clamp-2`, metadata row uses `flex flex-wrap items-center gap-x-2 gap-y-0.5 min-w-0`, no element overflows the card at 140px width, every status icon has `aria-label`, sport icon has `aria-label` for the sport name. Then rewrite the component to use `CardShell`
- [ ] 5.2 Write failing render tests for `WorkoutCard` adopting `CardShell` and the same status language; preserve state-indicator priority (STALE > MODIFIED > RAW > STRUCTURED > READY > PUSHED > SKIPPED) on the lateral border + icon. Then update the component
- [ ] 5.3 Write failing tests for `MatchedSessionCard`: renders plan row + actual row in `comfortable` density; collapses to single actual row in `compact` density; lateral border uses the compliance bucket; `aria-label` includes the compliance percentage; tooltip shows "<percent>% (<actualDur>/<plannedDur>)"; null-score renders neutral `slate-400` border with `aria-label` "compliance unavailable"; visible percentage text rendered in `comfortable` density. Then implement in `packages/workout-spa-editor/src/components/molecules/MatchedSessionCard/MatchedSessionCard.tsx`
- [ ] 5.4 Add Storybook stories for `CardShell` (every status colour, long-title case) AND for all three card types (`CoachingActivityCard`, `WorkoutCard`, `MatchedSessionCard`) in both density modes (compact and comfortable). Run Storybook a11y addon and assert zero violations across all stories
- [ ] 5.5 Write failing regression test asserting all three cards render the same lateral border width (`border-l-4`) and the same status-colour token for the same status (shared visual contract); then verify pass with the shared `CardShell`

## 6. DayColumn — three-state rendering, min-width, today-as-pill, empty-day menu (TDD)

- [ ] 6.1 Write failing tests for `DayColumn` consuming three buckets (`matchedSessions`, `soloPlans`, `soloActuals`) and rendering them in the order matched → solo plan → solo actual. Then refactor `DayColumn` accordingly
- [ ] 6.2 Write failing test asserting `min-width: 140px` and that the longest possible card metadata fits without overflow at 140px. Then bump from `min-w-[120px]` to `min-w-[140px]`
- [ ] 6.3 Write failing tests asserting today rendering: pill on day-name label only (column body has no tint); column element carries `aria-current="date"`; day-name label includes a visually-hidden " (today)" span. Then update the component
- [ ] 6.4 Write failing tests for the new empty-day affordance: baseline trigger always visible (faint `+` with `aria-label="Add to <day-name>"`), expands to "+ Add" on hover/focus on hover-capable viewports, renders permanently expanded under `@media (hover: none)`, opens menu with "Plan" / "Workout" / "From template" entries, keyboard operable (Tab focuses, Enter opens, arrow keys navigate, Escape closes). Then implement
- [ ] 6.5 Write failing test asserting empty-day affordance is NOT rendered when the day has at least one matched session, solo plan, or solo actual

## 7. Calendar grid — wire up matched sessions, snap-proximity (TDD)

- [ ] 7.1 Write failing test for `CalendarWeekGrid` accepting `matchedByDay`, `coachingByDay` (solo plans only — filtered by absence of `matchedWorkoutId`), `workoutsByDay` (solo actuals only — filtered by absence of a `SessionMatch`); then update the prop shape
- [ ] 7.2 Write failing integration test for `CalendarPage` covering: a week with one matched session, one solo plan, and one solo actual on different days renders the right card type in each column. Then build the three per-day buckets in `CalendarPage` by joining the existing live queries with `useMatchedSessions`
- [ ] 7.3 Write failing test asserting the mobile horizontal scroller uses `snap-x snap-proximity` (NOT `snap-mandatory`) below the `sm` breakpoint, AND `snap-none` under `prefers-reduced-motion: reduce`. Then update the grid

## 8. CalendarHeader — week label, density toggle, sync button (TDD)

- [ ] 8.1 Write failing tests for `formatWeekLabel(weekId)` covering same-month, cross-month-same-year, cross-year. Then implement
- [ ] 8.2 Write failing test asserting `WeekNavigation` renders the new format. Then update the component
- [ ] 8.3 Write failing tests for `DensityToggle`: renders the next-state icon (LayoutGrid when current=comfortable, List when current=compact); `aria-label` and `title` read "Switch to <next> view" and update reactively after click; click invokes `setCalendarDensity` with the new density; reflects viewport-derived default when no preference exists. Then implement in `packages/workout-spa-editor/src/components/molecules/DensityToggle/DensityToggle.tsx`
- [ ] 8.4 Mount `DensityToggle` in `CalendarHeader` next to the sync button(s)
- [ ] 8.5 Write failing tests for `formatRelativeTime(Date | undefined, now: Date)` (returns `"never synced"` on undefined, `"12m ago"`, `"3h ago"`, `"2d ago"`). Then implement
      > Deferred to: #431
- [ ] 8.6 Write failing tests for the rewritten `CoachingSyncButton` connected state: 32×32 icon button with `RefreshCw`, tooltip showing `"<Label> · last sync <relative-time>"` (or `"<Label> · syncing…"`, or `"<Label> · never synced"`); not rose-coloured (uses neutral chrome `border-slate-300`, `text-slate-700`, `hover:bg-slate-100`); spinner replaces icon in-place during sync, button disabled; respects `prefers-reduced-motion` (spinner becomes static). Then update the component
- [ ] 8.7 Verify the not-connected state still renders the contextual hint per `spa-coaching-integration` — no regression test plus existing tests pass

## 9. CoachingActivityDialog — match / split actions (TDD)

- [ ] 9.1 Write failing tests for `CoachingActivityDialog` reading the joined view-model so it knows whether the activity is matched
      > Deferred to: #432
- [ ] 9.2 Write failing tests for the "Linked workout" section rendered when matched: shows the matched workout's title, sport, duration, and a "Split" button invoking `unmatchSession`. Then implement
- [ ] 9.3 Write failing tests verifying the "Convert to workout" action is hidden when the activity is already matched
- [ ] 9.4 Write failing tests for the "Match to…" action when no match exists: opens a sub-picker listing same-day same-sport unmatched workouts; selecting one invokes `matchSession({source:"manual"})`; the dialog updates to show the new linked-workout section
- [ ] 9.5 Write failing tests for the convert flow (now unconditional auto-creates the match per modified spec); update existing tests for backward compat where applicable

## 10. Auto-match suggestion banner (TDD)

- [ ] 10.1 Write failing tests for `AutoMatchBanner`: renders one row per `MatchSuggestion` with title, compliance percentage, Accept/Reject controls; "Dismiss all" control persists a dismissal via `dismissAutoMatchBanner`; banner hides when all suggestions processed; Accept invokes `matchSession({source:"auto-suggestion"})`; Reject removes the row without writing
- [ ] 10.2 Implement `AutoMatchBanner` component in `packages/workout-spa-editor/src/components/organisms/AutoMatchBanner/AutoMatchBanner.tsx`
- [ ] 10.3 Wire `AutoMatchBanner` into `CalendarPage`: render only when `useAutoMatchSuggestions(activeProfileId, weekStart)` returns ≥1 suggestion; integration test asserting it does NOT render within 24h of a dismissal
      > Deferred to: #433
- [ ] 10.4 Add Storybook story for the banner (0 / 1 / 3 suggestions states); run a11y addon

## 11. Performance budget verification

- [ ] 11.0 Add Playwright as a dev dependency to `packages/workout-spa-editor` (it is the only test framework in this stack that supports CDP CPU throttling required by the budget); add a `pnpm test:perf` script and a CI job stub
- [ ] 11.1 Write failing Playwright performance test asserting the redesigned `CalendarPage` renders within 200 ms FCP on a synthetic seeded week containing 30 cards (10 matched, 10 solo plans, 10 solo actuals) with `client.send('Emulation.setCPUThrottlingRate', { rate: 4 })`; assert `useMatchedSessions` does not contribute > 30 ms (measured via a `performance.mark` inside the hook)
      > Deferred to: #434
- [ ] 11.2 Iterate on implementation until perf test passes

## 12. Quality gates and rollout

- [ ] 12.1 Run `pnpm -r test` for the SPA package; all new and existing tests pass; coverage on `packages/workout-spa-editor` remains ≥ 70%
- [ ] 12.2 Run `pnpm lint` (lint + type check + format check) and `pnpm test:scripts` (mechanical guards); zero warnings, zero errors
- [ ] 12.3 Run Storybook a11y addon (or jest-axe in component tests) over every new story / component; zero violations. Story tasks live in 5.4 and 10.4 (after consumer components are built); 4.5 covers the contrast-measurement unit test for the colour palette and is independent of stories
- [ ] 12.4 Add an ESLint `no-restricted-imports` rule (or eslint-plugin-import path-pattern check) under `packages/workout-spa-editor/eslint.config.js` enforcing the following layer boundaries:
  - Files in `src/ports/**` SHALL NOT import from `src/adapters/**`.
  - Files in `src/application/**` SHALL NOT import from `src/adapters/**` or from React.
  - Files in `src/adapters/**` MAY import from `src/ports/**` and `src/types/**` only.
  - Files in `src/components/**` SHALL NOT import from `src/adapters/**` directly — they MUST go through `src/hooks/**` (which in turn consume application use cases). This closes the residual layer-bypass gap from D10 where a component could otherwise reach into Dexie adapters and skip the hook layer.
  - Files in `src/hooks/**` MAY import from `src/application/**`, `src/ports/**`, `src/types/**`, and React; SHALL NOT import from `src/adapters/**` directly (hooks construct application use cases passing port doubles, not adapters).

  Additionally, add a `no-restricted-syntax` rule (or a tiny custom rule) that flags any `type MatchSuggestion = ...` / `interface MatchSuggestion` declaration outside `src/application/match-suggestion.ts` — preventing the type from being silently redeclared in a UI component. Add regression tests for each rule that an intentional violation fails the lint

- [ ] 12.4a Verify or add a `deleteProfile(profileId)` use case (or extend the existing one) that wraps the profile delete in `db.transaction('rw', [profiles, coachingActivities, session_matches, user_preferences, auto_match_dismissals], ...)` so all chained Dexie cascade hooks run inside a single transaction. Add an integration test that forces an abort mid-fan-out and asserts all five tables roll back to the pre-delete state
      > Deferred to: #435
- [ ] 12.5 Confirm the release pipeline supports a staged rollout for the SPA bundle (5% → 25% → 100%); if not, document a manual canary deploy procedure in the PR description (deploy to a preview URL, verify, then promote to prod). Document the forward-only rollback constraint (per design D12) in the release notes
- [ ] 12.6 Manually verify in the dev server: open `/calendar` on a desktop viewport (1440px), confirm no card overflow on a week with multi-line titles and `pending` activities; toggle density both ways and confirm the toggle's accessible name AND `aria-pressed` update; tab through the grid and confirm one tab stop per day column with arrow-key traversal within; resize to mobile (375px) and confirm `comfortable` default + `snap-proximity` scroll + permanently visible empty-day "+ Add" trigger; click an activity and verify the dialog shows the right match controls; use VoiceOver / NVDA to navigate today column and confirm "(today)" is announced; toggle `prefers-reduced-motion` in the OS and confirm spinner becomes static and `snap-none` applies
- [ ] 12.7 Confirm whether `@kaiord/workout-spa-editor` is part of the changeset workflow (it is private per `package.json`); if NOT, skip changeset; if yes, add a changeset describing the visible behaviour changes
- [ ] 12.8 Confirm `openspec validate calendar-coaching-redesign --strict` passes one final time before opening the PR
