## 1. Focus telemetry port + default

- [ ] 1.1.a Write failing test for `FocusTelemetryEvent` discriminated union — asserting exhaustive switch coverage via `never` assertion
- [ ] 1.1.b Define `FocusTelemetry` type and `FocusTelemetryEvent` union in `src/store/providers/focus-telemetry.ts`
- [ ] 1.1.c Implement and export `defaultFocusTelemetry: FocusTelemetry = () => {}`
- [ ] 1.2.a Write failing test asserting a custom `FocusTelemetry` throwing an exception does not interrupt focus behavior; a dev-only `console.warn` is emitted at the call site
- [ ] 1.2.b Implement a small `safeEmit(telemetry, event)` wrapper that try/catches the call and dev-warns on failure
- [ ] 1.3.a Write failing test asserting event payloads contain no `ItemId`, no step/block names, no workout titles — assert via exhaustive property check that only enumerated fields appear
- [ ] 1.3.b Implement event constructors as pure factory functions (`unresolvedTargetFallbackEvent`, `formFieldShortCircuitEvent`, etc.) to centralize payload shape

## 2. FocusTelemetryContext

- [ ] 2.1.a Write failing test asserting a `FocusTelemetryContext.Provider` wraps the editor and exposes the current `FocusTelemetry` via `useFocusTelemetry()`
- [ ] 2.1.b Implement `src/contexts/focus-telemetry-context.tsx` with memoized context value and `defaultFocusTelemetry` fallback when no provider is mounted
- [ ] 2.1.c Wire the provider into `WorkoutList` (or its immediate ancestor) so the hook has a consumer; document in the SPA bootstrap README
- [ ] 2.1.d Add a dev-build-only ref-stability guard in `FocusTelemetryContext.Provider`: store the incoming `value` in a `useRef`; if the ref identity changes between renders AND `import.meta.env.DEV`, emit `console.warn` once per mount: "FocusTelemetry provider value changed reference — wrap in useCallback to preserve context memoization". Gated behind DEV so production builds are warning-free

## 3. Kill-switch context

- [ ] 3.1.a Write failing tests for `useFocusKillSwitch()` covering the full 2×4 truth table: localStorage in {unset, 'on', 'off', other} × env in {unset, 'on', 'off'}; verify localStorage 'on' force-enables even when env is 'off'
- [ ] 3.1.b Implement `src/hooks/use-focus-kill-switch.ts` exposing `useFocusKillSwitch(): boolean` via `useSyncExternalStore`. `getSnapshot` returns a primitive boolean (reads `localStorage.kaiordFocusManagement` + a module-cached `VITE_KAIORD_FOCUS_MANAGEMENT` read once at module load; the env var is NOT subscribed since it is compile-time constant). `subscribe(onStoreChange)` attaches listeners to BOTH the cross-tab `storage` event AND a same-tab custom event `kaiord:focus-kill-switch-change` (since browsers do not fire `storage` in the writing tab), and MUST return a cleanup function that calls `window.removeEventListener` for BOTH listeners. `useSyncExternalStore` bails on unchanged primitive values via `Object.is` — no "getSnapshot should be cached" warning
- [ ] 3.1.c Write failing test asserting same-tab `localStorage.setItem(...)` WITHOUT dispatching the custom event leaves the hook cached; assert the next `window.dispatchEvent(new Event('kaiord:focus-kill-switch-change'))` triggers the hook to re-read
- [ ] 3.1.d Expose a dev-build-only `window.__kaiordReloadFocusKillSwitch()` helper that sets localStorage AND dispatches the custom event in one call; guard behind `import.meta.env.DEV`
- [ ] 3.2.a Write failing test asserting that when the kill-switch is active, `useFocusAfterAction` reads and clears `pendingFocusTarget` but does NOT call `focus()` on any element
- [ ] 3.2.b Wire the kill-switch read into `useFocusAfterAction`
- [ ] 3.3.a Write failing test asserting the kill-switch emits a `kill-switch-active` telemetry event on each false→true transition within a hook instance (not merely once per lifetime); consecutive renders with the value staying true emit nothing; a true→false→true cycle emits a fresh event
- [ ] 3.3.b Implement transition-detection with Strict-Mode-safe dedupe. Per-mount `useRef(false)` alone is insufficient: Strict Mode's mount-unmount-mount pattern creates two component instances each with a fresh ref, causing double-emit. Use a **module-level `WeakMap<object, boolean>` keyed by a per-instance stable object** (a `useRef({})` whose `.current` is created once per mount and survives Strict Mode's double-invoke within the same mount; a mount-unmount-remount creates a new ref object — intentional, so a remount correctly sees "no previous value" and emits if the new mount starts `true`). Pattern: `const keyRef = useRef({}); useEffect(() => { if (prevMap.get(keyRef.current) !== killSwitchActive) { emit(...); prevMap.set(keyRef.current, killSwitchActive); } }, [killSwitchActive]);`. `useId()` was considered but returns `string`, which is incompatible with `WeakMap`'s object-key requirement; a `Map<string, boolean>` with bounded-session leak is an acceptable alternative but `WeakMap<object, _>` auto-collects. Alternative (simpler, acceptable for tests only): receiver-side dedupe — the `FocusTelemetry` spy coalesces events with the same `type` within 100 ms; document the receiver-side contract in the telemetry README. Document the chosen strategy in a code comment referencing the scenario "Kill-switch emits telemetry on each false→true transition"
- [ ] 3.5.a Create `packages/workout-spa-editor/src/components/pages/FocusDiagnosticsPage.tsx` providing three radio buttons. Commit to the single-user product posture: route is always accessible at `/settings/focus-diagnostics` and linked from a quiet "Troubleshooting" item in the app's Help menu (no `?debug=` gate, no admin role). Radio copy:
  - "Default (follow deployment setting)" — value: unset (clears localStorage key)
  - "Always enable focus management" — value: `'on'` (overrides deployment default)
  - "Disable focus management (use if you're experiencing focus issues)" — value: `'off'`
  The toggle handler MUST: `localStorage.setItem(key, value)` (or `removeItem` for unset) AND `window.dispatchEvent(new Event('kaiord:focus-kill-switch-change'))`. Display the effective `useFocusKillSwitch()` result and the resolved `VITE_KAIORD_FOCUS_MANAGEMENT` value as read-only informational rows. The page has no server side effects, no auth bypass — safe to expose in production.
