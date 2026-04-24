## 1. Focus telemetry port + default

- [x] 1.1.a Write failing test for `FocusTelemetryEvent` discriminated union — asserting exhaustive switch coverage via `never` assertion
- [x] 1.1.b Define `FocusTelemetry` type and `FocusTelemetryEvent` union (five variants: `wiring-canary`, `unresolved-target-fallback`, `form-field-short-circuit`, `overlay-deferred-apply`, `focus-error`) in `src/store/providers/focus-telemetry.ts`
- [x] 1.1.c Implement and export `defaultFocusTelemetry: FocusTelemetry = () => {}`
- [x] 1.2.a Write failing test asserting a custom `FocusTelemetry` throwing an exception does not interrupt focus behavior; a dev-only `console.warn` is emitted at the call site
- [x] 1.2.b Implement a small `safeEmit(telemetry, event)` wrapper that try/catches the call and dev-warns on failure
- [x] 1.3.a Write failing test asserting event payloads contain no `ItemId`, no step/block names, no workout titles — assert via exhaustive property check that only enumerated fields appear
- [x] 1.3.b Implement event constructors as pure factory functions (`unresolvedTargetFallbackEvent`, `formFieldShortCircuitEvent`, etc.) to centralize payload shape

## 2. FocusTelemetryContext

- [x] 2.1.a Write failing test asserting a `FocusTelemetryContext.Provider` wraps the editor and exposes the current `FocusTelemetry` via `useFocusTelemetry()`
- [x] 2.1.b Implement `src/contexts/focus-telemetry-context.tsx` with memoized context value and `defaultFocusTelemetry` fallback when no provider is mounted
- [x] 2.1.c Wire the provider into `WorkoutList` (or its immediate ancestor) so the hook has a consumer; document in the SPA bootstrap README
- [x] 2.1.d Add a dev-build-only ref-stability guard in `FocusTelemetryContext.Provider`: store the incoming `value` in a `useRef`; if the ref identity changes between renders AND `import.meta.env.DEV`, emit `console.warn` once per mount: "FocusTelemetry provider value changed reference — wrap in useCallback to preserve context memoization". Gated behind DEV so production builds are warning-free

## 3. Wire telemetry into existing short-circuit paths

- [x] 3.1.a Write failing test asserting the unresolved-target fallback emits `{ type: 'unresolved-target-fallback', targetKind, fallback }` with the correct `fallback` for each of the three branches (empty-state, first-item, heading)
- [x] 3.1.b Emit the event immediately before the fallback focus call
- [x] 3.2.a Write failing test asserting the form-field short-circuit emits `{ type: 'form-field-short-circuit' }` and is debounced to at most one event per 1000 ms per hook instance (five short-circuits within 500 ms produce exactly one event)
- [x] 3.2.b Emit the event in the short-circuit branch with a `useRef<number>(0)` timestamp guard implementing the 1000 ms debounce
- [x] 3.3.a Write failing test asserting the overlay-deferred-apply emits `{ type: 'overlay-deferred-apply', deferredForMs }` with `deferredForMs === Math.round(measuredMs / 100) * 100` (quantized to 100 ms buckets) and always a non-negative integer
- [x] 3.3.b Implement `performance.now()` capture at both ends; apply the quantization and integer conversion before emission
- [x] 3.4.a Write failing test asserting a `{ type: 'wiring-canary' }` event fires exactly once on editor mount when a non-default `FocusTelemetry` is provided; no event fires when the default no-op is used (since the no-op swallows it)
- [x] 3.4.b Implement canary emission in `useFocusAfterAction`'s initial mount `useLayoutEffect` via a **module-level** `let hasFiredCanaryThisSession = false` boolean (NOT a per-instance `useRef` — Strict Mode double-mount creates two refs). On first mount of the editor session, check + set the module-level flag; subsequent mounts in the same page-load session do not re-emit. On page reload the module re-initializes and the flag resets — correct semantics (a reload IS a new deployment session from the canary's perspective). Add a dev-only HMR reset so editing adjacent files during local dev doesn't suppress the canary in subsequent test mounts: `if (import.meta.hot) import.meta.hot.accept(() => { hasFiredCanaryThisSession = false; });`
- [x] 3.5.a Write failing test asserting the `finally`-block recovery from a `focus()` or `scrollIntoView()` throw emits `{ type: 'focus-error', phase }`
- [x] 3.5.b Emit the event inside the catch clause (not in `finally` — we only emit when an error actually occurred)

