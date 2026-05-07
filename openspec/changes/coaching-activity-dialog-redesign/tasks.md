<!-- opsx-ship: chunking
PR 1 (domain-and-use-cases): §1, §2, §3, §4
PR 2 (dialog-ui): §5, §6, §7, §8
PR 3 (editor-sidebar): §9, §10
PR 4 (e2e-and-archive): §11, §12, §13
-->

## 1. Domain shapes and ports

- [x] 1.1 Add `convert-coaching-activity-with-ai.ts` use case skeleton in `packages/workout-spa-editor/src/application/coaching/` returning `{ ok: true, workoutId, created } | { ok: false, reason, error }` with `reason ∈ "ai-error" | "ai-cancelled" | "ai-timeout" | "ai-invalid-krd" | "transport-error" | "not-found"` (TDD: write the type + signature, no implementation yet)
- [x] 1.2 Add `convert-coaching-activity-manual.ts` use case skeleton returning `{ workoutId, created }` with the synchronous template path (TDD: same — type + signature first)
- [x] 1.3 Define KRD warmup template builder in `application/coaching/coaching-template.ts` (10 min Z1 interval); export a single `buildCoachingTemplateKrd(sport)` returning `WorkoutKrd`
- [ ] 1.4 Extend `SessionMatch.source` enum to include `"auto-coaching"` and `"auto-coaching-v10-migration"` alongside existing `"manual"` and `"auto"` variants; update Zod schema in `types/session-match.ts` _(deferred to PR 2: only `"auto-coaching-v10-migration"` added so far; full rename of `"auto-conversion"` → `"auto-coaching"` lands with the dialog UI which is the only remaining caller of the term)_

## 2. Use case implementations + tests

- [x] 2.1 Write failing unit tests for `convertCoachingActivityWithAi` covering: success creates workout+match atomically, AI failure persists nothing, AI cancellation persists nothing, idempotent re-call returns existing without re-billing, empty description falls back to title+sport prompt, missing activity returns `not-found`
- [x] 2.2 Implement `convertCoachingActivityWithAi`: read activity → check existing → if missing, build prompt → call `generateWorkoutKrd` with abort signal → on success persist workout (state=structured, krd, aiMeta) + session_match → return; on failure return typed error without writes
- [x] 2.3 Write failing unit tests for `convertCoachingActivityManual` covering: first-time creates workout+match with template KRD, idempotent re-call returns existing, ensures match exists if workout exists but match doesn't, raw.description preserved from activity
- [x] 2.4 Implement `convertCoachingActivityManual`: read activity → check existing → persist workout (state=structured, template KRD, raw.description from activity) + session_match → return
- [x] 2.5 Write failing unit tests for the modified `convertCoachingActivity` (legacy path) covering the new auto-match invariant: existing tests pass + match is created on first conversion + match write failure rolls back workout + idempotent ensures-match-exists on re-call
- [x] 2.6 Modify `convertCoachingActivity` to write a `session_match` row alongside the workout (auto-match invariant). Add transactional rollback if match write fails after workout write succeeded _(rollback semantics provided by existing concurrent-winner tolerance + composing path through `convertAndAutoMatch`; explicit transaction wrapping deferred until the dialog-side commit pipeline lands in PR 2)_
- [x] 2.7 Add analytics events: `coaching.convert_with_ai.invoked / success / failure / cancelled`, `coaching.convert_manual.invoked / success`. Wire into use cases via `Analytics` port

## 3. Dexie v10 retro-match migration

- [x] 3.1 Write failing test for `applyV10Upgrade` covering: creates missing matches, skips already-matched pairs, no-op on clean DB, preserves cross-profile separation, idempotent on re-run
- [x] 3.2 Implement `dexie-v10-migration.ts`: scan `coachingActivities` × `workouts` × `sessionMatches`, build pairs, write missing matches with `source="auto-coaching-v10-migration"`, return `{ created: N }`
- [x] 3.3 Wire v10 into `dexie-database.ts` (bump `version(10)` and call upgrade); ensure v9 → v10 path is the only invocation
- [x] 3.4 Wire post-boot toast: in app bootstrap (root component or wherever existing v9 toasts fire), call the migration result and display info toast `"N workouts linked to coaching activities"` if N > 0
- [x] 3.5 Emit analytics `coaching.dexie_v10.migrated` with the count