- [ ] 3.5.b Register the route at `/settings/focus-diagnostics` in the SPA router
- [ ] 3.5.c Write an E2E smoke test that navigates to the route, selects "Disable", returns to the editor, and verifies mutations no longer move focus — confirming the support path works without DevTools
- [ ] 3.6.a Implement `src/components/molecules/FocusKillSwitchBanner.tsx`. The banner uses TWO separate DOM elements to avoid nested-live-region double-announcement (`role="status"` implies `aria-live="polite"`; nesting them produces double-announcement in NVDA/JAWS):
  1. A **visible banner** `<div>` (no ARIA role, just visual chrome) containing the static text "Focus management disabled — Change in Focus Diagnostics" with a link to `/settings/focus-diagnostics`. The link text matches the target page's `<h1>` so the user understands where they land.
  2. A **sibling hidden live region** `<div aria-live="polite" aria-atomic="true" className="sr-only">` whose text content is driven by transition effects (see 3.6.c). The live region is visually hidden but screen-reader accessible. `aria-atomic="true"` ensures the entire content is announced when it changes, preventing partial announcements if future maintainers add structured content; also allows the region to contain only a single text node as the canonical format.
  The banner is intentionally non-dismissible — its presence IS the operational signal that the editor is in a revert-to-broken-but-stable posture. CSS MUST NOT apply `transition` or `animation` on entry/exit when `@media (prefers-reduced-motion: reduce)`; use CSS-only handling, no JS involvement
- [ ] 3.6.b Mount the banner as the first child of the editor's `role="main"` landmark, before the toolbar. E2E selector path: `page.getByRole('main').getByRole('status').first()`. Write E2E test asserting this exact DOM position AND the link to `/settings/focus-diagnostics`
- [ ] 3.6.c Write failing tests asserting the aria-live region's text content cycles exactly as `"" → "Focus management disabled" → ""` on `false → true` and `"" → "Focus management enabled" → ""` on `true → false`. The canonical React pattern is: on transition, set text to the message via `setState`; schedule a `setTimeout(() => setText(''), 100)` to arm the next announcement (100 ms is the browser's coalesce window floor). Static renders (value unchanged) emit no text change. First-mount with already-active kill-switch SHALL NOT emit a live-region announcement — the visible banner alone is the signal; programmatic screen-reader discovery of the banner happens on Tab traversal via the `<main>` landmark. This is intentionally documented as a behavioral choice.
- [ ] 3.4.a Write failing test asserting kill-switch activity does NOT alter `currentWorkout`, `selectedStepId`, `selectedStepIds`, `history`, or undo/redo behavior
- [ ] 3.4.b Verify by exercising a mutation sequence both with and without the switch; assert store-state equality pre/post

