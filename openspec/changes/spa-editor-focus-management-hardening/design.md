## Context

This change assumes the base `spa-editor-focus-management` has been merged and applied. That base introduced:

- A branded `ItemId` type and `IdProvider` service-locator seam.
- A `FocusSlice` on the Zustand store with `pendingFocusTarget: FocusTarget | null`, `setPendingFocusTarget`, `selectionHistory: Array<ItemId | null>`.
- The `useFocusAfterAction` hook with form-field short-circuit, overlay-open defer, unresolved-target fallback chain, `prevTarget` guard.
- A ref-counted `overlayObserver` singleton scoped to the editor root.
- A `pushHistorySnapshot` helper that pushes `workoutHistory` and `selectionHistory` in lockstep, with a dev-mode length-invariant assertion and a CI grep.

The hardening touches four seams:

1. The hook (`useFocusAfterAction`) to consult a kill-switch and emit telemetry events.
2. The store (`workout-store-history.ts` and `workout-state.types.ts`) to collapse the parallel-array invariant into a single structure.
3. New files: `src/store/providers/focus-telemetry.ts` (port + default) and `src/contexts/focus-kill-switch.ts` (runtime flag reader).
4. CI + test harness: Playwright E2E spec; `<StrictMode>` re-run of integration tests; committed AT evidence directory.

Constraints:

- Project rules unchanged (CLAUDE.md): ≤100 lines per file, <40 LOC per function, TDD test-first, `type` over `interface`, factory functions, zero warnings.
- Zustand patterns unchanged. The store remains a single slice composition.
- No new npm dependencies.
- The kill-switch MUST NOT affect the stable-ID migration, the selection model, or undo/redo semantics. Only the DOM-layer `focus()` call is gated.
- `FocusTelemetry` is a client-side observability seam, not a cloud port. It respects the same service-locator terminology as `IdProvider` (Decision 1 of the base).

## Goals / Non-Goals

**Goals:**

- Provide a runtime short-circuit for programmatic focus without redeploying (`KAIORD_FOCUS_MANAGEMENT=off` env var OR `localStorage.kaiordFocusManagement = 'off'`).
- Replace the parallel-array history invariant with a structurally-enforced single array.
- Expose a telemetry seam that production deployments can wire to Sentry or an equivalent; ship a no-op default so unwired installations are unaffected.
- Automate regression gates currently left manual: cross-browser mutation → focus landing outcomes, React Strict Mode equivalence.
- Durably archive accessibility-technology evidence in the repository.

**Non-Goals:**