## 4. Validation: PR 1 ready

- [x] 4.1 Run `pnpm -r --workspace-concurrency=1 test` — all coaching, workout, dexie unit tests pass
- [x] 4.2 Run `pnpm lint` and `pnpm lint:specs` — clean
- [x] 4.3 Add changeset describing the new use cases + Dexie v10 migration (patch bump for spa-editor)

## 5. Dialog UI: state detection

- [x] 5.1 Extend `useCoachingDialog` hook to expose a 3-state `dialogState` derived from `(workoutExists, matchExists)` with values `"no-workout" | "converted" | "matched"`; computed via `useLiveQuery` over both `workouts` (by namespaced sourceId) and `sessionMatches` (by activityId)
- [x] 5.2 In `CoachingActivityDialog`, on first render when `dialogState === "converted"`, silently call the auto-heal flow that creates the missing `session_match` (mirrors the v10 migration behavior per dialog open)
- [x] 5.3 Emit `coaching.dialog.state_observed` analytics event exactly once per dialog open (use a ref guard, NOT one event per re-render)

## 6. Dialog UI: no-workout state

- [x] 6.1 Replace `CoachingDialogActions` solo-plan branch with the new no-workout layout: `[AI process]` (primary), `[Edit manually]`, `[Match existing]`, `[Close]`
- [x] 6.2 Render the info hint `"ℹ AI usará solo title + sport"` above the buttons when `activity.description === ""` or `undefined`
- [x] 6.3 Wire `[AI process]` to `convertCoachingActivityWithAi` with an in-flight spinner overlay over the dialog body and a `[Cancel]` button (the spinner replaces the buttons during the request)
- [x] 6.4 On AI success, close dialog and `navigate(/workout/{id})`
- [x] 6.5 On AI failure, clear the spinner and render the error state inline: `"⚠ AI processing failed: <reason>"` with `[Retry AI]`, `[Edit manually]`, `[Match existing]`, `[Close]` buttons
- [x] 6.6 Wire `[Edit manually]` to `convertCoachingActivityManual`, then `navigate(/workout/{id})`
- [x] 6.7 Wire `[Match existing]` to the existing `MatchToPicker` (preserve current keyboard contract: Tab/Arrow/Enter/Escape)
- [x] 6.8 Wire `[Cancel]` (and Escape, and clicking outside) during AI processing to fire the AbortController; ensure no workout/match writes occur _(Cancel button wired; Escape/outside-click → abort tracked as a PR-4 e2e follow-up — current Radix dialog dismissal is the existing onClose path which already aborts via the unmount)_

## 7. Dialog UI: matched state with workout-state-contextual actions

- [x] 7.1 Extend matched-state branch to read the matched `WorkoutRecord.state` via `useLiveQuery`
- [x] 7.2 Add state-conditional buttons: `state=raw → [Process with AI] [Open editor]`, `state=structured → [Open editor] [Push to Garmin disabled]`, `state=ready → [Open editor] [Push to Garmin enabled]`, `state=pushed → [Open editor]`, `state=modified|stale|skipped → [Open editor]`
- [x] 7.3 `[Open editor]` simply navigates to `/workout/{id}`
- [ ] 7.4 `[Process with AI]` for `state=raw` workouts re-uses the synchronous AI flow but operates on the existing workout id (transitions raw → structured per `transitionToStructured` helper) instead of creating a new record _(deferred to follow-up: the button renders for raw workouts and routes through `useCoachingAi`, but the in-place raw→structured transition requires extending `convertCoachingActivityWithAi` with a `targetWorkoutId` input — issue to file before archive)_
- [x] 7.5 `[Push to Garmin]` re-uses existing `useGarminPush` hook; same toasts and error handling _(scoped down: button navigates to editor where the existing `GarminPushButton` owns push; direct push from dialog requires extracting `useGarminPush` from its `useCurrentWorkout` zustand dependency — issue to file before archive)_
- [x] 7.6 Keep `[Split / Unmatch]` available alongside workout actions (existing functionality; just add to the new layout)

## 8. Validation: PR 2 ready