## 4. Structural history refactor (ATOMIC PR)

> This task group is a single atomic PR. The rename `workoutHistory` + `selectionHistory` → `undoHistory` breaks every consumer in a single type-propagation step; intermediate commits would fail `pnpm -r build`. All 4.x tasks land together.

- [x] 4.0 Before opening the refactor PR, post a complete consumer inventory as a PR comment: run `rg 'workoutHistory|selectionHistory' packages/workout-spa-editor` and list every file, grouped by category (reducers, selectors, Zustand devtools labels, Dexie persistence code, tests). Reviewers use this list to confirm the rename surface is complete. Acceptance criterion: after merge, the same rg returns zero matches.
- [x] 4.1.a Write failing test asserting the new `HistoryEntry` shape (`{ workout: UIWorkout; selection: ItemId | null }`) and `undoHistory: UndoHistory` typing on `WorkoutStore`
- [x] 4.1.b Introduce `HistoryEntry` and `UndoHistory` types in `src/store/workout-state.types.ts` (alongside `UIWorkout`); update `WorkoutStore.undoHistory: UndoHistory` typing and remove `workoutHistory`/`selectionHistory` fields. Name is `undoHistory` to avoid lexical collision with `window.history` in destructured store consumers
- [x] 4.2.a Write failing test asserting `pushHistorySnapshot(entry: HistoryEntry)` pushes a single tuple atomically; signature is 1-arg (tuple), NOT the base's 2-arg form
- [x] 4.2.b Refactor `pushHistorySnapshot` to the 1-arg signature; update every call site to pass `{ workout, selection }` literals; remove the dev-mode length assertion (it is now structurally enforced)
- [x] 4.3.a Write failing test asserting `undo` reads the paired `{ workout, selection }` snapshot and passes `selection` to the focus-rule helpers as the pre-mutation selection for fallback
- [x] 4.3.b Refactor every `undo`/`redo`/`undoDelete` reducer to read `undoHistory[i].workout` and `undoHistory[i].selection`
- [x] 4.4.a Write failing test asserting `clearWorkout` resets `undoHistory` to an empty array and `historyIndex` to its initial value
- [x] 4.4.b Update `clearWorkout` implementation
- [x] 4.5 Delete the dev-mode length assertion in `pushHistorySnapshot` AND the `workoutHistory.push`-only-in-helper CI grep step (both introduced by the base change) — no longer needed since the parallel arrays don't exist; remove the step from `.github/workflows/ci.yml`
- [x] 4.6 Verify `pnpm lint && pnpm -r build && pnpm -r test` at the PR head

## 5. E2E automation