- Wiring the telemetry port to an actual error-reporting service (Sentry setup is the deployment's responsibility; we ship the seam only).
- Changing any focus rule, scenario, or contract from the base change.
- Changing the `IdProvider` or `stripIds` contract.
- Introducing new accessibility features (announcements, navigation modes) beyond what the base change specifies, **except** the kill-switch status announcement added by this hardening (see Decision 1 and the "Kill-switch active state is announced and displayed" scenario) — this announcement is scoped to the rollback signal itself, not general a11y expansion.
- Replacing Playwright or Vitest; we extend existing infrastructure.
- **Mobile screen-reader coverage** (TalkBack on Android, VoiceOver on iOS). The editor SPA is a desktop-first workout-authoring surface; mobile testing is a separate future concern.
- **Focus-ring CSS transitions for reduced motion** beyond what the base change's `@media (prefers-reduced-motion)` CSS already handles; no new animation tuning here.
- **Real-time user observability dashboards** (Grafana/Datadog panels). We ship the data source; deployments build the dashboards.

## Decisions

### Decision 1: Kill-switch via `useFocusKillSwitch` hook + env-var default

**Choice:** Add `src/hooks/use-focus-kill-switch.ts` (a hook, NOT a React context — no provider is needed because the reader talks to `window` events and `localStorage` directly) exposing `useFocusKillSwitch(): boolean` which returns `true` when focus management should be disabled. The reader is a three-state decision: runtime localStorage override beats build-time env var beats default. Truth table:

| `localStorage.kaiordFocusManagement` | `import.meta.env.VITE_KAIORD_FOCUS_MANAGEMENT` | `useFocusKillSwitch()` |
|---|---|---|
| `'off'` | any | `true` (disabled) |
| `'on'` | any | `false` (enabled — runtime force-enable) |
| unset or other | `'off'` | `true` (disabled — build-time disabled) |
| unset or other | `'on'` or unset | `false` (enabled — default) |

Supporting `'on'` on the runtime axis matters because `VITE_KAIORD_FOCUS_MANAGEMENT` is a **compile-time constant** (Vite inlines it at build); without a runtime override for `'on'`, a build-time "off" would be a one-way door per deployment and an internal tester could not selectively re-enable the feature. The build-time axis is therefore covered by unit tests only (using `vi.stubEnv`); the E2E suite exercises exclusively the localStorage path because E2E runs against a built bundle where the env var cannot change mid-run.

The hook reads the kill-switch via `useSyncExternalStore` with a subscriber that listens to two events:

1. A **cross-tab** `storage` event (fired by browsers in *other* tabs of the same origin when localStorage mutates — NOT in the writing tab itself).
2. A **same-tab** custom event `kaiord:focus-kill-switch-change` that our own code dispatches (`window.dispatchEvent(new CustomEvent('kaiord:focus-kill-switch-change'))`) whenever the `/settings/focus-diagnostics` UI mutates localStorage, or whenever any programmatic code flips the switch.

This dual subscription is necessary because the Web Storage API explicitly does not fire `storage` in the tab that performed the write. Without the custom event, a DevTools-driven `localStorage.setItem(...)` in the editor tab would leave the hook's cached value stale until page reload.

**DevTools caveat documented for support staff:** a bare `localStorage.setItem('kaiordFocusManagement', 'off')` in the DevTools Console will NOT take effect immediately. Support staff dispatching the switch via DevTools MUST additionally run `window.dispatchEvent(new Event('kaiord:focus-kill-switch-change'))`. The `/settings/focus-diagnostics` route wraps both calls into its toggle handler so non-technical users don't need to know. A one-line helper `window.__kaiordReloadFocusKillSwitch()` is exposed on `globalThis` in development builds for ergonomic DevTools workflows.

The snapshot function returns a primitive boolean (localStorage read + build-time env-var constant folding); React compares with `Object.is` and bails on unchanged values. `import.meta.env.VITE_KAIORD_FOCUS_MANAGEMENT` is read once at module load and cached (it cannot change at runtime; no subscription needed).

When the effective value is `true`, the hook:

- Reads and clears `pendingFocusTarget` without calling `focus()` or `scrollIntoView()`.
- Emits a `kill-switch-active` telemetry event on each `false → true` transition (not merely once per hook-instance lifetime) so a DevTools toggle mid-session produces an observable signal. Support staff can use event arrival as a confirmation that the intervention succeeded.
- Leaves `history` / `selectedStepId` / all undo-redo semantics untouched.

**Rollback honesty note:** The kill-switch restores *pre-base-change* behavior, i.e., focus falls to `document.body` after unmount. That is the accessibility bug that motivated the base change. Kill-switch-active is therefore a **revert-to-broken-but-stable** state, not a supported mode. The `kill-switch-active` rate is an error-budget signal, not a steady-state posture — deployments SHOULD alarm if the rolling-window rate exceeds baseline.

**Rationale:**

- A context-based reader is memoized and consistent across renders; a direct `localStorage` read in the hook would work but is harder to test (requires stubbing `localStorage` per test).
- Two levels of switch (build-time and runtime) let ops disable the feature either for a release cut or for a user-specific hotfix.
- Leaving all non-DOM-focus behavior intact means the kill-switch is a pure UX-regression rollback, not a state-machine rollback.

**Alternatives considered:**

- *Feature-flag service (LaunchDarkly, GrowthBook)*: rejected for this scope. No existing infrastructure; would add a dependency for a single binary flag.
- *Direct env-var check in hook*: rejected for test friction.
- *Gate at store level (don't set `pendingFocusTarget` at all)*: rejected because the target is also consumed by tests and future features; gating at the DOM layer is the narrowest cut.

**Layer impact:** Infrastructure (React-hook + context).

### Decision 2: Merge parallel history into `Array<{ workout, selection }>`

**Choice:** Replace `workoutHistory: Array<UIWorkout>` and `selectionHistory: Array<ItemId | null>` with:

```ts
type HistoryEntry = { workout: UIWorkout; selection: ItemId | null };
type UndoHistory = Array<HistoryEntry>;
```

Update `WorkoutStore.workoutHistory` → `undoHistory: UndoHistory`. Update `pushHistorySnapshot(uiWorkout, selection)` to push a single `{ workout, selection }` tuple. Update `undo`/`redo` to read `undoHistory[i].workout` and `undoHistory[i].selection` as a pair. The dev-mode runtime length-invariant assertion and the CI grep from base tasks 4.2.c/4.2.d are deleted (structural invariant makes them redundant). `historyIndex` semantics unchanged.

**Rationale:**

- The length invariant is proven-correct by construction rather than by assertion — matches hexagonal "make illegal states unrepresentable" discipline.
- Removes two pieces of runtime machinery (dev assertion + CI grep) that can drift from the code they guard.
- The memory footprint is identical (one object reference per entry vs two parallel references).

**Alternatives considered:**

- *Keep parallel arrays and improve assertions*: rejected — doesn't address the "silent wrong-target in production" failure mode; only delays it.
- *Use a tuple `[UIWorkout, ItemId | null]`*: equivalent but less readable at call sites.
- *Defer to a future change*: rejected — the base change's history semantics are load-bearing for every undo scenario; hardening while it is fresh in contributors' minds is cheaper than a separate refactor cycle.

**Atomic-PR note:** Like base §2, the rename from `workoutHistory` to `history` breaks every consumer in a single type-propagation step. This change is a single atomic PR; intermediate commits are not zero-warning.

**Layer impact:** Infrastructure (store-layer).

### Decision 3: `FocusTelemetry` service-locator seam

**Choice:** Define `src/store/providers/focus-telemetry.ts`:

```ts
export type FocusTelemetryEvent =
  | { type: "kill-switch-active" }
  | { type: "wiring-canary" }
  | { type: "unresolved-target-fallback"; targetKind: "item" | "empty-state"; fallback: "empty-state" | "first-item" | "heading" }
  | { type: "form-field-short-circuit" }
  | { type: "overlay-deferred-apply"; deferredForMs: number }
  | { type: "focus-error"; phase: "focus" | "scrollIntoView" };

export type FocusTelemetry = (event: FocusTelemetryEvent) => void;
export const defaultFocusTelemetry: FocusTelemetry = () => {};
```

The event payload carries *structural* metadata only — never `ItemId` values, never step/block content, never workout names. This preserves the existing no-PII rule from base Decision 3.

The store accepts an optional `telemetry: FocusTelemetry` at construction time (same pattern as `IdProvider`). `useFocusAfterAction` reads the telemetry fn from context (`FocusTelemetryContext`, provided at editor root) and invokes it at each observation point. Tests inject a spy that asserts the expected event sequence.

Production deployments that want Sentry/Datadog/etc. integration import and provide their own `FocusTelemetry` implementation via the context provider. Nothing in `@kaiord/workout-spa-editor` imports Sentry.

**Rationale:**

- Port-style decoupling keeps the SPA package dependency-free on any specific telemetry backend.
- The no-op default means unwired deployments are zero-overhead and zero-behavioral-change.
- Event discriminated union (not free-form strings) makes the contract testable at type-check time.
- Structural-only payloads match the existing `console.warn` discipline from base Decision 3 and avoid privacy regressions.

**Alternatives considered:**

- *Direct `console.warn`/`console.error` calls*: rejected — captured by nothing; "turn on devtools and reproduce" is not a production diagnostic strategy.
- *EventTarget-style bus*: rejected — more machinery than a function pointer; no observed benefit for single-listener scenarios.
- *Sentry-as-default*: rejected — forces a dependency on every consumer.

**Layer impact:** Infrastructure (new port + adapter).

### Decision 4: E2E + StrictMode automation

**Choice:** Add `packages/workout-spa-editor/e2e/focus-management.spec.ts` to the existing Playwright suite. The spec exercises a fixture workout with 5 steps and 1 repetition block with distinct, stable, human-readable accessible names (e.g., "Warm-up 10 min", "Interval 1 min Z4", "Cooldown 5 min"). Assertions target `document.activeElement` via Playwright's **accessible-name queries** (`page.getByRole('listitem', { name: ... })`), NOT `data-testid`. This choice avoids the Vite production-build DCE question (testids conditionally emitted based on `NODE_ENV` are not reliably tree-shaken; Playwright runs against a preview-built bundle where `NODE_ENV === 'production'`), and it matches the spec's own accessibility ethos — we assert the same surface screen-reader users consume. Fixture step names are committed in `e2e/fixtures/focus-workout.krd.json` so every assertion references a stable name.

The spec performs each mutation across each input path:

| Mutation | Keyboard | Context menu | Toolbar |
|---|---|---|---|
| Delete (single) | ✓ | ✓ | ✓ |
| Delete (multi-select) | ✓ | ✓ | — |
| Paste | ✓ | ✓ | ✓ |
| Duplicate | ✓ | ✓ | ✓ |
| Reorder (Alt+Arrow / DnD) | ✓ | — | — |
| Group | ✓ | ✓ | — |
| Ungroup | ✓ | ✓ | — |
| Undo | ✓ | — | ✓ |
| Redo | ✓ | — | ✓ |

**Legend:** `✓` = input path exists in the current UI and is exercised by the E2E spec. `—` = input path does not exist in the current UI for this action (e.g., there is no context-menu "Undo" item). If a future UI change adds a path (e.g., a toolbar Reorder button), the matrix SHALL gain the cell and the E2E spec SHALL add the corresponding assertion. A PR-template checklist item (task 6.4) enforces this for new UI affordances.

For each cell, the spec asserts via `await expect(page.locator(':focus')).toHaveAccessibleName('Warm-up 10 min')` or equivalent. The matrix runs on Chromium, Firefox, and WebKit (existing Playwright projects). **Build-time kill-switch testing:** the E2E suite exclusively exercises the localStorage path via `page.addInitScript(() => localStorage.setItem('kaiordFocusManagement', 'off'))`. The `import.meta.env.VITE_KAIORD_FOCUS_MANAGEMENT` path is a Vite compile-time constant — the bundle serves a single baked-in value and cannot be flipped per test — so env-var precedence is covered by Vitest unit tests using `vi.stubEnv('VITE_KAIORD_FOCUS_MANAGEMENT', 'off')`, not by Playwright.

The Vitest integration tests from base task §8 gain a sibling describe block wrapped in `<StrictMode>`:

```ts
describe.each([
  { mode: "standard", Wrapper: Fragment },
  { mode: "strict", Wrapper: StrictMode },
])("focus integration [$mode]", ({ Wrapper }) => { /* ... */ });
```

Each assertion runs twice. Discrepancies fail the test.

**Rationale:**

- The base change's manual-verification gate (task 11.5) protects *that PR* but not subsequent PRs that touch the focus path. An E2E spec is the recurring regression gate.
- Strict Mode double-invocation is a known footgun; a `describe.each` two-mode run is low-effort, high-coverage.
- Matrix coverage mirrors the spec's "input-method agnostic" requirement — the spec asserts keyboard and context menu produce identical outcomes, so the E2E should too.

**Alternatives considered:**

- *Only re-run a subset in Strict Mode*: rejected — every new focus scenario is a Strict Mode risk area; blanket re-run is cheap.
- *Separate E2E workflow*: rejected — the existing `workout-spa-editor-e2e.yml` is the right home.

**Layer impact:** Infrastructure (E2E + test harness).

### Decision 4b: Non-DevTools kill-switch support path

**Choice:** Ship an always-accessible support-route at `/settings/focus-diagnostics` (Kaiord workout-spa-editor is a single-user product; no admin gate, no `?debug=` guard — discoverability via the Help menu's "Troubleshooting" item is the UX path). The UI has three radio buttons — "Default (follow deployment setting)" / "Always enable focus management" / "Disable focus management (use if you're experiencing focus issues)" — corresponding to `unset / 'on' / 'off'` localStorage states. Include a read-only display of the effective `useFocusKillSwitch()` value (updates live via the same custom event) and a "Build-time default: …" row for `VITE_KAIORD_FOCUS_MANAGEMENT` (module-cached; never updates at runtime). Non-technical support staff can direct a user to the Help menu → Troubleshooting → Focus Diagnostics; no DevTools required. The route is also the first-class home for the retirement criterion (see Decision 6) — one day it will be a deprecation notice, not a toggle.

**Alternatives considered:** admin-role unlock (no admin role exists in single-user product), `?debug=focus` query-param gate (obscures the troubleshooting path from non-technical users). Both rejected in favor of the always-on route.

**Rationale:**
- Documentation-only paths ("paste this snippet in DevTools") are unrealistic for non-technical support.
- A visible UI doubles as self-serve for advanced users without needing a support channel.
- Having a single route makes the retirement migration trivial: replace the UI with a "focus management is always enabled" notice.

**Layer impact:** UI (new route + component).

### Decision 5: Committed AT evidence directory

**Choice:** Create `packages/workout-spa-editor/docs/accessibility-evidence/YYYY-MM-DD-focus-management/` containing:

- `voiceover-macos.md` — transcript of a VoiceOver session performing delete → paste → undo → group → ungroup; annotates the announcement sequence and the focus-landing element.
- `nvda-windows.md` — equivalent transcript on NVDA + Firefox latest stable.
- `screenshots/` — Accessibility Inspector screenshots (macOS) / NVDA speech viewer screenshots (Windows) for each scenario.
- `README.md` — index + procedure to regenerate the evidence (short runbook).

The base change's changeset body includes the directory path. Subsequent changes that modify focus behavior MUST update this directory (tracked via CODEOWNERS or a reviewer checklist).

**Rationale:**

- PR attachments are lost during squash-merge. Committed files are durable, queryable, diffable.
- Future regression debugging benefits from a golden baseline to compare against.
- The runbook ensures evidence can be refreshed by any contributor, not only the one who captured it initially.

**Alternatives considered:**

- *Git LFS for screenshots*: rejected — screenshots are small (<500 KB each); LFS adds setup complexity.
- *External storage (S3, Drive)*: rejected — defeats the "durable in the repo" goal.

**Layer impact:** Documentation / repository organization.

### Decision 6: Kill-switch retirement criterion

**Choice:** The kill-switch SHALL be retired when BOTH of the following hold:

1. No `kill-switch-active` telemetry event has been received from production for **90 consecutive days**.
2. **Two consecutive major version releases** have shipped with focus management enabled.

Retirement is performed via a follow-up proposal (`spa-editor-focus-management-kill-switch-retire`) whose task checklist MUST remove ALL of the following artifacts:

- `src/hooks/use-focus-kill-switch.ts` (the hook) and its tests
- `/settings/focus-diagnostics` route + `FocusDiagnosticsPage.tsx` component
- `FocusKillSwitchBanner.tsx` component + its tests
- Help menu "Troubleshooting → Focus Diagnostics" entry
- All kill-switch-related scenarios in `spec.md` (runtime kill-switch requirement, banner scenarios, live-region scenarios, live-read scenarios)
- `kill-switch-active` event type in the telemetry spec
- README.md kill-switch documentation sections
- The `kill-switch-active` row of the severity table
- Build-time `VITE_KAIORD_FOCUS_MANAGEMENT` documentation and any deploy-workflow references

Until retirement, the kill-switch documentation SHALL include an expiry check note: "If both conditions above have held for the current release cycle, propose retirement in the next release planning window."

**Rationale:**
- Feature flags without expiry criteria become permanent technical debt; every project has cautionary tales.
- Two conditions (one telemetry-based, one release-based) prevent retirement if telemetry wiring is broken (no events = could mean "healthy" or could mean "wiring broken") — the release-count condition forces real release-cycle validation.
- Naming the retirement proposal up-front makes retirement a scheduled event, not a "someday maybe".

**Layer impact:** Policy / scheduling.

## Risks / Trade-offs

- **[Risk] Kill-switch ships but is never used in production** → Acceptable: its existence is cheap (one context + one env-var read), and the first regression where it saves a deploy justifies the overhead. Document the usage pattern in `src/store/README.md` and a troubleshooting section.
- **[Risk] History rewrite breaks a call site not covered by tests** → Mitigation: the atomic-PR approach forces TypeScript to surface every consumer; `pnpm lint && pnpm -r build && pnpm -r test` at the PR head is the acceptance gate. The base change already identifies every call site; this hardening only renames the field and composes existing fields into one object.
- **[Risk] `FocusTelemetry` default no-op silently swallows events in unwired deployments** → Acceptable and intentional. The no-op IS the "unwired" behavior. Deployments that care wire the port.
- **[Risk] E2E flakiness (focus assertions are browser-timing-dependent)** → Mitigation: the base change's `useLayoutEffect` + `setTimeout(0)` scheduling is designed for deterministic ordering; E2E waits on `page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === '<name>' || document.activeElement?.textContent?.trim() === '<name>')` — an accessible-name assertion consistent with the `getByRole('listitem', { name: ... })` strategy committed in Decision 4. Never `dataset.testid` (testids are not part of the production bundle strategy).
- **[Risk] AT evidence goes stale without refresh** → Mitigation: the runbook + CODEOWNERS rule + an annual refresh task keep it fresh. Stale evidence is still better than no evidence.
- **[Risk] Kill-switch + telemetry are two new indirection seams** → Trade-off accepted. Observability and operational control are not free, but they are cheaper than production debugging through user bug reports.
- **[Trade-off] Strict Mode re-run doubles test duration for focus integration** → Acceptable; base task §8 has ~20 integration tests; a 2× run is ~40 tests, well within the CI budget. If a hot-spot emerges we can split the describe in half.

## Migration Plan

Phases in order (each is its own PR):

1. **Phase A — Telemetry port + kill-switch context + support route**: ship `FocusTelemetry`, `FocusTelemetryContext`, `useFocusKillSwitch`, `/settings/focus-diagnostics` UI. No hook-consumer wiring yet. Independent and non-breaking. Unit tests only.
2. **Phase B — Atomic history rewrite PR**: breaking rename `workoutHistory` + `selectionHistory` → `history: Array<HistoryEntry>` across every consumer; single PR; all tests green at HEAD. Before opening the PR, post a complete consumer inventory (grep of `workoutHistory|selectionHistory` in the monorepo) as a PR comment so reviewers can confirm the rename surface.
3. **Phase C — Wire kill-switch + telemetry events into `useFocusAfterAction`**: non-breaking additions that consume Phase A's seams and Phase B's history shape.
4. **Phase D — E2E spec + StrictMode describe.each wrapper + AT evidence**: additive; new tests + docs only.

**Rollback order** (reverse-dependency):

- To roll back a *runtime* focus-behavior regression: flip `localStorage.kaiordFocusManagement = 'off'`. No code revert needed. This is the kill-switch's purpose.
- To roll back *Phase D*: revert Phase D's PR. Phase C, B, A remain.
- To roll back *Phase C* (telemetry events in the hook): revert Phase C's PR. Phase B, A remain. Hook reverts to pre-telemetry behavior; seams stay available for re-wiring.
- To roll back *Phase B* (atomic history rewrite): must first revert Phase C AND Phase D (both reference `history`). Attempting to revert Phase B alone while later phases still use `history` will produce a broken build. A pre-revert smoke test is `pnpm -F @kaiord/workout-spa-editor build`.
- To roll back *Phase A* (seams): revert its PR. Requires Phases B, C, D to be already reverted since they depend on the seams' types.

**Smoke tests per revert:**
- After any revert: `pnpm -r test && pnpm -r build && pnpm -F @kaiord/workout-spa-editor e2e` must all pass.
- After Phase B revert specifically: verify `rg 'history\[' packages/workout-spa-editor/src/store` returns zero matches and `rg 'workoutHistory|selectionHistory' packages/workout-spa-editor/src/store` shows the restored pair.

## Open Questions

- Which telemetry surface will production wire to? Decision deferred to the deployment owner — the seam is the contract. Document candidates (Sentry, Datadog RUM, LogRocket) in `src/store/README.md` with example wiring. The first production deployment that wires a telemetry backend closes this open question.
- Should the kill-switch also disable stable-ID generation (preserving pre-change positional IDs)? **Resolved: no.** Stable IDs are correct and performant; only the DOM-side `focus()` movement has a regression surface large enough to justify a kill-switch. The kill-switch is narrowly scoped to the focus move to preserve state-model consistency across both modes.
- How often should AT evidence be refreshed? **Resolved: quarterly on a cron schedule, with an immediate refresh trigger on any React / Radix / Zustand major version bump.** The scheduled refresh is enforced via `.github/workflows/accessibility-evidence-refresh.yml` (task 8.7) which opens a tracking issue from `.github/ISSUE_TEMPLATE/refresh-accessibility-evidence.md` (task 8.6); the dependency-bump trigger is caught by renovate/dependabot reviewer instructions.
