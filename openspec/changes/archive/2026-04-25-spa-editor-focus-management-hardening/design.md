## Context

This change assumes the base `spa-editor-focus-management` has been merged and applied. That base introduced:

- A branded `ItemId` type and `IdProvider` service-locator seam.
- A `FocusSlice` on the Zustand store with `pendingFocusTarget: FocusTarget | null`, `setPendingFocusTarget`, `selectionHistory: Array<ItemId | null>`.
- The `useFocusAfterAction` hook with form-field short-circuit, overlay-open defer, unresolved-target fallback chain, `prevTarget` guard.
- A ref-counted `overlayObserver` singleton scoped to the editor root.
- A `pushHistorySnapshot` helper that pushes `workoutHistory` and `selectionHistory` in lockstep, with a dev-mode length-invariant assertion and a CI grep.

The hardening touches three seams:

1. The hook (`useFocusAfterAction`) to emit telemetry events at each observed short-circuit / fallback.
2. The store (`workout-store-history.ts` and `workout-state.types.ts`) to collapse the parallel-array invariant into a single structure.
3. CI + test harness: new file `src/store/providers/focus-telemetry.ts` (port + default); Playwright E2E spec; `<StrictMode>` re-run of integration tests; committed AT evidence directory.

Constraints:

- Project rules unchanged (CLAUDE.md): ≤100 lines per file, <40 LOC per function, TDD test-first, `type` over `interface`, factory functions, zero warnings.
- Zustand patterns unchanged. The store remains a single slice composition.
- No new npm dependencies.
- `FocusTelemetry` is a client-side observability seam, not a cloud port. It respects the same service-locator terminology as `IdProvider` (Decision 1 of the base).

## Goals / Non-Goals

**Goals:**

- Replace the parallel-array history invariant with a structurally-enforced single array.
- Expose a telemetry seam that production deployments can wire to Sentry or an equivalent; ship a no-op default so unwired installations are unaffected.
- Automate regression gates currently left manual: cross-browser mutation → focus landing outcomes, React Strict Mode equivalence.
- Durably archive accessibility-technology evidence in the repository.

**Non-Goals:**

