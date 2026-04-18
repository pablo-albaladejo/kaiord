## Application Notes

**Prerequisite:** This delta assumes the base `spa-editor-focus-management` capability has been applied to `openspec/specs/spa-editor-focus-management/spec.md`. The following modifications extend and refine that capability; they do not replace its core requirements.

**Structural rename:** Every reference to `workoutHistory` and `selectionHistory` as two parallel arrays in the base spec is replaced by the single `undoHistory: Array<{ workout: UIWorkout; selection: ItemId | null }>` array. The field is named `undoHistory` (not `history`) to avoid lexical collision with the `window.history` DOM API. The "Selection history recorded alongside workout history" Requirement is REMOVED below; the "Pending focus target tracked in the workout store" and "Focus target and selection history reset across Dexie reloads" requirements are MODIFIED below to re-publish their affected scenarios with the new field name. Scenarios not listed in this delta are unchanged from the base.

## ADDED Requirements

### Requirement: Telemetry events emitted at observed short-circuits

Every short-circuit and fallback path in `useFocusAfterAction` SHALL emit a corresponding `FocusTelemetryEvent` via the injected `FocusTelemetry` function. The events and their payloads SHALL match the contract defined in the `spa-editor-focus-telemetry` capability.

> **Event-to-requirement map:** the telemetry capability defines five event types. Their emission points are spread across requirements in this focus-management capability:
>
> | Event | Emission requirement in focus-management |
> |---|---|
> | `wiring-canary` | Type declared in `spa-editor-focus-telemetry`; emission site is `useFocusAfterAction`'s initial mount within THIS capability — see Scenario "Wiring-canary emitted on initial editor mount with wired telemetry" below |
> | `unresolved-target-fallback` | This requirement (short-circuit on unresolved id) |
> | `form-field-short-circuit` | This requirement (short-circuit on active form field) |
> | `overlay-deferred-apply` | This requirement (deferred apply after overlay close) |
> | `focus-error` | This requirement (`finally` recovery from throw) |

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
- **AND** `deferredForMs` SHALL be the wall-clock milliseconds between the `setPendingFocusTarget` call and the focus apply, quantized to 100 ms buckets

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
- **AND** the selection available for focus-target fallback SHALL be `undoHistory[i + 1].selection` (the selection captured *at the time the undone mutation ran*, which was pushed alongside the mutation's post-state snapshot at index `i + 1`)

> **Off-by-one note:** the two fields come from different indices because `pushHistorySnapshot` captures `selection` as "the selection that was active *before* the mutation" and pairs it with the mutation's *post-state* workout at the same index. On undo, the restored workout is the pre-mutation state (`undoHistory[i].workout`) and the relevant pre-mutation selection is at `undoHistory[i + 1].selection`.

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

`pendingFocusTarget` and `undoHistory` SHALL NOT span a Dexie reload. Upon reloading a workout from Dexie, the workout store SHALL initialize `pendingFocusTarget` to `null`, `undoHistory` to an empty array, `historyIndex` to its initial value, and regenerate all `ItemId` values via the configured `IdProvider`. Every Dexie write SHALL strip `id` fields via a single `stripIds` helper so that no `ItemId` values are persisted.

Scenarios below are re-published verbatim from the base spec (unchanged semantically; required by OpenSpec's MODIFIED delta format, which replaces the entire requirement including its scenario block).

#### Scenario: Dexie reload clears pendingFocusTarget

- **GIVEN** the user set `pendingFocusTarget` to a non-null value before reloading the workout from Dexie
- **WHEN** the workout is reloaded
- **THEN** `pendingFocusTarget` SHALL be `null`

#### Scenario: Dexie reload regenerates ItemId values

- **GIVEN** a workout with known `ItemId` values is persisted to Dexie (after stripping)
- **WHEN** the workout is reloaded
- **THEN** every step and block SHALL receive a freshly generated `ItemId`
- **AND** none of the newly assigned ids SHALL equal any id from before the reload

#### Scenario: Dexie persisted payload contains no ItemId values

- **WHEN** the store writes a workout to Dexie
- **THEN** the persisted JSON SHALL contain no `id` property on any step or block

## REMOVED Requirements

### Requirement: Selection history recorded alongside workout history

**Reason:** The parallel-array invariant (`selectionHistory.length === workoutHistory.length`) is replaced by a structural invariant: `undoHistory: Array<{ workout; selection }>` cannot desynchronize by construction. The former dev-mode runtime length assertion (in `pushHistorySnapshot`) and the `workoutHistory.push` CI grep step introduced by the base change are unnecessary and are removed.

**Migration:** Consumers of `selectionHistory[i]` SHALL read `undoHistory[i].selection` instead. Consumers of `workoutHistory[i]` SHALL read `undoHistory[i].workout`. The `pushHistorySnapshot` helper signature changes from `pushHistorySnapshot(workout, selection)` to `pushHistorySnapshot(entry: HistoryEntry)`; call sites pass `{ workout, selection }` literals. The "Clear workout resets selection history" and "Multi-selection snapshot uses primary id only" scenarios from the REMOVED requirement are preserved as scenarios on the new "Structural history invariant" requirement (ADDED above).