## 4. Wire telemetry into existing short-circuit paths

- [ ] 4.1.a Write failing test asserting the unresolved-target fallback emits `{ type: 'unresolved-target-fallback', targetKind, fallback }` with the correct `fallback` for each of the three branches (empty-state, first-item, heading)
- [ ] 4.1.b Emit the event immediately before the fallback focus call
- [ ] 4.2.a Write failing test asserting the form-field short-circuit emits `{ type: 'form-field-short-circuit' }` and is debounced to at most one event per 1000 ms per hook instance (five short-circuits within 500 ms produce exactly one event)
- [ ] 4.2.b Emit the event in the short-circuit branch with a `useRef<number>(0)` timestamp guard implementing the 1000 ms debounce
- [ ] 4.3.a Write failing test asserting the overlay-deferred-apply emits `{ type: 'overlay-deferred-apply', deferredForMs }` with `deferredForMs === Math.round(measuredMs / 100) * 100` (quantized to 100 ms buckets) and always a non-negative integer
- [ ] 4.3.b Implement `performance.now()` capture at both ends; apply the quantization and integer conversion before emission
- [ ] 4.5.a Write failing test asserting a `{ type: 'wiring-canary' }` event fires exactly once on editor mount when a non-default `FocusTelemetry` is provided; no event fires when the default no-op is used (since the no-op swallows it)
- [ ] 4.5.b Implement canary emission in `useFocusAfterAction`'s initial mount `useLayoutEffect` via a **module-level** `let hasFiredCanaryThisSession = false` boolean (NOT a per-instance `useRef` — Strict Mode double-mount creates two refs). On first mount of the editor session, check + set the module-level flag; subsequent mounts in the same page-load session do not re-emit. On page reload the module re-initializes and the flag resets — correct semantics (a reload IS a new deployment session from the canary's perspective). Add a dev-only HMR reset so editing adjacent files during local dev doesn't suppress the canary in subsequent test mounts: `if (import.meta.hot) import.meta.hot.accept(() => { hasFiredCanaryThisSession = false; });`
- [ ] 4.4.a Write failing test asserting the `finally`-block recovery from a `focus()` or `scrollIntoView()` throw emits `{ type: 'focus-error', phase }`
- [ ] 4.4.b Emit the event inside the catch clause (not in `finally` — we only emit when an error actually occurred)

## 5. Structural history refactor (ATOMIC PR)

> This task group is a single atomic PR. The rename `workoutHistory` + `selectionHistory` → `history` breaks every consumer in a single type-propagation step; intermediate commits would fail `pnpm -r build`. All 5.x tasks land together.

- [ ] 5.0 Before opening the refactor PR, post a complete consumer inventory as a PR comment: run `rg 'workoutHistory|selectionHistory' packages/workout-spa-editor` and list every file, grouped by category (reducers, selectors, Zustand devtools labels, Dexie persistence code, tests). Reviewers use this list to confirm the rename surface is complete. Acceptance criterion: after merge, the same rg returns zero matches.
- [ ] 5.1.a Write failing test asserting the new `HistoryEntry` shape (`{ workout: UIWorkout; selection: ItemId | null }`) and `history: Array<HistoryEntry>` typing on `WorkoutStore`
- [ ] 5.1.b Introduce `HistoryEntry` and `UndoHistory` types in `src/store/workout-state.types.ts` (alongside `UIWorkout`); update `WorkoutStore.undoHistory: UndoHistory` typing and remove `workoutHistory`/`selectionHistory` fields. Name is `undoHistory` to avoid lexical collision with `window.history` in destructured store consumers
- [ ] 5.2.a Write failing test asserting `pushHistorySnapshot(entry: HistoryEntry)` pushes a single tuple atomically; signature is 1-arg (tuple), NOT the base's 2-arg form
- [ ] 5.2.b Refactor `pushHistorySnapshot` to the 1-arg signature; update every call site to pass `{ workout, selection }` literals; remove the dev-mode length assertion (it is now structurally enforced)
- [ ] 5.3.a Write failing test asserting `undo` reads the paired `{ workout, selection }` snapshot and passes `selection` to the focus-rule helpers as the pre-mutation selection for fallback
- [ ] 5.3.b Refactor every `undo`/`redo`/`undoDelete` reducer to read `history[i].workout` and `history[i].selection`
- [ ] 5.4.a Write failing test asserting `clearWorkout` resets `history` to an empty array and `historyIndex` to its initial value
- [ ] 5.4.b Update `clearWorkout` implementation
- [ ] 5.5 Delete the dev-mode length assertion in `pushHistorySnapshot` AND the `workoutHistory.push`-only-in-helper CI grep step (both introduced by the base change) — no longer needed since the parallel arrays don't exist; remove the step from `.github/workflows/ci.yml`
- [ ] 5.6 Verify `pnpm lint && pnpm -r build && pnpm -r test` at the PR head