- Wiring the telemetry port to an actual error-reporting service (Sentry setup is the deployment's responsibility; we ship the seam only).
- Introducing a runtime kill-switch or feature flag for focus management. If a regression reaches production, rollback is a full redeploy of the prior build — consistent with how any other client-side correctness bug is handled.
- Changing any focus rule, scenario, or contract from the base change.
- Changing the `IdProvider` or `stripIds` contract.
- Introducing new accessibility features (announcements, navigation modes) beyond what the base change specifies.
- Replacing Playwright or Vitest; we extend existing infrastructure.
- **Mobile screen-reader coverage** (TalkBack on Android, VoiceOver on iOS). The editor SPA is a desktop-first workout-authoring surface; mobile testing is a separate future concern.
- **Real-time user observability dashboards** (Grafana/Datadog panels). We ship the data source; deployments build the dashboards.

## Decisions

### Decision 1: Merge parallel history into `Array<HistoryEntry>`

**Choice:** Replace `workoutHistory: Array<UIWorkout>` and `selectionHistory: Array<ItemId | null>` with:

```ts
type HistoryEntry = { workout: UIWorkout; selection: ItemId | null };
type UndoHistory = Array<HistoryEntry>;
```

Update `WorkoutStore.workoutHistory` → `undoHistory: UndoHistory`. The name `undoHistory` avoids lexical collision with the ubiquitous `window.history` DOM API — a plain `history` field would shadow in destructured store consumers and trip `no-shadow` lint rules. Update `pushHistorySnapshot(entry: HistoryEntry)` to push a single tuple. Update `undo`/`redo` to read `undoHistory[i].workout` and `undoHistory[i].selection` as a pair. The dev-mode runtime length-invariant assertion and the CI grep from base tasks 4.2.c/4.2.d are deleted (structural invariant makes them redundant). `historyIndex` semantics unchanged.

**Rationale:**

- The length invariant is proven-correct by construction rather than by assertion — matches hexagonal "make illegal states unrepresentable" discipline.
- Removes two pieces of runtime machinery (dev assertion + CI grep) that can drift from the code they guard.
- The memory footprint is identical (one object reference per entry vs two parallel references).

**Alternatives considered:**

- _Keep parallel arrays and improve assertions_: rejected — doesn't address the "silent wrong-target in production" failure mode; only delays it.
- _Use a tuple `[UIWorkout, ItemId | null]`_: equivalent but less readable at call sites.
- _Defer to a future change_: rejected — the base change's history semantics are load-bearing for every undo scenario; hardening while it is fresh in contributors' minds is cheaper than a separate refactor cycle.

**Atomic-PR note:** Like base §2, the rename from `workoutHistory` to `undoHistory` breaks every consumer in a single type-propagation step. This change is a single atomic PR; intermediate commits are not zero-warning.

**Layer impact:** Infrastructure (store-layer).

### Decision 2: `FocusTelemetry` service-locator seam

**Choice:** Define `src/store/providers/focus-telemetry.ts`:

```ts
export type FocusTelemetryEvent =
  | { type: "wiring-canary" }
  | {
      type: "unresolved-target-fallback";
      targetKind: "item" | "empty-state";
      fallback: "empty-state" | "first-item" | "heading";
    }
  | { type: "form-field-short-circuit" }
  | { type: "overlay-deferred-apply"; deferredForMs: number }
  | { type: "focus-error"; phase: "focus" | "scrollIntoView" };

export type FocusTelemetry = (event: FocusTelemetryEvent) => void;
export const defaultFocusTelemetry: FocusTelemetry = () => {};
```

The event payload carries _structural_ metadata only — never `ItemId` values, never step/block content, never workout names. This preserves the existing no-PII rule from base Decision 3.

The store accepts an optional `telemetry: FocusTelemetry` at construction time (same pattern as `IdProvider`). `useFocusAfterAction` reads the telemetry fn from context (`FocusTelemetryContext`, provided at editor root) and invokes it at each observation point via a single centralized `safeEmit(telemetry, event)` wrapper that try/catches the call and dev-warns on failure. Tests inject a spy that asserts the expected event sequence.

Production deployments that want Sentry/Datadog/etc. integration import and provide their own `FocusTelemetry` implementation via the context provider. Nothing in `@kaiord/workout-spa-editor` imports Sentry.

**Rationale:**

- Port-style decoupling keeps the SPA package dependency-free on any specific telemetry backend.
- The no-op default means unwired deployments are zero-overhead and zero-behavioral-change.
- Event discriminated union (not free-form strings) makes the contract testable at type-check time.
- Structural-only payloads match the existing `console.warn` discipline from base Decision 3 and avoid privacy regressions.

**Alternatives considered:**

- _Direct `console.warn`/`console.error` calls_: rejected — captured by nothing; "turn on devtools and reproduce" is not a production diagnostic strategy.
- _EventTarget-style bus_: rejected — more machinery than a function pointer; no observed benefit for single-listener scenarios.
- _Sentry-as-default_: rejected — forces a dependency on every consumer.

**Privacy mitigations:**

- `form-field-short-circuit` emission is debounced to at most one event per hook instance per 1000 ms to break correlation with keystroke timing (typing in a notes field triggers short-circuits on every autosave-driven mutation; unlimited emission would be a keystroke-timing side channel).
- `deferredForMs` is quantized to 100 ms buckets via `Math.round(measuredMs / 100) * 100` so the value cannot reveal fine-grained dialog dwell time.
- `wiring-canary` emits exactly once per editor session on first mount when a non-default telemetry is provided; serves as a deployment smoke-test signal. Module-level `let hasFiredCanaryThisSession = false` guard keeps the emission single across Strict Mode double-mount. In dev, `import.meta.hot?.accept(() => { hasFiredCanaryThisSession = false })` resets the guard on HMR.

**Layer impact:** Infrastructure (new port + adapter).

### Decision 3: E2E + StrictMode automation

**Choice:** Add `packages/workout-spa-editor/e2e/focus-management.spec.ts` to the existing Playwright suite. The spec exercises a fixture workout with 5 steps and 1 repetition block with distinct, stable, human-readable accessible names (e.g., "Warm-up 10 min", "Interval 1 — Z4 push", "Cooldown 5 min"). Assertions target `document.activeElement` via Playwright's **accessible-name queries** (`page.getByRole('listitem', { name: ... })`), NOT `data-testid`. This choice avoids the Vite production-build DCE question (testids conditionally emitted based on `NODE_ENV` are not reliably tree-shaken; Playwright runs against a preview-built bundle where `NODE_ENV === 'production'`), and it matches the spec's own accessibility ethos — we assert the same surface screen-reader users consume. Fixture step names are committed in `e2e/fixtures/focus-workout.krd.json` so every assertion references a stable name.

The spec performs each mutation across each input path:

| Mutation                  | Keyboard | Context menu | Toolbar |
| ------------------------- | -------- | ------------ | ------- |
| Delete (single)           | ✓        | ✓            | ✓       |
| Delete (multi-select)     | ✓        | ✓            | —       |
| Paste                     | ✓        | ✓            | ✓       |
| Duplicate                 | ✓        | ✓            | ✓       |
| Reorder (Alt+Arrow / DnD) | ✓        | —            | —       |
| Group                     | ✓        | ✓            | —       |
| Ungroup                   | ✓        | ✓            | —       |
| Undo                      | ✓        | —            | ✓       |
| Redo                      | ✓        | —            | ✓       |

**Legend:** `✓` = input path exists in the current UI and is exercised by the E2E spec. `—` = input path does not exist in the current UI for this action. If a future UI change adds a path (e.g., a toolbar Reorder button), the matrix SHALL gain the cell and the E2E spec SHALL add the corresponding assertion. A PR-template checklist item enforces this for new UI affordances.

For each cell, the spec asserts via `await expect(page.locator(':focus')).toHaveAccessibleName('Warm-up 10 min')` or equivalent. The matrix runs on Chromium, Firefox, and WebKit (existing Playwright projects).

The Vitest integration tests from base task §8 gain a sibling describe block wrapped in `<StrictMode>`:

```ts
describe.each([
  { mode: "standard", Wrapper: Fragment },
  { mode: "strict", Wrapper: StrictMode },
])("focus integration [$mode]", ({ Wrapper }) => {
  /* ... */
});
```

Each assertion runs twice. Discrepancies fail the test.

**Rationale:**

- The base change's manual-verification gate (task 11.5) protects _that PR_ but not subsequent PRs that touch the focus path. An E2E spec is the recurring regression gate.
- Strict Mode double-invocation is a known footgun; a `describe.each` two-mode run is low-effort, high-coverage.
- Matrix coverage mirrors the spec's "input-method agnostic" requirement — the spec asserts keyboard and context menu produce identical outcomes, so the E2E should too.

**Alternatives considered:**

- _Only re-run a subset in Strict Mode_: rejected — every new focus scenario is a Strict Mode risk area; blanket re-run is cheap.
- _Separate E2E workflow_: rejected — the existing `workout-spa-editor-e2e.yml` is the right home.

**Layer impact:** Infrastructure (E2E + test harness).

### Decision 4: Committed AT evidence directory

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

- _Git LFS for screenshots_: rejected — screenshots are small (<500 KB each); LFS adds setup complexity.
- _External storage (S3, Drive)_: rejected — defeats the "durable in the repo" goal.

**Layer impact:** Documentation / repository organization.

## Risks / Trade-offs

- **[Risk] History rewrite breaks a call site not covered by tests** → Mitigation: the atomic-PR approach forces TypeScript to surface every consumer; `pnpm lint && pnpm -r build && pnpm -r test` at the PR head is the acceptance gate. The base change already identifies every call site; this hardening only renames the field and composes existing fields into one object.
- **[Risk] `FocusTelemetry` default no-op silently swallows events in unwired deployments** → Acceptable and intentional. The no-op IS the "unwired" behavior. Deployments that care wire the port.
- **[Risk] E2E flakiness (focus assertions are browser-timing-dependent)** → Mitigation: the base change's `useLayoutEffect` + `setTimeout(0)` scheduling is designed for deterministic ordering; E2E waits on `page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === '<name>' || document.activeElement?.textContent?.trim() === '<name>')` — an accessible-name assertion consistent with the `getByRole('listitem', { name: ... })` strategy committed in Decision 3. Never `dataset.testid` (testids are not part of the production bundle strategy).
- **[Risk] AT evidence goes stale without refresh** → Mitigation: the runbook + CODEOWNERS rule + a quarterly scheduled-issue refresh keep it fresh. Stale evidence is still better than no evidence.
- **[Trade-off] Strict Mode re-run doubles test duration for focus integration** → Acceptable; base task §8 has ~20 integration tests; a 2× run is ~40 tests, well within the CI budget. If a hot-spot emerges we can split the describe in half.
- **[Trade-off] No runtime kill-switch for focus management** → Acceptable. Kill-switches add substantial surface (hook, context, UI route, banner, telemetry event, retirement policy) and their very existence hints at shipping something fragile. The base change's own correctness tests are the guarantor; for any post-deploy regression, the rollback path is a standard client-side redeploy of the prior build — same as any other bug. Removing the kill-switch simplifies the hardening and keeps the telemetry port focused on post-deploy diagnostics rather than operational levers.

## Migration Plan

Phases in order (each is its own PR):

1. **Phase A — Telemetry port**: ship `FocusTelemetry`, `FocusTelemetryContext`, `defaultFocusTelemetry`, and the `safeEmit` wrapper. No hook-consumer wiring yet. Independent and non-breaking. Unit tests only.
2. **Phase B — Atomic history rewrite PR**: breaking rename `workoutHistory` + `selectionHistory` → `undoHistory: Array<HistoryEntry>` across every consumer; single PR; all tests green at HEAD. Before opening the PR, post a complete consumer inventory (grep of `workoutHistory|selectionHistory` in the monorepo) as a PR comment so reviewers can confirm the rename surface.
3. **Phase C — Wire telemetry events into `useFocusAfterAction`**: non-breaking additions that consume Phase A's seams and Phase B's history shape.
4. **Phase D — E2E spec + StrictMode describe.each wrapper + AT evidence**: additive; new tests + docs only.

**Rollback order** (reverse-dependency):

- To roll back _Phase D_: revert Phase D's PR. Phase C, B, A remain.
- To roll back _Phase C_ (telemetry events in the hook): revert Phase C's PR. Phase B, A remain. Hook reverts to pre-telemetry behavior; seams stay available for re-wiring.
- To roll back _Phase B_ (atomic history rewrite): must first revert Phase C AND Phase D (both reference `undoHistory`). Attempting to revert Phase B alone while later phases still use `undoHistory` will produce a broken build. A pre-revert smoke test is `pnpm -F @kaiord/workout-spa-editor build`.
- To roll back _Phase A_ (seams): revert its PR. Requires Phases B, C, D to be already reverted since they depend on the seams' types.

For _runtime_ focus-management regressions, rollback is a full redeploy of the prior build; no in-app kill-switch exists (see Non-Goals).

**Smoke tests per revert:**

- After any revert: `pnpm -r test && pnpm -r build && pnpm -F @kaiord/workout-spa-editor test:e2e` must all pass.
- After Phase B revert specifically: verify `rg 'undoHistory\[' packages/workout-spa-editor/src/store` returns zero matches and `rg 'workoutHistory|selectionHistory' packages/workout-spa-editor/src/store` shows the restored pair.

## Open Questions

- Which telemetry surface will production wire to? Decision deferred to the deployment owner — the seam is the contract. Document candidates (Sentry, Datadog RUM, LogRocket) in `src/store/README.md` with example wiring. The first production deployment that wires a telemetry backend closes this open question.
- How often should AT evidence be refreshed? **Resolved: quarterly on a cron schedule, with an immediate refresh trigger on any React / Radix / Zustand major version bump.** The scheduled refresh is enforced via `.github/workflows/accessibility-evidence-refresh.yml` which opens a tracking issue from `.github/ISSUE_TEMPLATE/refresh-accessibility-evidence.md`; the dependency-bump trigger is caught by renovate/dependabot reviewer instructions.