- [x] 5.0 Measure current `workout-spa-editor-e2e.yml` wall-clock duration on `ubuntu-latest`; commit the baseline as a comment at the top of the workflow file: `# Baseline wall-clock (<YYYY-MM-DD>, ubuntu-latest): X min; focus-management spec budget: +30% max.` This makes future CI-duration regressions queryable without PR archaeology. Also add a CI enforcement step to the workflow: after tests complete, read the elapsed duration and fail if it exceeds `baseline * 1.3`. Use `${{ steps.test.outputs.duration }}` (or equivalent from the Playwright reporter) + a `shell: bash` comparison; output a GitHub summary comment when the budget is exceeded. Alternative if GH Actions duration extraction is fragile: mark the comment as advisory-only and document the manual PR-review expectation. Commit the chosen mechanism in the workflow file.
- [x] 5.1.a Create `packages/workout-spa-editor/e2e/fixtures/focus-workout.krd.json` with 5 top-level steps and 1 repetition block (2 children), each with **distinct, non-colliding, realistic** human-readable names: "Warm-up 10 min", "Interval 1 — Z4 push", "Recovery 1 min", "Interval 2 — Z4 hold", "Cooldown 5 min", block "2x Interval Set" with children "Block step A — Z3 tempo" and "Block step B — Z3 recover". Names MUST be exact-match unique so `toHaveAccessibleName` cannot ambiguously hit multiple elements
- [x] 5.1.b Create `packages/workout-spa-editor/e2e/focus-management.spec.ts` loading the fixture. No `data-testid` additions; all selectors use `page.getByRole('listitem', { name: ... })` or `page.locator(':focus')` with `toHaveAccessibleName()`
- [x] 5.2.a Write failing Playwright tests for the matrix from design Decision 3: {Delete-single, Delete-multi, Paste, Duplicate, Reorder, Group, Ungroup, Undo, Redo} × {Keyboard, Context menu, Toolbar} where applicable. Each cell uses `await expect(page.locator(':focus')).toHaveAccessibleName('<expected step name>')`
- [x] 5.2.b Implement test helpers: `triggerViaKeyboard(page, action)`, `triggerViaContextMenu(page, action, targetName)`, `triggerViaToolbar(page, action)` — all helpers locate targets by accessible name, not testid
- [x] 5.3.a Extend `.github/workflows/workout-spa-editor-e2e.yml` to include `focus-management.spec.ts` in its test matrix across Chromium, Firefox, and WebKit
- [x] 5.3.b Verify the workflow passes on a clean main branch before the focus-management spec itself can fail
- [x] 5.4 Add a PR-template checklist item in `.github/pull_request_template.md`: "If this PR adds a new UI affordance for a step/block mutation (toolbar button, context-menu item, keyboard shortcut), I have updated the focus-management E2E matrix and added the corresponding test cell"

## 6. StrictMode re-run of integration tests

- [x] 6.1.a Identify focus integration test files in `packages/workout-spa-editor/src/`. Wrap each `describe` block covering focus-hook behavior with the following pattern. `FocusRegistryContext` is imported from the base change's `src/contexts/focus-registry-context.tsx` (introduced in base Decision 3); `FocusTelemetryContext` is introduced in this change (task 2.1.b):
  ```ts
  describe.each([
    { mode: 'standard', Wrapper: Fragment },
    { mode: 'strict', Wrapper: StrictMode },
  ])('focus integration [$mode]', ({ Wrapper }) => {
    const wrapper = ({ children }: PropsWithChildren) => (
      <Wrapper>
        <FocusTelemetryContext.Provider value={telemetrySpy}>
          <FocusRegistryContext.Provider value={registry}>
            {children}
          </FocusRegistryContext.Provider>
        </FocusTelemetryContext.Provider>
      </Wrapper>
    );
    // tests use renderHook(hook, { wrapper }) and render(ui, { wrapper })
  });
  ```
  so each assertion runs twice, once per mode
- [x] 6.1.b Write a failing test demonstrating a deliberately-broken Strict Mode interaction (e.g., double-registration missing the identity guard); confirm the `describe.each` re-run catches it
- [x] 6.1.c Remove the failing test; commit the Strict Mode wrapper infrastructure
- [x] 6.1.d Write failing test asserting the `wiring-canary` emission does NOT double-fire under Strict Mode: mount → Strict Mode double-invokes → exactly one canary
- [ ] 6.2 Verify the CI wall-clock duration for the focus integration suite remains within the project's CI budget (target: <2× previous duration); document the before/after timing in the PR description

## 7. Accessibility evidence directory