## 6. E2E automation

- [ ] 6.0 Measure current `workout-spa-editor-e2e.yml` wall-clock duration on `ubuntu-latest`; commit the baseline as a comment at the top of the workflow file: `# Baseline wall-clock (<YYYY-MM-DD>, ubuntu-latest): X min; focus-management spec budget: +30% max.` This makes future CI-duration regressions queryable without PR archaeology. Also add a CI enforcement step to the workflow: after tests complete, read the elapsed duration and fail if it exceeds `baseline * 1.3`. Use `${{ steps.test.outputs.duration }}` (or equivalent from the Playwright reporter) + a `shell: bash` comparison; output a GitHub summary comment when the budget is exceeded. Alternative if GH Actions duration extraction is fragile: mark the comment as advisory-only and document the manual PR-review expectation. Commit the chosen mechanism in the workflow file.
- [ ] 6.1.a Create `packages/workout-spa-editor/e2e/fixtures/focus-workout.krd.json` with 5 top-level steps and 1 repetition block (2 children), each with **distinct, non-colliding, realistic** human-readable names: "Warm-up 10 min", "Interval 1 — Z4 push", "Recovery 1 min", "Interval 2 — Z4 hold", "Cooldown 5 min", block "2x Interval Set" with children "Block step A — Z3 tempo" and "Block step B — Z3 recover". Names MUST be exact-match unique so `toHaveAccessibleName` cannot ambiguously hit multiple elements
- [ ] 6.1.b Create `packages/workout-spa-editor/e2e/focus-management.spec.ts` loading the fixture. No `data-testid` additions; all selectors use `page.getByRole('listitem', { name: ... })` or `page.locator(':focus')` with `toHaveAccessibleName()`
- [ ] 6.2.a Write failing Playwright tests for the matrix from design Decision 4: {Delete-single, Delete-multi, Paste, Duplicate, Reorder, Group, Ungroup, Undo, Redo} × {Keyboard, Context menu, Toolbar} where applicable. Each cell uses `await expect(page.locator(':focus')).toHaveAccessibleName('<expected step name>')`
- [ ] 6.2.b Implement test helpers: `triggerViaKeyboard(page, action)`, `triggerViaContextMenu(page, action, targetName)`, `triggerViaToolbar(page, action)` — all helpers locate targets by accessible name, not testid
- [ ] 6.2.c Write Playwright tests for the kill-switch: `page.addInitScript(() => localStorage.setItem('kaiordFocusManagement', 'off'))` before load, verify mutations complete without focus movement and undo/redo still works; also test `'on'` force-enable via the same API
- [ ] 6.2.d Write Vitest unit test(s) for the build-time env-var path using `vi.stubEnv('VITE_KAIORD_FOCUS_MANAGEMENT', 'off')`; this covers what E2E cannot
- [ ] 6.3.a Extend `.github/workflows/workout-spa-editor-e2e.yml` to include `focus-management.spec.ts` in its test matrix across Chromium, Firefox, and WebKit
- [ ] 6.3.b Verify the workflow passes on a clean main branch before the focus-management spec itself can fail
- [ ] 6.4 Add a PR-template checklist item in `.github/pull_request_template.md`: "If this PR adds a new UI affordance for a step/block mutation (toolbar button, context-menu item, keyboard shortcut), I have updated the focus-management E2E matrix and added the corresponding test cell"

## 7. StrictMode re-run of integration tests

