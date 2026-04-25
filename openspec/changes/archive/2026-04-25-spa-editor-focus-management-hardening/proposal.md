## Why

The base change `spa-editor-focus-management` delivers correct focus behavior per WCAG and the expert-panel spec (9.66/10). A subsequent AWS Well-Architected review (adapted for the client-side SPA) surfaced four operational/resilience gaps that the base change's spec-first lens does not catch:

1. **No production telemetry.** The unresolved-target fallback emits `console.warn`, invisible to end users. Focus regressions in production are silent until a screen-reader user opens an issue.
2. **Parallel-array history invariant is dev-only.** `workoutHistory.length === selectionHistory.length` is asserted in dev mode and guarded by a CI grep. A future mutation helper that forgets `pushHistorySnapshot` produces silent wrong-target undo/redo in production until caught by a user bug report.
3. **Manual verification is the only regression gate for cross-browser + Strict Mode behavior.** Tasks 11.5 and 11.8 of the base change are one-shot manual steps; subsequent PRs that touch the focus path have no automated guard.
4. **Accessibility-technology evidence has no durable home.** VoiceOver/NVDA transcripts attached to the base PR are not indexed, not queryable, not versioned. If a regression appears months later, the baseline evidence is gone.

These are not correctness issues — the base change is shippable without them — but they materially affect how focus management survives contact with production and with future contributors.

## What Changes

- **Structural history invariant**: merge `workoutHistory: Array<UIWorkout>` + `selectionHistory: Array<ItemId | null>` into `undoHistory: Array<{ workout: UIWorkout; selection: ItemId | null }>`. The field is named `undoHistory` (not `history`) to avoid lexical collision with the `window.history` DOM API. Makes the length-invariant structurally impossible to violate; retires the dev-mode runtime assertion and the CI grep introduced in base task 4.2.d.
- **Focus telemetry port**: `FocusTelemetry` service-locator seam with a no-op default implementation and an event contract covering `unresolved-target-fallback`, `form-field-short-circuit`, `overlay-deferred-apply`, `focus-error`, `wiring-canary`. Production deployments can wire it to Sentry or any other error surface without changing the focus-rule call sites.
- **E2E automation + StrictMode test run**: a Playwright spec (`focus-management.spec.ts`) drives delete, paste, duplicate, reorder, group, ungroup via keyboard, context menu, and toolbar in Chrome/Firefox/Safari, asserting `document.activeElement` for each. All Vitest focus-integration tests gain a `<StrictMode>` wrapper re-run that asserts identical outcomes.
- **Durable accessibility evidence**: commit VoiceOver + NVDA transcripts and Accessibility Inspector screenshots to `packages/workout-spa-editor/docs/accessibility-evidence/YYYY-MM-DD-focus-management/`. The directory is referenced in the changeset and kept for regression-comparison on future changes.

## Capabilities

### New Capabilities

- `spa-editor-focus-telemetry`: observability seam and default no-op adapter for focus-management runtime events. The seam is a `FocusTelemetry = (event: FocusTelemetryEvent) => void` function plus a discriminated-union event type. Wired call sites in `useFocusAfterAction` emit structured events that a telemetry adapter (customer-wired in production) forwards to an error-reporting surface.

  **Why separable from `spa-editor-focus-management`:** (a) the event type and default implementation have no import dependency on any focus-management type beyond `ItemId` never appearing in payloads; (b) the default no-op ships and tests independently; (c) the seam is deliberately reusable — future capabilities in the SPA (autosave, library sync) can emit telemetry events through the same port without re-inventing the contract; (d) production deployments that wire Sentry/Datadog will configure one provider for all telemetry, not per-capability. The focus-management capability _consumes_ the port (hook emits events) but does not _own_ it; the port's contract can evolve without touching focus-management scenarios, and vice versa.

### Modified Capabilities

- `spa-editor-focus-management`: (a) replace the `workoutHistory` + `selectionHistory` pair with the single `undoHistory` array and update all scenarios that referenced them; (b) require `FocusTelemetry` emission at each observed short-circuit / fallback; (c) add the durable-AT-evidence requirement.

## Impact

- **Package**: `@kaiord/workout-spa-editor` only
- **Layer**: Infrastructure (UI adapter). No domain or core changes.
- **Prerequisite**: the base change `spa-editor-focus-management` MUST be merged and applied before this hardening lands. The history type rewrite is an atomic refactor PR like the base change's §2.
- **Files** (high-level):
  - `src/store/providers/focus-telemetry.ts` — new port + default no-op
  - `src/hooks/use-focus-after-action.ts` — wire telemetry events
  - `src/store/workout-store-history.ts` — merge parallel arrays into single structure
  - `src/store/workout-state.types.ts` — update `undoHistory` typing
  - `packages/workout-spa-editor/e2e/focus-management.spec.ts` — new Playwright spec
  - `packages/workout-spa-editor/docs/accessibility-evidence/<date>-focus-management/` — committed transcripts and screenshots
  - `.github/workflows/workout-spa-editor-e2e.yml` — add the new spec to the matrix
- **Rollback**: the history rewrite is behind a single atomic PR; rollback = revert that PR. For runtime focus-management regressions, rollback is a full redeploy of the prior build — consistent with any other client-side bug that is not gated by the base change's own correctness tests.
- **No new npm dependencies**. Playwright is already used for E2E; Vitest already supports `<StrictMode>`.
- **No breaking changes to consumer code**. The history-structure change is internal to the store (external API — `undo`, `redo`, `canUndo` — unchanged).
