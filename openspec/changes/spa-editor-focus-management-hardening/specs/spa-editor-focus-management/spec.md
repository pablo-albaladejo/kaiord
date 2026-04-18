## Application Notes

**Prerequisite:** This delta assumes the base `spa-editor-focus-management` capability has been applied to `openspec/specs/spa-editor-focus-management/spec.md`. The following modifications extend and refine that capability; they do not replace its core requirements.

**Structural rename:** Every reference to `workoutHistory` and `selectionHistory` as two parallel arrays in the base spec is replaced by the single `history: Array<{ workout: UIWorkout; selection: ItemId | null }>` array. The "Selection history recorded alongside workout history" Requirement is REMOVED below; the "Pending focus target tracked in the workout store" and "Focus target and selection history reset across Dexie reloads" requirements are MODIFIED below to re-publish their affected scenarios with the new field name. Scenarios not listed in this delta are unchanged from the base.

## ADDED Requirements

### Requirement: Runtime kill-switch for focus management

The workout editor SHALL expose a kill-switch that short-circuits programmatic focus moves without requiring a redeploy. `useFocusKillSwitch()` SHALL return `true` (disabled) or `false` (enabled) per the following truth table, where `LS` is `localStorage.kaiordFocusManagement` and `ENV` is `import.meta.env.VITE_KAIORD_FOCUS_MANAGEMENT`:

| LS             | ENV             | Result                                                                |
| -------------- | --------------- | --------------------------------------------------------------------- |
| `'off'`        | any             | `true` (disabled)                                                     |
| `'on'`         | any             | `false` (enabled — runtime force-enable overrides build-time default) |
| unset or other | `'off'`         | `true` (disabled at build time)                                       |
| unset or other | `'on'` or unset | `false` (enabled — default)                                           |

When the switch resolves to `true`, the hook SHALL read and clear `pendingFocusTarget` without calling `focus()` or `scrollIntoView()`, and SHALL leave `selectedStepId`, `undoHistory`, and all undo/redo behavior untouched. The switch value SHALL be read live so a DevTools mutation takes effect on the next render without a page reload.

#### Scenario: localStorage 'off' disables focus moves

- **GIVEN** `localStorage.kaiordFocusManagement === 'off'`
- **WHEN** any mutation sets `pendingFocusTarget`
- **THEN** `useFocusAfterAction` SHALL NOT call `focus()` on any element
- **AND** `pendingFocusTarget` SHALL be cleared to `null` as normal

#### Scenario: Build-time env 'off' disables focus moves

- **GIVEN** the SPA was built with `VITE_KAIORD_FOCUS_MANAGEMENT=off` AND `localStorage.kaiordFocusManagement` is unset
- **WHEN** any mutation sets `pendingFocusTarget`
- **THEN** `useFocusAfterAction` SHALL NOT call `focus()` on any element

#### Scenario: localStorage 'on' overrides build-time 'off'

- **GIVEN** the SPA was built with `VITE_KAIORD_FOCUS_MANAGEMENT=off` AND `localStorage.kaiordFocusManagement === 'on'`
- **WHEN** any mutation sets `pendingFocusTarget`
- **THEN** `useFocusAfterAction` SHALL apply the focus target normally (runtime force-enable wins)

#### Scenario: Default is enabled

- **GIVEN** neither `localStorage.kaiordFocusManagement` nor `VITE_KAIORD_FOCUS_MANAGEMENT` is set to `'off'` or `'on'`
- **WHEN** any mutation sets `pendingFocusTarget`
- **THEN** `useFocusAfterAction` SHALL apply the focus target normally

#### Scenario: Kill-switch does not affect undo/redo semantics

- **GIVEN** the kill-switch is active
- **WHEN** a sequence of mutations followed by undo/redo runs
- **THEN** `currentWorkout`, `selectedStepId`, and `undoHistory[i]` (for every valid `i`) SHALL be identical to the values produced when the kill-switch is inactive
- **AND** only `document.activeElement` SHALL differ

#### Scenario: Kill-switch read is live across session via custom event

- **GIVEN** the editor is mounted with the kill-switch inactive
- **WHEN** `localStorage.kaiordFocusManagement = 'off'` is set AND a `window.dispatchEvent(new Event('kaiord:focus-kill-switch-change'))` fires
- **THEN** the next mutation SHALL be processed with the kill-switch active (no `focus()` call)
- **AND** conversely, unsetting or flipping to `'on'` with the matching dispatch SHALL restore normal behavior on the following mutation

#### Scenario: Same-tab localStorage mutation without dispatch does not take effect immediately