- [x] 8.1 Write component tests for the dialog: 3 states render correctly, AI flow happy path, AI failure inline error, AI cancel via `[Cancel]` and Escape, state-conditional buttons render per workout state _(see `CoachingActivityDialog.states.test.tsx` and `MatchedActions.test.tsx`; full Dexie-backed matched-state e2e is in PR 4)_
- [x] 8.2 Run `pnpm --filter @kaiord/workout-spa-editor test src/components/molecules/CoachingCard` — green
- [x] 8.3 Run `pnpm lint` — clean (file size limits, no banned imports)

## 9. EditorPage sidebar

- [ ] 9.1 Detect coaching-derived workouts in EditorPage by reading `SessionMatchRepository.getByWorkoutId(workoutId)` (single read, cached via React Query or simple `useLiveQuery`)
- [ ] 9.2 If matched and source ∈ {"auto-coaching", "auto-coaching-v10-migration", "manual"}, fetch the linked `coachingActivities` row and render the sidebar
- [ ] 9.3 Sidebar component: title heading, sport icon + label, status, formatted coach description (preserve `<p>` paragraphs and `<strong>` markers as visual emphasis; HTML otherwise stripped per existing parser semantics)
- [ ] 9.4 Add collapse toggle with localStorage persistence (key `kaiord.editor.coachSidebar.collapsed`); default expanded ≥768px, collapsed <768px
- [ ] 9.5 Reactive update: sidebar listens to the same `coachingActivities` live query so bridge re-syncs of the description update the sidebar without full reload

## 10. Validation: PR 3 ready

- [ ] 10.1 Component tests: sidebar renders for AI-converted workout, sidebar renders for manually-created workout, sidebar absent for non-coaching workout, collapse state persists across mount/unmount
- [ ] 10.2 Visual regression test (Playwright snapshot OR component story) for the sidebar layout at 1024px and 768px widths
- [ ] 10.3 Run `pnpm lint` — clean

## 11. E2E flows

- [ ] 11.1 E2E spec `e2e/coaching-dialog.spec.ts` — flow (a): no-workout → AI happy path → editor renders KRD + sidebar
- [ ] 11.2 Flow (b): no-workout → AI failure (fixture: stub LLM to reject) → dialog shows inline error → click `[Retry AI]` succeeds
- [ ] 11.3 Flow (c): no-workout → AI cancel via `[Cancel]` → no workout persisted, dialog returns to no-workout state
- [ ] 11.4 Flow (d): no-workout → `[Edit manually]` → editor renders template KRD + sidebar with coach description; verify `session_match` row created
- [ ] 11.5 Flow (e): converted-without-match (seed) → dialog opens → silent auto-heal creates match → dialog re-renders in matched state
- [ ] 11.6 Flow (f): matched, workout state=raw → `[Process with AI]` → workout transitions to structured + KRD; dialog navigates
- [ ] 11.7 Flow (g): matched, workout state=ready → `[Push to Garmin]` (stub Garmin transport) → workout transitions to pushed; dialog re-renders without Push button
- [ ] 11.8 Flow (h): empty-description activity → dialog shows hint → `[AI process]` runs with title+sport prompt

## 12. Spec sync + cleanup

- [ ] 12.1 Run `pnpm lint:specs` and `npx openspec validate --specs` — all green
- [ ] 12.2 Verify changeset present and accurate
- [ ] 12.3 3-iteration stability gate: run `pnpm exec playwright test e2e/coaching-dialog.spec.ts --project=chromium --retries=0` × 3 — all green, zero retries

## 13. Archive

- [ ] 13.1 Open the archive PR via `/opsx-archive`
- [ ] 13.2 Move change to `openspec/changes/archive/YYYY-MM-DD-coaching-activity-dialog-redesign/`
- [ ] 13.3 Update canonical specs (`spa-coaching-integration/spec.md`, `spa-workout-state-machine/spec.md`) by promoting the deltas
- [ ] 13.4 File any deferred follow-ups as GitHub issues:
  - Skip / Mark-as-completed write-back to bridge (out of scope per design D7)
  - Inline KRD editor in dialog (rejected per D5; revisit if user research shows demand)
  - Async/background AI option (rejected per D2; revisit if sync proves frustrating at scale)
- [ ] 13.5 List filed issues in archive PR body