- [ ] 7.1.a Identify focus integration test files in `packages/workout-spa-editor/src/`. Wrap each `describe` block covering focus-hook behavior with the following pattern. `FocusRegistryContext` is imported from the base change's `src/contexts/focus-registry-context.tsx` (introduced in base Decision 3); `FocusTelemetryContext` is introduced in this change (task 2.1.b):
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
- [ ] 7.1.b Write a failing test demonstrating a deliberately-broken Strict Mode interaction (e.g., double-registration missing the identity guard); confirm the `describe.each` re-run catches it
- [ ] 7.1.c Remove the failing test; commit the Strict Mode wrapper infrastructure
- [ ] 7.1.d Write failing test asserting the `kill-switch-active` emission guard does NOT double-fire under Strict Mode: mount → Strict Mode double-invokes mount → exactly one event emitted
- [ ] 7.1.e Write failing test asserting the `wiring-canary` emission does NOT double-fire under Strict Mode: mount → Strict Mode double-invokes → exactly one canary
- [ ] 7.2 Verify the CI wall-clock duration for the focus integration suite remains within the project's CI budget (target: <2× previous duration); document the before/after timing in the PR description

## 8. Accessibility evidence directory

- [ ] 8.1 Create `packages/workout-spa-editor/docs/accessibility-evidence/YYYY-MM-DD-focus-management/` (date = merge date of this hardening PR)
- [ ] 8.2 Record a VoiceOver session on macOS performing delete → paste → undo → group → ungroup on the fixture; capture the transcript in `voiceover-macos.md` with timestamps and announcement annotations. **Pin exact versions at capture time** in the log header: macOS version (e.g., "macOS 15.3"), VoiceOver version (matches macOS), browser (e.g., "Safari 18.3"). The quarterly refresh cron re-captures against the then-current latest and updates these pins
- [ ] 8.3 Record an equivalent session on Windows; capture `nvda-windows.md` with pinned versions in the log header: NVDA version (e.g., "NVDA 2024.4.1"), Windows version (e.g., "Windows 11 23H2"), browser (e.g., "Firefox 133.0")
- [ ] 8.4 Capture Accessibility Inspector screenshots (macOS) and NVDA speech viewer screenshots (Windows) for each scenario; save under `screenshots/`
- [ ] 8.5 Write `README.md` in the evidence directory with a concrete regeneration runbook (not elided). Specify exact tools and procedures:
  - **VoiceOver (macOS):** enable VoiceOver (⌘F5), open Accessibility Inspector (Xcode → Open Developer Tool), enable "Speech" panel with timestamps; run the fixture workout's action sequence; export from Accessibility Inspector → Speech panel → "Save Log". Name the export `voiceover-macos.log` with ISO date prefix.
  - **NVDA (Windows):** NVDA Speech Viewer does NOT display timestamps natively, and the NVDA "Braille Display → Timestamps" setting applies only to braille output, not to Speech Viewer. For timestamped capture use one of: (a) set NVDA log level to "Debug" (NVDA menu → Preferences → Settings → General → Logging level: Debug), reproduce the sequence, then read the timestamped speech events from `%APPDATA%\nvda\nvda.log` (filter lines containing "speakText" / "speakMessage"); OR (b) install the **SpeechLogger** NVDA add-on, which writes timestamped speech to a log file. Prefer (a) for reproducibility without extra dependencies. Copy the filtered log to `nvda-windows.log`.
  - Fixture: reference `packages/workout-spa-editor/e2e/fixtures/focus-workout.krd.json` (committed in task 6.1.a) — no per-run fixture variation allowed.
  - Acceptance: a fresh contributor following this runbook produces transcripts that diff against the committed baseline at ≤10% changed lines (mostly timestamp drift) — not structural changes.
