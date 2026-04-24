---
"@kaiord/workout-spa-editor": minor
---

Add FocusTelemetry observability port and StrictMode-safe focus hardening.

**FocusTelemetry seam (Phase A):** A new `FocusTelemetry` function type and
`FocusTelemetryContext` let integrators wire any backend (Sentry, Datadog RUM,
custom) to observe focus events without coupling the hook to a specific SDK.
Five discriminated-union event variants:

- `wiring-canary` — fires once per page-load session on editor mount; absence
  in prod telemetry indicates wiring failure.
- `unresolved-target-fallback` — fires when the fallback chain resolves via
  empty-state, first-item, or heading instead of the intended target.
- `form-field-short-circuit` — fires (debounced ≤ 1/s) when a pending focus
  move is suppressed because a form field is active.
- `overlay-deferred-apply` — fires with `deferredForMs` (100 ms–quantized)
  when a stashed target is re-applied after a Radix overlay closes.
- `focus-error` — fires with `phase: "focus" | "scrollIntoView"` when the
  low-level DOM call throws.

All payloads are structural-fields-only (no ItemIds, step names, or user data).

**Structural history refactor (Phase B, atomic):** Replaced parallel
`workoutHistory: Array<UIWorkout>` + `selectionHistory: Array<ItemId | null>`
with `undoHistory: Array<HistoryEntry>`, where `HistoryEntry = { workout,
selection }`. The new 1-arg `pushHistorySnapshot(entry)` enforces atomic
coupling by construction — no CI grep required.

**StrictMode hardening (Phase D):** Focus integration test suites now run
under both standard and `React.StrictMode` via `describe.each`, proving
double-mount / double-effect semantics do not break focus behaviour. The
`wiring-canary` module-level flag prevents double-emission.

**AT evidence infrastructure (Phase D):** Quarterly VoiceOver + NVDA refresh
workflow added at `.github/workflows/accessibility-evidence-refresh.yml`.
Evidence directory: `packages/workout-spa-editor/docs/accessibility-evidence/2026-04-24-focus-management/`.
Physical AT transcripts (tasks 7.2–7.4) require VoiceOver on macOS and NVDA
on Windows — stubs with full regeneration runbook committed.