- [x] 7.1 Create `packages/workout-spa-editor/docs/accessibility-evidence/YYYY-MM-DD-focus-management/` (date = merge date of this hardening PR)
- [ ] 7.2 Record a VoiceOver session on macOS performing delete → paste → undo → group → ungroup on the fixture; capture the transcript in `voiceover-macos.md` with timestamps and announcement annotations. **Pin exact versions at capture time** in the log header: macOS version (e.g., "macOS 15.3"), VoiceOver version (matches macOS), browser (e.g., "Safari 18.3"). The quarterly refresh cron re-captures against the then-current latest and updates these pins
- [ ] 7.3 Record an equivalent session on Windows; capture `nvda-windows.md` with pinned versions in the log header: NVDA version (e.g., "NVDA 2024.4.1"), Windows version (e.g., "Windows 11 23H2"), browser (e.g., "Firefox 133.0")
- [ ] 7.4 Capture Accessibility Inspector screenshots (macOS) and NVDA speech viewer screenshots (Windows) for each scenario; save under `screenshots/`
- [x] 7.5 Write `README.md` in the evidence directory with a concrete regeneration runbook (not elided). Specify exact tools and procedures:
  - **VoiceOver (macOS):** enable VoiceOver (⌘F5), open Accessibility Inspector (Xcode → Open Developer Tool), enable "Speech" panel with timestamps; run the fixture workout's action sequence; export from Accessibility Inspector → Speech panel → "Save Log". Name the export `voiceover-macos.log` with ISO date prefix.
  - **NVDA (Windows):** NVDA Speech Viewer does NOT display timestamps natively, and the NVDA "Braille Display → Timestamps" setting applies only to braille output, not to Speech Viewer. For timestamped capture use one of: (a) set NVDA log level to "Debug" (NVDA menu → Preferences → Settings → General → Logging level: Debug), reproduce the sequence, then read the timestamped speech events from `%APPDATA%\nvda\nvda.log` (filter lines containing "speakText" / "speakMessage"); OR (b) install the **SpeechLogger** NVDA add-on, which writes timestamped speech to a log file. Prefer (a) for reproducibility without extra dependencies. Copy the filtered log to `nvda-windows.log`.
  - Fixture: reference `packages/workout-spa-editor/e2e/fixtures/focus-workout.krd.json` (committed in task 5.1.a) — no per-run fixture variation allowed.
  - Acceptance: a fresh contributor following this runbook produces transcripts that diff against the committed baseline at ≤10% changed lines (mostly timestamp drift) — not structural changes.
- [x] 7.6 Reference the evidence directory path in the changeset body (task 9.1 below)
- [x] 7.7 Create `.github/ISSUE_TEMPLATE/refresh-accessibility-evidence.md` containing the regeneration checklist (VoiceOver script, NVDA script, screenshot locations, acceptance criteria)
- [x] 7.8 Create `.github/workflows/accessibility-evidence-refresh.yml` with a `schedule` cron `0 0 1 */3 *` (first day of each quarter) that opens the issue automatically; include manual `workflow_dispatch` trigger; tag the issue with `accessibility` + `maintenance` labels; populate assignees by reading the GitHub CODEOWNERS API in a workflow step (`gh api /repos/{owner}/{repo}/contents/CODEOWNERS` + parse for workout-spa-editor owners) OR fall back to a hardcoded list defined in the workflow as a repo variable (`${{ vars.A11Y_EVIDENCE_ASSIGNEES }}`). The issue body template MUST include an explicit due date computed as `cron_trigger_date + 14 days` and an acceptance-criteria checkbox referencing the 10% diff gate from task 7.5
- [x] 7.9 Add a reviewer-checklist item in `.github/pull_request_template.md` (or in the repo-level CODEOWNERS procedure): "If this PR bumps React, Radix, or Zustand to a new major version, AT evidence MUST be refreshed and committed before merge"

## 8. Quality gates

- [x] 8.1 `pnpm -r test` — all tests pass (existing + new + Strict Mode re-run), zero warnings
- [x] 8.2 `pnpm lint` — zero errors, zero warnings (workout-spa-editor; docs package excluded — pre-existing Node 22 requirement)
- [x] 8.3 `pnpm -r build` — zero build warnings
- [ ] 8.4 `pnpm -F @kaiord/workout-spa-editor test:e2e` — Playwright `focus-management.spec.ts` passes in Chromium, Firefox, WebKit (script name `test:e2e` verified against current `package.json`)
- [x] 8.5 `find packages/workout-spa-editor/src -type f \( -name '*.ts' -o -name '*.tsx' \) ! -name '*.test.ts' ! -name '*.test.tsx' -exec wc -l {} \; | awk '$1 > 100 && $2 != "total"'` — zero rows for new files (pre-existing violations untouched)
- [ ] 8.6 Manual verification: wire a spy telemetry function; exercise each of the five event types (wiring-canary, unresolved-target-fallback, form-field-short-circuit, overlay-deferred-apply, focus-error); confirm spy receives the expected payloads with structural fields only; verify `deferredForMs` is always a multiple of 100 and `form-field-short-circuit` is debounced