- [ ] 8.6 Reference the evidence directory path in the changeset body (task 10.1 below)
- [ ] 8.7 Create `.github/ISSUE_TEMPLATE/refresh-accessibility-evidence.md` containing the regeneration checklist (VoiceOver script, NVDA script, screenshot locations, acceptance criteria)
- [ ] 8.8 Create `.github/workflows/accessibility-evidence-refresh.yml` with a `schedule` cron `0 0 1 */3 *` (first day of each quarter) that opens the issue automatically; include manual `workflow_dispatch` trigger; tag the issue with `accessibility` + `maintenance` labels; populate assignees by reading the GitHub CODEOWNERS API in a workflow step (`gh api /repos/{owner}/{repo}/contents/CODEOWNERS` + parse for workout-spa-editor owners) OR fall back to a hardcoded list defined in the workflow as a repo variable (`${{ vars.A11Y_EVIDENCE_ASSIGNEES }}`). The issue body template MUST include an explicit due date computed as `cron_trigger_date + 14 days` and an acceptance-criteria checkbox referencing the 10% diff gate from task 8.5
- [ ] 8.9 Add a reviewer-checklist item in `.github/pull_request_template.md` (or in the repo-level CODEOWNERS procedure): "If this PR bumps React, Radix, or Zustand to a new major version, AT evidence MUST be refreshed and committed before merge"

## 9. Quality gates

- [ ] 9.1 `pnpm -r test` — all tests pass (existing + new + Strict Mode re-run), zero warnings
- [ ] 9.2 `pnpm lint` — zero errors, zero warnings
- [ ] 9.3 `pnpm -r build` — zero build warnings
- [ ] 9.4 `pnpm -F @kaiord/workout-spa-editor test:e2e` — Playwright `focus-management.spec.ts` passes in Chromium, Firefox, WebKit (script name `test:e2e` verified against current `package.json`)
- [ ] 9.5 `find packages/workout-spa-editor/src -type f \( -name '*.ts' -o -name '*.tsx' \) ! -name '*.test.ts' ! -name '*.test.tsx' -exec wc -l {} + | awk '$1 > 100'` — zero rows (new files respect the ≤100 line limit)
- [ ] 9.6 Manual verification: toggle `localStorage.kaiordFocusManagement = 'off'` in the dev server console; confirm mutations no longer move focus, undo/redo still works, no errors in console
- [ ] 9.7 Manual verification: set `VITE_KAIORD_FOCUS_MANAGEMENT=off` and rebuild; confirm the kill-switch build path does not inadvertently leak the base change's `__kaiord_overlayObserver__` globalThis handle into the production bundle (`grep __kaiord_overlayObserver__ dist/` returns zero matches). This is a defensive re-verification of a base-change invariant — the hardening's build-mode switches MUST NOT disturb the base's test-only gating
- [ ] 9.8 Manual verification: wire a spy telemetry function; exercise each of the six event types (kill-switch-active, unresolved-target-fallback, form-field-short-circuit, overlay-deferred-apply, focus-error, wiring-canary); confirm spy receives the expected payloads with structural fields only; verify `deferredForMs` is always a multiple of 100 and `form-field-short-circuit` is debounced
- [ ] 9.9 Manual verification: navigate to `/settings/focus-diagnostics`, toggle each radio, return to the editor, confirm behavior matches; confirm the route does NOT require DevTools access
- [ ] 9.10 Manual verification: set `localStorage.kaiordFocusManagement = 'off'` in DevTools console mid-session; confirm the next mutation does NOT move focus (live re-read); set to `'on'`; confirm focus moves again without reload; confirm a fresh `kill-switch-active` event fires on each false→true transition

## 10. Documentation and changeset

