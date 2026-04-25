> Synced: 2026-04-25 (spa-editor-focus-management-hardening)

# Focus Telemetry

## Purpose

An injectable telemetry seam for the workout editor's focus-management hook. Allows production deployments to observe short-circuit and fallback paths (form-field active, unresolved target, overlay deferral, error recovery, and wiring verification) without embedding any platform-specific observability library in the hook itself. All event payloads are privacy-safe: no user content, no `ItemId` values.

## Requirements

### Requirement: Focus telemetry service-locator seam

The workout editor SHALL expose a `FocusTelemetry` injectable seam for observing focus-management runtime events. The seam is a single function type `FocusTelemetry = (event: FocusTelemetryEvent) => void`. `FocusTelemetryEvent` SHALL be a discriminated union covering: wiring canary, unresolved-target fallback, form-field short-circuit, overlay-deferred apply, and focus-error recovery. A default no-op implementation SHALL be provided. Events SHALL carry only structural metadata; `ItemId` values, step content, block content, and workout names SHALL NOT appear in event payloads.

#### Scenario: Default telemetry is a no-op

- **WHEN** the store is constructed without supplying a `FocusTelemetry`
- **THEN** the default no-op implementation SHALL be used
- **AND** no events SHALL be sent anywhere

#### Scenario: Custom telemetry receives events

- **GIVEN** a production deployment wires a custom `FocusTelemetry` (e.g., Sentry integration) via the `FocusTelemetryContext` provider
- **WHEN** any observed focus event occurs
- **THEN** the custom function SHALL be invoked with the event payload
- **AND** the invocation SHALL NOT throw regardless of what the custom function does

#### Scenario: Event payloads contain no user content

- **WHEN** a `FocusTelemetryEvent` is constructed for any event type
- **THEN** the payload SHALL NOT contain any `ItemId` value, step name, step description, block name, or any other workout-content field
- **AND** the payload SHALL contain only enumerated structural fields (event type plus bounded-cardinality metadata such as fallback kind)

#### Scenario: Telemetry function exceptions do not affect focus behavior

- **GIVEN** a custom `FocusTelemetry` implementation throws an exception
- **WHEN** the hook invokes the telemetry function via a single centralized `safeEmit(telemetry, event)` wrapper (all emission call sites in the hook MUST go through this wrapper — no raw `telemetry(event)` calls)
- **THEN** the exception SHALL be caught inside `safeEmit`
- **AND** focus behavior (focus move, pending target clear, etc.) SHALL proceed unaffected
- **AND** a development-only `console.warn` SHALL note the telemetry failure (so local dev does not silently hide broken telemetry wiring)

### Requirement: Focus event types

The `FocusTelemetryEvent` discriminated union SHALL include at minimum the following event types with the specified structural fields:

- `{ type: 'unresolved-target-fallback'; targetKind: 'item' | 'empty-state'; fallback: 'empty-state' | 'first-item' | 'heading' }` — emitted when the hook exercises the fallback chain.
- `{ type: 'form-field-short-circuit' }` — emitted when `pendingFocusTarget` was cleared without moving focus because an input/textarea/select/contentEditable was active. Emission SHALL be debounced: at most one `form-field-short-circuit` event per hook instance per 1000 ms wall-clock window. This breaks correlation with keystroke timing (user typing in a notes field triggers short-circuits on every autosave-driven mutation; unlimited emission would be a keystroke-timing side channel for privacy-relevant workout data).
- `{ type: 'overlay-deferred-apply'; deferredForMs: number }` — emitted when an overlay open caused a focus-target application to be deferred. `deferredForMs` is `Math.round(elapsedMs / 100) * 100` (quantized to 100 ms buckets) so the value cannot reveal fine-grained dialog dwell time (a privacy-relevant indirect indicator of user reading speed or indecision). `deferredForMs` is a non-negative integer. Precision is implementation-defined: in same-origin contexts `performance.now()` typically yields ≥1 ms; in cross-origin iframes it may be reduced to ≥1 ms by the browser. The 100 ms quantization is always the final rounding.
- `{ type: 'focus-error'; phase: 'focus' | 'scrollIntoView' }` — emitted when `focus()` or `scrollIntoView()` threw and the `finally` block recovered the pending-target clear.
- `{ type: 'wiring-canary' }` — emitted exactly once on editor mount if a non-default `FocusTelemetry` is wired. Serves as a deployment smoke-test signal: ops can confirm in the telemetry dashboard that the canary arrived within N seconds of a deploy to verify wiring is live. The default no-op implementation does NOT emit this event (because there is nothing to verify).

#### Scenario: Unresolved-target fallback event carries the exact fallback path taken

- **WHEN** the unresolved-target fallback chain executes
- **THEN** the emitted event's `fallback` field SHALL equal `'empty-state'` if focus landed on the empty-state button, `'first-item'` if focus landed on the first registered item, or `'heading'` if focus landed on the labelled `<h2 tabIndex={-1}>`

#### Scenario: Overlay-deferred-apply event reports quantized defer duration

- **WHEN** a target is set while an overlay is open, held during the overlay's lifetime, and applied on overlay close
- **THEN** the emitted event's `deferredForMs` field SHALL equal `Math.round(measuredMs / 100) * 100` where `measuredMs` is the wall-clock duration between the initial `setPendingFocusTarget` call and the actual focus apply (measured via `performance.now()`)
- **AND** the value SHALL be a non-negative integer (never NaN, never negative, even under clock skew)

#### Scenario: Form-field short-circuit events are debounced

- **WHEN** `pendingFocusTarget` is cleared via the form-field short-circuit five times within 500 ms in a single hook instance
- **THEN** exactly one `form-field-short-circuit` event SHALL be emitted in that window
- **AND** the next `form-field-short-circuit` event SHALL NOT be emitted until at least 1000 ms after the previous emission

#### Scenario: Wiring-canary event fires on mount when a non-default telemetry is provided

- **GIVEN** the editor is mounted with a non-default `FocusTelemetry` wired via `FocusTelemetryContext.Provider`
- **WHEN** the editor first renders
- **THEN** exactly one `{ type: 'wiring-canary' }` event SHALL be emitted
- **AND** subsequent mutations SHALL NOT re-emit the canary

#### Scenario: Wiring-canary event does not fire with the default no-op

- **GIVEN** the editor is mounted without wiring a custom `FocusTelemetry` (the default no-op applies)
- **WHEN** the editor first renders
- **THEN** no observable effect SHALL occur (the no-op swallows the canary call, which is the expected behavior since there is nothing to verify)