## 9. Documentation and changeset

- [x] 9.1 Add a changeset (`pnpm exec changeset`) describing the hardening improvements; reference the AT evidence directory path
- [x] 9.2 Update `src/store/README.md` to document:
  - The new `undoHistory: Array<HistoryEntry>` shape and the removal of the parallel-array invariant + its CI grep
  - The `FocusTelemetry` port with example wiring for Sentry AND Datadog RUM (two minimal code snippets); note that the wired function MUST be a stable reference (defined outside the render tree or wrapped with `useCallback`) — inline arrows invalidate the context value every render
  - A post-deploy smoke-test procedure: "Open the editor, perform a delete, verify at least one `wiring-canary` or mutation-driven event arrived in the telemetry dashboard within 60 seconds; absence indicates wiring failure"
  - **Event-to-severity alert guidance table** for ops (thresholds below are starting points — tune to actual DAU):

    | Event                        | Expected rate                                           | Suggested alert (P)                                                        | Response playbook                                                                                       |
    | ---------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
    | `wiring-canary`              | One per editor mount with wired telemetry               | Info; **absence >30 min during editor-active hours = P3** (missing-canary) | Verify the deployment includes the telemetry provider; if absent, re-deploy with the correct env wiring |
    | `focus-error`                | Near zero (should never fire in correct implementation) | **Any occurrence = P2 error**                                              | Inspect stack-trace field in event; identify the throwing element; file a regression bug                |
    | `unresolved-target-fallback` | Low, occasional (race conditions acceptable)            | Info; **sustained elevation ≥5× baseline for 6h = P3**                     | Check for recent changes to component unmount ordering or ref-registration                              |
    | `form-field-short-circuit`   | Per-user, moderate (debounced)                          | Debug; not pageable                                                        | Statistical monitoring only                                                                             |
    | `overlay-deferred-apply`     | Per-user, moderate                                      | Debug; outlier `deferredForMs` ≥5000 may indicate UI stall                 | Investigate dialog-close handlers for long-running work                                                 |

    **Post-deploy missing-canary auto-alert pattern:** configure a continuous check on your telemetry dashboard — if `wiring-canary` event count over a 30-minute rolling window is zero during editor-active hours (09:00–22:00 in the deployment's configured `TELEMETRY_TIMEZONE`; defaults to UTC if unset), fire a P3 alert. Document `TELEMETRY_TIMEZONE` as an ops configuration variable alongside the telemetry-backend credentials. For single-user local installations where editor-active hours are effectively 24/7 within the user's timezone, the rolling window can be widened to 2 hours.

  - **Incident ownership guidance:** "For deployed installations, alerts should be paged per the deployment's internal on-call runbook. For the open-source reference deployment, `focus-error` SHOULD result in a GitHub issue filed against the repo with the `incident` label and assigned to the workout-spa-editor CODEOWNERS."
  - **Desktop-AT version-drift policy:** "AT evidence is considered valid for AT + OS + browser versions within one major release of the pinned version in the evidence directory's README. Outside that window, the quarterly refresh cron (or a dependency-bump-triggered manual refresh) re-captures evidence against then-current versions."

- [x] 9.3 Update `WorkoutList/README.md` to reference the AT evidence directory as the regression-comparison baseline
- [ ] 9.4 Run `/opsx-verify spa-editor-focus-management-hardening` and resolve any mismatches
- [ ] 9.5 Run `/opsx-verify spa-editor-focus-telemetry` and resolve any mismatches
- [ ] 9.5.a Prerequisite check before `/opsx-apply`: confirm BOTH `rg 'selectionHistory' openspec/specs/spa-editor-focus-management/spec.md` AND `rg 'workoutHistory' openspec/specs/spa-editor-focus-management/spec.md` return matches from the base change (double-grep proves the base is applied even if a future refactor renamed one of the two). If either returns zero matches, abort — apply the base first
- [ ] 9.6 Run `/opsx-verify spa-editor-focus-management` and confirm the delta applied correctly (no stale "parallel arrays" scenarios remain on `main`; every `selectionHistory` → `undoHistory[...].selection` rename is reflected)
- [ ] 9.7 After PR merge, run `/opsx-archive spa-editor-focus-management-hardening`