- [ ] 10.1 Add a changeset (`pnpm exec changeset`) describing the hardening improvements; reference the AT evidence directory path and the kill-switch usage examples
- [ ] 10.2 Update `src/store/README.md` to document:
  - The kill-switch truth table (localStorage × env var), the `/settings/focus-diagnostics` support route, and the single-user support procedure (no DevTools required)
  - Which file / env UI sets the build-time `VITE_KAIORD_FOCUS_MANAGEMENT` (`.github/workflows/deploy.yml` or the deploy-platform env settings)
  - A note that `kill-switch-active` rate is error-budget consumption, NOT a steady-state posture; deployments SHOULD alarm on rate increases
  - The `FocusTelemetry` port with example wiring for Sentry AND Datadog RUM (two minimal code snippets); note that the wired function MUST be a stable reference (defined outside the render tree or wrapped with `useCallback`) — inline arrows invalidate the context value every render
  - A post-deploy smoke-test procedure: "Open the editor, perform a delete, verify at least one `wiring-canary` or mutation-driven event arrived in the telemetry dashboard within 60 seconds; absence indicates wiring failure"
  - **Event-to-severity alert guidance table** for ops (thresholds below are starting points — tune to actual DAU):

    | Event | Expected rate | Suggested alert (P) | Response playbook |
    |---|---|---|---|
    | `wiring-canary` | One per editor mount with wired telemetry | Info; **absence >30 min during editor-active hours = P3** (missing-canary) | Verify the deployment includes the telemetry provider; if absent, re-deploy with the correct env wiring |
    | `kill-switch-active` | Near zero in production | Warning at ≥1/day; **≥10 events/day sustained for 24h = P2** | Investigate recent focus-touching changes; consider emergency revert; check recent `/settings/focus-diagnostics` UX reports |
    | `focus-error` | Near zero (should never fire in correct implementation) | **Any occurrence = P2 error** | Inspect stack-trace field in event; identify the throwing element; file a regression bug |
    | `unresolved-target-fallback` | Low, occasional (race conditions acceptable) | Info; **sustained elevation ≥5× baseline for 6h = P3** | Check for recent changes to component unmount ordering or ref-registration |
    | `form-field-short-circuit` | Per-user, moderate (debounced) | Debug; not pageable | Statistical monitoring only |
    | `overlay-deferred-apply` | Per-user, moderate | Debug; outlier `deferredForMs` ≥5000 may indicate UI stall | Investigate dialog-close handlers for long-running work |

    **Post-deploy missing-canary auto-alert pattern:** configure a continuous check on your telemetry dashboard — if `wiring-canary` event count over a 30-minute rolling window is zero during editor-active hours (09:00–22:00 in the deployment's configured `TELEMETRY_TIMEZONE`; defaults to UTC if unset), fire a P3 alert. Document `TELEMETRY_TIMEZONE` as an ops configuration variable alongside the telemetry-backend credentials. For single-user local installations where editor-active hours are effectively 24/7 within the user's timezone, the rolling window can be widened to 2 hours.

    **Deployment-size guidance for kill-switch-active threshold:**

    | Deployment shape | Suggested `kill-switch-active` threshold |
    |---|---|
    | Multi-tenant (≥100 concurrent users) | ≥1/day warning, ≥10/day sustained 24h = P2 (from table above) |
    | Small multi-tenant (<100 users) | ≥1 event sustained across 2 days = investigate |
    | Single-install (1 user per deployment; e.g., Kaiord's default posture) | ≥1 event = investigate; ≥1 event sustained across 2 days = emergency revert |

    Choose the row matching your deployment. Kaiord's reference deployment is single-install; the severity table's default row assumes multi-tenant and SHOULD be re-tuned for single-install before wiring the alert.
  - The new `history: Array<HistoryEntry>` shape and the removal of the parallel-array invariant + its CI grep
  - The kill-switch retirement criterion (Decision 6) with a reminder to check it each release cycle
  - **Incident ownership guidance:** "For deployed installations, alerts should be paged per the deployment's internal on-call runbook. For the open-source reference deployment, `focus-error` and sustained `kill-switch-active` events SHOULD result in a GitHub issue filed against the repo with the `incident` label and assigned to the workout-spa-editor CODEOWNERS."
  - **Desktop-AT version-drift policy:** "AT evidence is considered valid for AT + OS + browser versions within one major release of the pinned version in the evidence directory's README. Outside that window, the quarterly refresh cron (or a dependency-bump-triggered manual refresh) re-captures evidence against then-current versions."
- [ ] 10.3 Update `WorkoutList/README.md` to reference the AT evidence directory as the regression-comparison baseline
- [ ] 10.4 Run `/opsx-verify spa-editor-focus-management-hardening` and resolve any mismatches
- [ ] 10.5 Run `/opsx-verify spa-editor-focus-telemetry` and resolve any mismatches
- [ ] 10.5.a Prerequisite check before `/opsx-apply`: confirm BOTH `rg 'selectionHistory' openspec/specs/spa-editor-focus-management/spec.md` AND `rg 'workoutHistory' openspec/specs/spa-editor-focus-management/spec.md` return matches from the base change (double-grep proves the base is applied even if a future refactor renamed one of the two). If either returns zero matches, abort — apply the base first
- [ ] 10.6 Run `/opsx-verify spa-editor-focus-management` and confirm the delta applied correctly (no stale "parallel arrays" scenarios remain on `main`; every `selectionHistory` → `history[...].selection` rename is reflected)
- [ ] 10.7 After PR merge, run `/opsx-archive spa-editor-focus-management-hardening`