- **GIVEN** the editor is mounted with the kill-switch inactive
- **WHEN** `localStorage.kaiordFocusManagement = 'off'` is set in DevTools WITHOUT dispatching `kaiord:focus-kill-switch-change`
- **THEN** the hook's cached value SHALL remain `false` until the custom event fires, a cross-tab `storage` event arrives, or the page reloads
- **AND** this limitation SHALL be documented in the support runbook so DevTools users know the required dispatch call

#### Scenario: Kill-switch emits telemetry on each false→true transition

- **WHEN** the kill-switch's effective value transitions from `false` to `true` within a hook instance (either on mount while already `true`, or via a live localStorage change)
- **THEN** a `FocusTelemetry` event `{ type: 'kill-switch-active' }` SHALL be emitted
- **AND** consecutive renders where the value remains `true` SHALL NOT emit additional events
- **AND** a subsequent `true → false → true` transition SHALL emit a fresh event

#### Scenario: Kill-switch active state is displayed in editor shell only

- **GIVEN** the kill-switch effective value is `true`
- **WHEN** the editor's `WorkoutList` shell renders
- **THEN** a visible, non-modal banner SHALL be rendered as the first child of the editor shell's `role="main"` landmark, before the toolbar
- **AND** the banner SHALL display "Focus management disabled — Change in Focus Diagnostics" with a link to `/settings/focus-diagnostics` (link text matches the target page's `<h1>`)
- **AND** the banner SHALL be intentionally non-dismissible (its presence IS the operational signal that the editor is in a non-steady-state posture)
- **AND** the banner SHALL NOT appear on the `/settings/focus-diagnostics` page itself (the diagnostics page has its own read-only status display)
- **AND** the banner SHALL NOT appear when the effective value is `false`

#### Scenario: Kill-switch transitions announce via dedicated live region

- **GIVEN** a sibling (non-nested) `<div aria-live="polite" className="sr-only">` region is mounted alongside the visible banner
- **WHEN** the effective kill-switch value transitions `false → true`
- **THEN** the live region's text content SHALL change from `""` to `"Focus management disabled"`, then back to `""` after ~100 ms to arm the next announcement
- **AND** when the effective value transitions `true → false`, the same region SHALL cycle `""` → `"Focus management enabled"` → `""`
- **AND** consecutive renders with the value unchanged SHALL NOT change the live region's text content
- **AND** the visible banner's ARIA role MUST NOT be `role="status"` (which would create a nested-live-region double-announcement with the dedicated region)

#### Scenario: First-mount with already-disabled kill-switch shows banner without announcement

- **GIVEN** the editor mounts for the first time with the kill-switch already `true`
- **WHEN** the initial render commits
- **THEN** the visible banner SHALL render
- **AND** the live region's text SHALL remain `""` (no initial-mount announcement)
- **AND** screen-reader users discover the banner via Tab traversal of the `<main>` landmark; this is an intentional behavioral choice to avoid audio clutter on editor load

#### Scenario: Kill-switch banner honors prefers-reduced-motion

- **WHEN** `@media (prefers-reduced-motion: reduce)` matches
- **THEN** the banner SHALL enter and exit without any `transition` or `animation` property applied

#### Scenario: Focus-visible CSS unaffected by kill-switch

- **GIVEN** the kill-switch is active and a user has tab-focused a step card
- **WHEN** an unrelated mutation runs (does not unmount the focused element)
- **THEN** the step card's `:focus-visible` ring SHALL remain visible per normal browser behavior
- **AND** if the mutation unmounts the focused element, focus SHALL fall to `document.body`

> **Note:** the `document.body` fallback is the pre-base-change behavior the kill-switch exists to restore as a rollback; it is the intended posture when the switch is active, not a regression within the hardening's own scope.

### Requirement: Telemetry events emitted at observed short-circuits

Every short-circuit and fallback path in `useFocusAfterAction` SHALL emit a corresponding `FocusTelemetryEvent` via the injected `FocusTelemetry` function. The events and their payloads SHALL match the contract defined in the `spa-editor-focus-telemetry` capability.

> **Event-to-requirement map:** the telemetry capability defines six event types. Their emission points are spread across requirements in this focus-management capability:
>
> | Event                        | Emission requirement in focus-management                                                                                                                                                                               |
> | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
> | `kill-switch-active`         | "Runtime kill-switch for focus management" (on each false→true transition)                                                                                                                                             |
> | `wiring-canary`              | Type declared in `spa-editor-focus-telemetry`; emission site is `useFocusAfterAction`'s initial mount within THIS capability — see Scenario "Wiring-canary emitted on initial editor mount with wired telemetry" below |
> | `unresolved-target-fallback` | This requirement (short-circuit on unresolved id)                                                                                                                                                                      |
> | `form-field-short-circuit`   | This requirement (short-circuit on active form field)                                                                                                                                                                  |
> | `overlay-deferred-apply`     | This requirement (deferred apply after overlay close)                                                                                                                                                                  |
> | `focus-error`                | This requirement (`finally` recovery from throw)                                                                                                                                                                       |

#### Scenario: Unresolved-target fallback emits telemetry

- **WHEN** the unresolved-target fallback chain runs
- **THEN** a `{ type: 'unresolved-target-fallback', targetKind, fallback }` event SHALL be emitted immediately before the fallback focus call
- **AND** `fallback` SHALL reflect the actual element that received focus

#### Scenario: Form-field short-circuit emits telemetry

- **WHEN** `pendingFocusTarget` is cleared without moving focus because `document.activeElement` is an input/textarea/select/contentEditable inside the editor
- **THEN** a `{ type: 'form-field-short-circuit' }` event SHALL be emitted

#### Scenario: Overlay-deferred apply emits telemetry with wall-clock delay

- **WHEN** a target is deferred during an overlay's open state and subsequently applied on overlay close
- **THEN** a `{ type: 'overlay-deferred-apply', deferredForMs }` event SHALL be emitted
- **AND** `deferredForMs` SHALL be the wall-clock milliseconds between the `setPendingFocusTarget` call and the focus apply

#### Scenario: Focus error recovery emits telemetry

- **WHEN** the `focus()` or `scrollIntoView()` call throws and the `finally` block recovers the pending-target clear
- **THEN** a `{ type: 'focus-error', phase }` event SHALL be emitted
- **AND** `phase` SHALL indicate which call threw (`'focus'` or `'scrollIntoView'`)

#### Scenario: Wiring-canary emitted on initial editor mount with wired telemetry

- **GIVEN** a non-default `FocusTelemetry` is provided via `FocusTelemetryContext.Provider` at the editor root
- **WHEN** the editor mounts for the first time in the current page-load session
- **THEN** `useFocusAfterAction` SHALL emit exactly one `{ type: 'wiring-canary' }` event
- **AND** subsequent mounts within the same page-load session (e.g., React Strict Mode double-mount, route re-navigation) SHALL NOT re-emit the canary (module-level session guard)
- **AND** a full page reload SHALL reset the session and re-emit on the next mount (reload = fresh deployment verification signal)

### Requirement: Structural history invariant

The workout store SHALL expose `undoHistory: Array<{ workout: UIWorkout; selection: ItemId | null }>` (type alias `UndoHistory`) as the single source of truth for undo/redo. The field is named `undoHistory` (not `history`) to avoid lexical collision with the `window.history` DOM API. `historyIndex: number` SHALL reference positions in this array. The pre-hardening parallel arrays `workoutHistory` and `selectionHistory` SHALL NOT exist. `pushHistorySnapshot(entry: HistoryEntry)` SHALL push a single tuple atomically. The length invariant between workout and selection pieces SHALL be structurally enforced — no runtime assertion or CI grep is required.

#### Scenario: History push is atomic

- **WHEN** any mutation pushes to `undoHistory`
- **THEN** exactly one `HistoryEntry` SHALL be appended in a single operation
- **AND** it SHALL be impossible for workout and selection state to drift in length

#### Scenario: Undo restores workout at index and selection from subsequent snapshot

- **WHEN** `undo` decrements `historyIndex` to `i`
- **THEN** the restored workout SHALL be `undoHistory[i].workout`
- **AND** the selection available for focus-target fallback SHALL be `undoHistory[i + 1].selection` (the selection captured _at the time the undone mutation ran_, which was pushed alongside the mutation's post-state snapshot at index `i + 1`)

> **Off-by-one note:** the two fields come from different indices because `pushHistorySnapshot` captures `selection` as "the selection that was active _before_ the mutation" and pairs it with the mutation's _post-state_ workout at the same index. On undo, the restored workout is the pre-mutation state (`undoHistory[i].workout`) and the relevant pre-mutation selection is at `undoHistory[i + 1].selection`.

#### Scenario: Clear workout resets the single history array

- **WHEN** `clearWorkout` is called
- **THEN** `undoHistory` SHALL be reset to an empty array
- **AND** `historyIndex` SHALL be reset to its initial value

#### Scenario: Multi-selection snapshot uses primary id only

- **WHEN** a mutation pushes a snapshot while `selectedStepIds` contains multiple ids
- **THEN** the pushed `HistoryEntry.selection` SHALL be `selectedStepId` (the primary single-selection id), not the full `selectedStepIds` array

> **Provenance:** semantics preserved from the REMOVED "Selection history recorded alongside workout history" requirement and re-homed here on the structural requirement. Multi-ID capture is intentionally out of scope for undo-focus fallback.

### Requirement: Durable accessibility-technology evidence

The repository SHALL contain a directory `packages/workout-spa-editor/docs/accessibility-evidence/YYYY-MM-DD-focus-management/` with VoiceOver (macOS) and NVDA (Windows + Firefox latest) transcripts of the core mutation → focus sequences, plus Accessibility Inspector screenshots. A short runbook `README.md` in the directory SHALL describe how to regenerate the evidence. Changes to focus behavior in subsequent releases SHALL refresh the directory (tracked via CODEOWNERS or reviewer checklist).

#### Scenario: Evidence directory exists on main

- **WHEN** this hardening change is merged
- **THEN** `packages/workout-spa-editor/docs/accessibility-evidence/<date>-focus-management/voiceover-macos.md`, `nvda-windows.md`, `screenshots/`, and `README.md` SHALL all exist on the default branch

#### Scenario: Evidence runbook is reproducible

- **WHEN** a contributor follows the runbook's regeneration steps
- **THEN** they SHALL produce transcripts of comparable format, containing the same mutation sequences and announcement annotations

## MODIFIED Requirements

### Requirement: Pending focus target tracked in the workout store

The workout store SHALL expose `pendingFocusTarget: FocusTarget | null` state and a `setPendingFocusTarget(target)` action, where `FocusTarget = { kind: 'item'; id: ItemId } | { kind: 'empty-state' }`. Every built-in store action that mutates the step list SHALL set `pendingFocusTarget` as part of the same state update.

Only the two scenarios below change in this delta; all other scenarios under this requirement in the base spec are preserved unchanged.

#### Scenario: Undo of add, paste, or duplicate restores prior selection when possible

- **GIVEN** `undoHistory[i + 1].selection` records the selection immediately before a reversed add/paste/duplicate (where `i` is the `historyIndex` after undo), and the recorded selected item is still present in the restored workout
- **WHEN** `undo` reverses the mutation
- **THEN** `pendingFocusTarget` SHALL be set to `{ kind: 'item', id: <id of the recorded previously selected item> }`

#### Scenario: Undo of add, paste, or duplicate falls back to same-index item

- **GIVEN** no recorded prior selection exists in `undoHistory[i + 1].selection` (i.e., it is `null`) or the recorded item is no longer present in the restored workout
- **WHEN** `undo` reverses the add/paste/duplicate mutation
- **THEN** `pendingFocusTarget` SHALL be set to `{ kind: 'item', id: <id of the item now at the index that was added> }` if such an item exists; otherwise `{ kind: 'empty-state' }`

### Requirement: Focus target and selection history reset across Dexie reloads

`pendingFocusTarget` and `undoHistory` SHALL NOT span a Dexie reload. Upon reloading a workout from Dexie, the workout store SHALL initialize `pendingFocusTarget` to `null`, `history` to an empty array, `historyIndex` to its initial value, and regenerate all `ItemId` values via the configured `IdProvider`. Every Dexie write SHALL strip `id` fields via a single `stripIds` helper so that no `ItemId` values are persisted.

Only the "history reset" concern changes here; the "Dexie reload clears pendingFocusTarget", "Dexie reload regenerates ItemId values", and "Dexie persisted payload contains no ItemId values" scenarios in the base spec are preserved unchanged.

## REMOVED Requirements

### Requirement: Selection history recorded alongside workout history

**Reason:** The parallel-array invariant (`selectionHistory.length === workoutHistory.length`) is replaced by a structural invariant: `undoHistory: Array<{ workout; selection }>` cannot desynchronize by construction. The former dev-mode runtime length assertion (in `pushHistorySnapshot`) and the `workoutHistory.push` CI grep step introduced by the base change are unnecessary and are removed.

**Migration:** Consumers of `selectionHistory[i]` SHALL read `undoHistory[i].selection` instead. Consumers of `workoutHistory[i]` SHALL read `undoHistory[i].workout`. The `pushHistorySnapshot` helper signature changes from `pushHistorySnapshot(workout, selection)` to `pushHistorySnapshot(entry: HistoryEntry)`; call sites pass `{ workout, selection }` literals. The "Clear workout resets selection history" and "Multi-selection snapshot uses primary id only" scenarios from the REMOVED requirement are preserved as scenarios on the new "Structural history invariant" requirement (ADDED above).
