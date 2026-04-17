## Why

The base change `spa-editor-focus-management` delivers correct focus behavior per WCAG and the expert-panel spec (9.66/10). A subsequent AWS Well-Architected review (adapted for the client-side SPA) surfaced five operational/resilience gaps that the base change's spec-first lens does not catch:

1. **No production telemetry.** The unresolved-target fallback emits `console.warn`, invisible to end users. Focus regressions in production are silent until a screen-reader user opens an issue.
2. **No kill-switch.** The base change touches every mutating action, every list consumer, DnD, context menu, and keyboard handlers. It ships all-or-nothing. If a regression hits a user segment, there is no short-circuit — only a full rollback deploy.
3. **Parallel-array history invariant is dev-only.** `workoutHistory.length === selectionHistory.length` is asserted in dev mode and guarded by a CI grep. A future mutation helper that forgets `pushHistorySnapshot` produces silent wrong-target undo/redo in production until caught by a user bug report.
4. **Manual verification is the only regression gate for cross-browser + Strict Mode behavior.** Tasks 11.5 and 11.8 of the base change are one-shot manual steps; subsequent PRs that touch the focus path have no automated guard.
5. **Accessibility-technology evidence has no durable home.** VoiceOver/NVDA transcripts attached to the base PR are not indexed, not queryable, not versioned. If a regression appears months later, the baseline evidence is gone.

These are not correctness issues — the base change is shippable without them — but they materially affect how focus management survives contact with production and with future contributors.

## What Changes

- **Focus kill-switch**: `KAIORD_FOCUS_MANAGEMENT=off` (env var at build time; `localStorage.kaiordFocusManagement = 'off'` at runtime) short-circuits `useFocusAfterAction` to a no-op. Selection and ID behavior are retained; only programmatic focus moves are disabled. Restores the pre-change "focus falls to body" behavior as a rollback path without redeploying.
- **Structural history invariant**: merge `workoutHistory: Array<UIWorkout>` + `selectionHistory: Array<ItemId | null>` into `history: Array<{ workout: UIWorkout; selection: ItemId | null }>`. Makes the length-invariant structurally impossible to violate; retires the dev-mode runtime assertion and the CI grep introduced in base task 4.2.d.
- **Focus telemetry port**: `FocusTelemetry` service-locator seam with a no-op default implementation and an event contract covering `unresolved-target-fallback`, `form-field-short-circuit`, `overlay-deferred-apply`, `focus-error`. Production deployments can wire it to Sentry or any other error surface without changing the focus-rule call sites.
- **E2E automation + StrictMode test run**: a Playwright spec (`focus-management.spec.ts`) drives delete, paste, duplicate, reorder, group, ungroup via keyboard, context menu, and toolbar in Chrome/Firefox/Safari, asserting `document.activeElement` for each. All Vitest focus-integration tests gain a `<StrictMode>` wrapper re-run that asserts identical outcomes.
- **Durable accessibility evidence**: commit VoiceOver + NVDA transcripts and Accessibility Inspector screenshots to `packages/workout-spa-editor/docs/accessibility-evidence/YYYY-MM-DD-focus-management/`. The directory is referenced in the changeset and kept for regression-comparison on future changes.

## Capabilities

### New Capabilities

- `spa-editor-focus-telemetry`: observability seam and default no-op adapter for focus-management runtime events. The seam is a `FocusTelemetry = (event: FocusTelemetryEvent) => void` function plus a discriminated-union event type. Wired call sites in `useFocusAfterAction` emit structured events that a telemetry adapter (customer-wired in production) forwards to an error-reporting surface.

  **Why separable from `spa-editor-focus-management`:** (a) the event type and default implementation have no import dependency on any focus-management type beyond `ItemId` never appearing in payloads; (b) the default no-op ships and tests independently; (c) the seam is deliberately reusable — future capabilities in the SPA (autosave, library sync) can emit telemetry events through the same port without re-inventing the contract; (d) production deployments that wire Sentry/Datadog will configure one provider for all telemetry, not per-capability. The focus-management capability *consumes* the port (hook emits events) but does not *own* it; the port's contract can evolve without touching focus-management scenarios, and vice versa.

### Modified Capabilities

- `spa-editor-focus-management`: (a) add the kill-switch behavior requirement and scenarios; (b) replace the `workoutHistory` + `selectionHistory` pair with the single `history` array and update all scenarios that referenced them; (c) require `FocusTelemetry` emission at each observed short-circuit / fallback; (d) add the durable-AT-evidence requirement.

## Impact

- **Package**: `@kaiord/workout-spa-editor` only
- **Layer**: Infrastructure (UI adapter). No domain or core changes.
- **Prerequisite**: the base change `spa-editor-focus-management` MUST be merged and applied before this hardening lands. The history type rewrite (item 2) is an atomic refactor PR like the base change's §2.
- **Files** (high-level):
  - `src/store/providers/focus-telemetry.ts` — new port + default no-op
  - `src/hooks/use-focus-kill-switch.ts` — new short-circuit
  - `src/hooks/use-focus-after-action.ts` — wire kill-switch + telemetry events
  - `src/store/workout-store-history.ts` — merge parallel arrays into single structure
  - `src/store/workout-state.types.ts` — update `history` typing
  - `packages/workout-spa-editor/e2e/focus-management.spec.ts` — new Playwright spec
  - `packages/workout-spa-editor/docs/accessibility-evidence/<date>-focus-management/` — committed transcripts and screenshots
  - `.github/workflows/workout-spa-editor-e2e.yml` — add the new spec to the matrix
- **Rollback**: kill-switch itself *is* the rollback mechanism. The history rewrite is behind a single atomic PR; rollback = revert that PR.
- **No new npm dependencies**. Playwright is already used for E2E; Vitest already supports `<StrictMode>`.
- **No breaking changes to consumer code**. The kill-switch is opt-in off. The history-structure change is internal to the store (external API — `undo`, `redo`, `canUndo` — unchanged).
