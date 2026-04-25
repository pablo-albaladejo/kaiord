> Synced: 2026-04-25 (spa-editor-focus-management-hardening)

# Focus Management

## Purpose

Programmatic focus management for the workout editor: store actions write a `pendingFocusTarget` intent after every mutation, a post-commit React hook resolves that intent against a DOM registry and moves caret focus with a11y-aware scroll, and an overlay-aware guard defers focus while a Radix dialog or menu is open. The capability ensures keyboard-only and screen-reader users never lose their place after delete, paste, add, duplicate, reorder, undo, redo, group, or ungroup.

## Requirements

### Requirement: Stable item identifiers in the workout step list

Every step and repetition block in the in-memory workout editor state (`UIWorkout`) SHALL carry a stable identifier of branded type `ItemId` that persists across reordering, duplication, paste, undo/redo, group, and ungroup operations within a single session. Identifiers SHALL be opaque strings produced by an injectable `IdProvider` port whose default implementation returns `crypto.randomUUID()`. Identifiers SHALL NOT be derived from an item's position. Identifiers SHALL NOT be persisted to disk or serialized into portable formats.

#### Scenario: Identifier persists after reordering

- **WHEN** a step is reordered within the main workout list via Alt+ArrowUp, Alt+ArrowDown, or drag-and-drop
- **THEN** the step's `id` property SHALL remain the same `ItemId` value before and after the reorder

#### Scenario: Identifier persists after delete plus undo

- **WHEN** a step is deleted and then restored via undo (Cmd+Z) or `undoDelete`
- **THEN** the restored step SHALL carry the same `ItemId` it had before deletion

#### Scenario: Newly created item receives a fresh identifier

- **WHEN** a step or block is created via `createStep`, `createEmptyRepetitionBlock`, `pasteStep`, `duplicateStep`, or `duplicateStepInRepetitionBlock`
- **THEN** the new item SHALL receive a new `ItemId` distinct from every other item currently in the `UIWorkout`

#### Scenario: Identifier is assigned on KRD load

- **WHEN** a KRD workout is loaded via `loadWorkout` (including reload from Dexie persistence)
- **THEN** every step and repetition block in the resulting store state SHALL have an `id` property set to a fresh `ItemId` produced by the configured `IdProvider`

#### Scenario: Identifier is stripped before invoking core conversion ports

- **WHEN** a `UIWorkout` is exported via the SPA's export wrapper before being passed to any `@kaiord/core` conversion port
- **THEN** the `id` property SHALL be removed from every step and block, producing a clean `KRD` payload whose JSON representation contains no `ItemId` values

#### Scenario: Deterministic identifiers in tests via IdProvider injection

- **WHEN** a store is constructed in tests with an `IdProvider` returning a deterministic sequence
- **THEN** every newly introduced item SHALL receive an id matching that sequence

### Requirement: Pending focus target tracked in the workout store

The workout store SHALL expose `pendingFocusTarget: FocusTarget | null` state and a `setPendingFocusTarget(target)` action, where `FocusTarget = { kind: 'item'; id: ItemId } | { kind: 'empty-state' }`. Every built-in store action that mutates the step list SHALL set `pendingFocusTarget` as part of the same state update.

#### Scenario: Delete in main list sets focus target to the next sibling

- **GIVEN** a main workout list where the deleted item has a subsequent sibling
- **WHEN** a step or block is deleted via `deleteStep` or `deleteRepetitionBlock`
- **THEN** `pendingFocusTarget` SHALL be set to `{ kind: 'item', id: <id of the next top-level sibling> }`

#### Scenario: Delete of last item in main list sets focus target to the previous sibling

- **GIVEN** a main workout list where the deleted item has no subsequent sibling but has a preceding sibling
- **WHEN** the last item in the main list is deleted
- **THEN** `pendingFocusTarget` SHALL be set to `{ kind: 'item', id: <id of the preceding top-level sibling> }`

#### Scenario: Delete of only item in main list sets focus target to empty-state

- **GIVEN** a main workout list containing exactly one item
- **WHEN** that item is deleted
- **THEN** `pendingFocusTarget` SHALL be set to `{ kind: 'empty-state' }`

#### Scenario: Delete of step inside repetition block with subsequent sibling

- **GIVEN** a step inside a repetition block with at least one subsequent sibling inside the same block
- **WHEN** the step is deleted via `deleteStep` with the block as parent
- **THEN** `pendingFocusTarget` SHALL be set to `{ kind: 'item', id: <id of the next sibling inside the same block> }`

#### Scenario: Delete of last step inside repetition block

- **GIVEN** a step inside a repetition block that has no subsequent sibling inside the block but has a preceding sibling inside the block
- **WHEN** the step is deleted
- **THEN** `pendingFocusTarget` SHALL be set to `{ kind: 'item', id: <id of the preceding sibling inside the same block> }`

#### Scenario: Delete of only step inside repetition block

- **GIVEN** a step is the only remaining child of a repetition block
- **WHEN** the step is deleted
- **THEN** the parent repetition block SHALL be deleted in the same state update
- **AND** `pendingFocusTarget` SHALL be computed by applying the main-list delete rules to the (now-deleted) parent block's position

#### Scenario: Delete of only step inside the only block in main list cascades to empty-state

- **GIVEN** the main list contains exactly one repetition block and that block contains exactly one step
- **WHEN** the step is deleted
- **THEN** the step, the now-empty parent block, and the main list SHALL all be empty in the same state update
- **AND** `pendingFocusTarget` SHALL be set to `{ kind: 'empty-state' }`

#### Scenario: Multi-selection is constrained to a single parent

- **GIVEN** the selection model
- **WHEN** the user attempts to extend a multi-selection across the main list and the inside of a repetition block
- **THEN** the selection SHALL be replaced rather than extended, so that `selectedStepIds` always contains items sharing a single parent (either all in the main list or all inside the same block)

#### Scenario: Multi-select delete with items remaining after last-deleted position

- **GIVEN** multiple steps are selected (contiguous or non-contiguous) sharing a single parent, and at least one item exists after the last-deleted item's original position in that parent
- **WHEN** the selected steps are deleted in a single action
- **THEN** `pendingFocusTarget` SHALL be set to `{ kind: 'item', id: <id of the first remaining item after the last-deleted item's original position in the shared parent> }`

#### Scenario: Multi-select delete with no items after last-deleted position

- **GIVEN** multiple steps are selected and no item exists after the last-deleted item's original position, but at least one item exists before the first-deleted item's original position
- **WHEN** the selected steps are deleted
- **THEN** `pendingFocusTarget` SHALL be set to `{ kind: 'item', id: <id of the last remaining item before the first-deleted item's original position> }`

#### Scenario: Multi-select delete leaving empty list

- **GIVEN** all items in the main list are selected
- **WHEN** the selected items are deleted
- **THEN** `pendingFocusTarget` SHALL be set to `{ kind: 'empty-state' }`

#### Scenario: Paste validates payload and regenerates IDs before setting focus target

- **GIVEN** the clipboard store contains a payload (potentially supplied by a rogue same-origin script, extension, or other tab)
- **WHEN** `pasteStep` executes
- **THEN** the payload SHALL first be parsed through the existing workout step / repetition block Zod schema; malformed payloads SHALL be rejected with an error toast and no store mutation
- **AND** every `id` field on the validated payload SHALL be overwritten with a freshly generated `ItemId` from the configured `IdProvider`, never trusted from the clipboard
- **AND** only after validation and regeneration SHALL `pasteStep` write to `currentWorkout` and set `pendingFocusTarget`

#### Scenario: Paste sets focus target to the top-level pasted item

- **WHEN** `pasteStep` successfully pastes a step or repetition block from the clipboard into the workout
- **THEN** `pendingFocusTarget` SHALL be set to `{ kind: 'item', id: <freshly generated id of the top-level pasted item> }`
- **AND** if the pasted clipboard entry is a repetition block, the target SHALL be the block's root id, not the first child step's id
- **AND** the id set as the focus target SHALL NOT be any id value from the clipboard payload

#### Scenario: Add sets focus target to the new item

- **WHEN** `createStep`, `createEmptyRepetitionBlock`, or `addStepToRepetitionBlock` creates a new item
- **THEN** `pendingFocusTarget` SHALL be set to `{ kind: 'item', id: <id of the new item> }`

#### Scenario: Duplicate sets focus target to the duplicate

- **WHEN** `duplicateStep` or `duplicateStepInRepetitionBlock` creates a copy of an existing item
- **THEN** `pendingFocusTarget` SHALL be set to `{ kind: 'item', id: <id of the copy> }`

#### Scenario: Group sets focus target to the new block

- **WHEN** `createRepetitionBlock` groups two or more selected steps into a new repetition block
- **THEN** `pendingFocusTarget` SHALL be set to `{ kind: 'item', id: <id of the new block> }`

#### Scenario: Ungroup sets focus target to first formerly-child step

- **GIVEN** a repetition block with at least one child step
- **WHEN** `ungroupRepetitionBlock` ungroups the block into individual top-level steps
- **THEN** `pendingFocusTarget` SHALL be set to `{ kind: 'item', id: <id of the first step that was formerly inside the block, at its new top-level position> }`

#### Scenario: Ungroup of empty block falls back to sibling or empty-state

- **GIVEN** a repetition block with zero child steps
- **WHEN** `ungroupRepetitionBlock` removes the block from the main list
- **THEN** `pendingFocusTarget` SHALL be computed by applying the main-list delete rules (next sibling, else previous sibling, else empty-state) to the block's former position

#### Scenario: Edit repetition block does not change focus target

- **WHEN** `editRepetitionBlock` changes the repetition count of a block without adding or removing items
- **THEN** `pendingFocusTarget` SHALL NOT be changed by the action

#### Scenario: Clear workout clears focus target

- **WHEN** `clearWorkout` is called
- **THEN** `pendingFocusTarget` SHALL be set to `null`

#### Scenario: Undo of delete sets focus target to the restored item

- **WHEN** `undoDelete` or `undo` restores a previously deleted step or block
- **THEN** `pendingFocusTarget` SHALL be set to `{ kind: 'item', id: <id of the restored item> }`

#### Scenario: Undo of add, paste, or duplicate restores prior selection when possible

- **GIVEN** `undoHistory[i + 1].selection` records the selection immediately before a reversed add/paste/duplicate (where `i` is the `historyIndex` after undo), and the recorded selected item is still present in the restored workout
- **WHEN** `undo` reverses the mutation
- **THEN** `pendingFocusTarget` SHALL be set to `{ kind: 'item', id: <id of the recorded previously selected item> }`

#### Scenario: Undo of add, paste, or duplicate falls back to same-index item

- **GIVEN** no recorded prior selection exists in `undoHistory[i + 1].selection` (i.e., it is `null`) or the recorded item is no longer present in the restored workout
- **WHEN** `undo` reverses the add/paste/duplicate mutation
- **THEN** `pendingFocusTarget` SHALL be set to `{ kind: 'item', id: <id of the item now at the index that was added> }` if such an item exists; otherwise `{ kind: 'empty-state' }`

#### Scenario: Undo of group restores prior selection

- **WHEN** `undo` reverses a `createRepetitionBlock` group action
- **THEN** `pendingFocusTarget` SHALL be set to `{ kind: 'item', id: <id of the first formerly-selected step at its pre-group position> }` if present; otherwise the same-index fallback from the add/paste/duplicate rule SHALL apply

#### Scenario: Undo of ungroup restores the block

- **WHEN** `undo` reverses an `ungroupRepetitionBlock` action
- **THEN** `pendingFocusTarget` SHALL be set to `{ kind: 'item', id: <id of the restored repetition block> }`

#### Scenario: Undo of edit does not change focus target

- **WHEN** `undo` reverses an `editRepetitionBlock` action
- **THEN** `pendingFocusTarget` SHALL NOT be changed by the undo

#### Scenario: Undo of reorder sets focus target to the reverted item

- **WHEN** `undo` reverses a reorder action
- **THEN** `pendingFocusTarget` SHALL be set to `{ kind: 'item', id: <id of the moved item at its pre-reorder position> }`

#### Scenario: Redo of delete re-applies the next-sibling rule

- **WHEN** `redo` re-applies a previously undone delete
- **THEN** `pendingFocusTarget` SHALL be computed by the delete rules against the post-redo workout state

#### Scenario: Redo of add, paste, duplicate, or group re-focuses the created item

- **WHEN** `redo` re-applies a previously undone add, paste, duplicate, or group action
- **THEN** `pendingFocusTarget` SHALL be set to `{ kind: 'item', id: <id of the newly-recreated item> }`

#### Scenario: Redo of ungroup re-focuses the first formerly-child step

- **WHEN** `redo` re-applies a previously undone ungroup
- **THEN** `pendingFocusTarget` SHALL be set to `{ kind: 'item', id: <id of the first formerly-child step at its new top-level position> }`

#### Scenario: Redo of edit does not change focus target

- **WHEN** `redo` re-applies a previously undone edit
- **THEN** `pendingFocusTarget` SHALL NOT be changed by the redo

#### Scenario: Redo of reorder sets focus target to the moved item

- **WHEN** `redo` re-applies a previously undone reorder
- **THEN** `pendingFocusTarget` SHALL be set to `{ kind: 'item', id: <id of the moved item at its post-reorder position> }`

#### Scenario: Redo overwrites any user-set pending focus target

- **GIVEN** `pendingFocusTarget` was manually set to a non-null value via `setPendingFocusTarget` between an `undo` and a `redo`
- **WHEN** `redo` re-applies a previously undone mutation whose forward-rule would set `pendingFocusTarget`
- **THEN** the forward-rule's target SHALL overwrite the user-set target unconditionally (edit and no-op redo branches do not set a target and therefore do not overwrite)

#### Scenario: Reorder sets focus target to the moved item

- **WHEN** a step or block is moved via `reorderStep`, `reorderStepsInBlock`, or drag-and-drop
- **THEN** `pendingFocusTarget` SHALL be set to `{ kind: 'item', id: <id of the moved item at its new position> }`

#### Scenario: Reorder of already-focused item does not trigger redundant scroll

- **GIVEN** `document.activeElement` is the moved item's registered DOM node
- **WHEN** the item is reordered
- **THEN** the focus hook's `prevTarget` guard SHALL detect that the resolved element already has focus
- **AND** `scrollIntoView` SHALL NOT be called in a way that produces a visible scroll animation jump beyond what native focus handling already does

#### Scenario: Rapid sequential mutations apply only the final target

- **WHEN** multiple mutations set `pendingFocusTarget` within a single React batch or before the focus hook applies
- **THEN** only the most recently set target SHALL be applied to the DOM; intermediate targets SHALL be discarded

#### Scenario: Setter clears the target

- **WHEN** `setPendingFocusTarget(null)` is called
- **THEN** `pendingFocusTarget` SHALL be `null` on subsequent reads

#### Scenario: Setter overwrites a previous non-null target

- **WHEN** `setPendingFocusTarget(targetA)` is called and then `setPendingFocusTarget(targetB)` is called before the hook applies either
- **THEN** `pendingFocusTarget` SHALL read as `targetB` on subsequent reads

#### Scenario: Setter accepts a target whose id is not present in the workout

- **WHEN** `setPendingFocusTarget({ kind: 'item', id: <id not present in the current workout> })` is called
- **THEN** the state SHALL accept the value without throwing

#### Scenario: Hook applies unresolved-target fallback when id cannot be resolved

- **GIVEN** `pendingFocusTarget` is `{ kind: 'item', id: X }` where `X` cannot be resolved by `resolveItem` at the time the layout effect runs
- **WHEN** the layout effect runs
- **THEN** the unresolved-target fallback chain SHALL apply as specified in the "Unresolved target falls back to the editor's labelled heading" scenario

### Requirement: Structural history invariant

The workout store SHALL expose `undoHistory: Array<{ workout: UIWorkout; selection: ItemId | null }>` (type alias `UndoHistory`) as the single source of truth for undo/redo. The field is named `undoHistory` (not `history`) to avoid lexical collision with the `window.history` DOM API. `historyIndex: number` SHALL reference positions in this array. The pre-hardening parallel arrays `workoutHistory` and `selectionHistory` SHALL NOT exist. `pushHistorySnapshot(entry: HistoryEntry)` SHALL push a single tuple atomically. The length invariant between workout and selection pieces SHALL be structurally enforced — no runtime assertion or CI grep is required.

#### Scenario: History push is atomic

- **WHEN** any mutation pushes to `undoHistory`
- **THEN** exactly one `HistoryEntry` SHALL be appended in a single operation
- **AND** it SHALL be impossible for workout and selection state to drift in length

#### Scenario: Undo restores workout at index and selection from subsequent snapshot

- **WHEN** `undo` decrements `historyIndex` to `i`
- **THEN** the restored workout SHALL be `undoHistory[i].workout`
- **AND** the selection available for focus-target fallback SHALL be `undoHistory[i + 1].selection` (the selection captured at the time the undone mutation ran, which was pushed alongside the mutation's post-state snapshot at index `i + 1`)

#### Scenario: Clear workout resets the single history array

- **WHEN** `clearWorkout` is called
- **THEN** `undoHistory` SHALL be reset to an empty array
- **AND** `historyIndex` SHALL be reset to its initial value

#### Scenario: Multi-selection snapshot uses primary id only

- **WHEN** a mutation pushes a snapshot while `selectedStepIds` contains multiple ids
- **THEN** the pushed `HistoryEntry.selection` SHALL be `selectedStepId` (the primary single-selection id), not the full `selectedStepIds` array

### Requirement: Telemetry events emitted at observed short-circuits

Every short-circuit and fallback path in `useFocusAfterAction` SHALL emit a corresponding `FocusTelemetryEvent` via the injected `FocusTelemetry` function. The events and their payloads SHALL match the contract defined in the `spa-editor-focus-telemetry` capability.

> **Event-to-requirement map:** the telemetry capability defines five event types. Their emission points are spread across requirements in this focus-management capability:
>
> | Event                        | Emission requirement in focus-management                                                                                                                                                                               |
> | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
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

### Requirement: Durable accessibility-technology evidence

The repository SHALL contain a directory `packages/workout-spa-editor/docs/accessibility-evidence/YYYY-MM-DD-focus-management/` with VoiceOver (macOS) and NVDA (Windows + Firefox latest) transcripts of the core mutation → focus sequences, plus Accessibility Inspector screenshots. A short runbook `README.md` in the directory SHALL describe how to regenerate the evidence. Changes to focus behavior in subsequent releases SHALL refresh the directory (tracked via CODEOWNERS or reviewer checklist).

#### Scenario: Evidence directory exists on main

- **WHEN** this hardening change is merged
- **THEN** `packages/workout-spa-editor/docs/accessibility-evidence/<date>-focus-management/voiceover-macos.md`, `nvda-windows.md`, `screenshots/`, and `README.md` SHALL all exist on the default branch

#### Scenario: Evidence runbook is reproducible

- **WHEN** a contributor follows the runbook's regeneration steps
- **THEN** they SHALL produce transcripts of comparable format, containing the same mutation sequences and announcement annotations

### Requirement: Focus intent applied to the DOM via a shared hook

The workout editor SHALL provide a `useFocusAfterAction` hook that, on every non-null transition of `pendingFocusTarget`, moves DOM focus to the corresponding element and clears the pending target. The hook SHALL use `useLayoutEffect` (not `useEffect`). The hook SHALL subscribe to Zustand via a narrow selector `(s) => s.pendingFocusTarget` so unrelated store changes do not re-run the effect. A `FocusRegistryContext` SHALL expose the following contract backed by a `useRef<Map<ItemId, HTMLElement>>`:

- `registerItem(id: ItemId, element: HTMLElement): void` — idempotent; re-registering the same id with a new element overwrites.
- `unregisterItem(id: ItemId, element: HTMLElement): void` — SHALL compare the provided `element` against the stored element by reference identity and SHALL NOT delete the entry if they differ. This preserves the second mount's registration during a Strict Mode mount/unmount/remount sequence.
- `resolveItem(id: ItemId): HTMLElement | null`

Components rendering steps or blocks SHALL register on mount and unregister on unmount. The context value SHALL be memoized to avoid consumer re-render churn.

#### Scenario: Focus moves to the targeted item after mutation commits

- **WHEN** `pendingFocusTarget` transitions to `{ kind: 'item', id: X }` and the item with id `X` is registered in the focus registry
- **THEN** after the next React commit (via `useLayoutEffect`), `document.activeElement` SHALL be the registered DOM node whose id equals `X`

#### Scenario: Focus moves to the empty-state button when list is empty

- **WHEN** `pendingFocusTarget` transitions to `{ kind: 'empty-state' }`
- **THEN** after the next React commit, `document.activeElement` SHALL be the main-list empty-state "Add step" button

#### Scenario: Pending target is cleared after applying

- **WHEN** the hook successfully moves focus in response to a pending target
- **THEN** `pendingFocusTarget` SHALL be `null` on subsequent reads

#### Scenario: Pending target is cleared even when focus call throws

- **GIVEN** `pendingFocusTarget` is non-null and the resolved element's `focus()` or `scrollIntoView()` throws (e.g., element detached, disabled, or option form unsupported)
- **WHEN** the hook's layout effect runs
- **THEN** `pendingFocusTarget` SHALL be cleared to `null` in a `finally` block
- **AND** the `prevTarget` ref SHALL be updated to the attempted target so the effect does not retry on the next render
- **AND** no retry-storm SHALL occur across subsequent renders

#### Scenario: MutationObserver absence degrades gracefully

- **GIVEN** `MutationObserver` is not defined in the execution environment (e.g., a legacy test stub)
- **WHEN** the focus hook initializes the overlay guard
- **THEN** the overlay guard SHALL assume zero open overlays and emit a one-time development warning
- **AND** focus management SHALL continue to function for the non-overlay code paths

#### Scenario: crypto.randomUUID fallback over non-secure contexts

- **GIVEN** `crypto.randomUUID` is undefined (non-secure context such as plain HTTP) but `crypto.getRandomValues` is available
- **WHEN** `defaultIdProvider` is invoked
- **THEN** it SHALL produce a valid v4 UUID string composed from `crypto.getRandomValues` bytes
- **AND** it SHALL NEVER fall through to `Math.random` as an entropy source

#### Scenario: Same pending target is not re-applied on unrelated renders

- **WHEN** the component re-renders for a reason unrelated to `pendingFocusTarget` and the current target value equals the previously applied target
- **THEN** the hook SHALL NOT call `focus()` again on the registered element

#### Scenario: Unresolved target falls back to the editor's labelled heading

- **WHEN** `pendingFocusTarget` is `{ kind: 'item', id: X }` but no DOM element is registered under id `X` at the time the layout effect runs
- **THEN** the hook SHALL move focus in order of preference to: (a) the main-list empty-state button if present, (b) the first item currently registered in the main list, (c) the editor's labelled heading element (`<h2 tabIndex={-1}>`)
- **AND** `pendingFocusTarget` SHALL be cleared
- **AND** a development-only `console.warn` SHALL be emitted
- **AND** focus SHALL NEVER be moved to a bare `role="list"` container

#### Scenario: Empty-state target falls through when the empty-state button is not yet mounted

- **GIVEN** `pendingFocusTarget` is `{ kind: 'empty-state' }` but no empty-state button is registered at the time the layout effect runs (e.g., gated behind Suspense or deferred render)
- **WHEN** the fallback chain executes
- **THEN** focus SHALL fall through to the first item registered in the main list if any, otherwise to the editor's labelled `<h2 tabIndex={-1}>` heading
- **AND** the editor's main layout SHALL render the empty-state button synchronously with the list becoming empty so that this fallback path is exercised only in recovery scenarios, not in normal flow

#### Scenario: Focus is not stolen from an active form field

- **WHEN** `pendingFocusTarget` is non-null and `document.activeElement` is an `<input>`, `<textarea>`, `<select>`, or `[contenteditable="true"]` element inside the editor
- **THEN** the hook SHALL NOT call `focus()` on the registered element
- **AND** `pendingFocusTarget` SHALL be cleared without changing `document.activeElement`

#### Scenario: Focus move is deferred while a dialog or context menu is open

- **WHEN** `pendingFocusTarget` becomes non-null while a `[role="dialog"][data-state="open"]` or `[role="menu"][data-state="open"]` element is present inside the editor
- **THEN** the hook SHALL defer applying the target until all such overlays close

#### Scenario: Focus applies on overlay close detected via MutationObserver

- **GIVEN** a `MutationObserver` watches the editor root element (NOT `document.body`) for `data-state` attribute changes on descendant elements, with a callback that filters to `target.matches('[role="dialog"],[role="menu"]')` and a `data-radix-*` attribute, combined with Radix `onOpenChange` where available
- **WHEN** the observer reports that the last open overlay has transitioned to `data-state="closed"`
- **THEN** within the next animation frame the hook SHALL re-read `pendingFocusTarget` and apply the most recent target value if non-null (which may differ from the value set before the overlay opened if an intervening mutation overwrote it)

#### Scenario: Foreign overlays outside the editor do not disable focus management

- **GIVEN** a script or extension injects a `<div role="dialog" data-state="open">` somewhere in the DOM OUTSIDE the editor's root subtree
- **WHEN** a mutation sets `pendingFocusTarget`
- **THEN** the overlay guard SHALL NOT be triggered by the foreign element
- **AND** the focus target SHALL be applied normally

#### Scenario: Focused item is scrolled into view without double-scroll

- **WHEN** the focus target DOM node is not fully visible in the scroll container
- **THEN** the hook SHALL call `element.focus({ preventScroll: true })` followed by `element.scrollIntoView({ block: 'nearest', behavior: <instant if prefers-reduced-motion: reduce, else auto> })`
- **AND** the browser's default focus-scroll SHALL NOT execute a competing scroll action
- **AND** when the target is already fully visible, `scrollIntoView({ block: 'nearest' })` is a natural no-op per the CSSOM specification — the hook SHALL NOT compute visibility ahead of time to conditionally skip the call

#### Scenario: Scroll respects prefers-reduced-motion

- **WHEN** `window.matchMedia('(prefers-reduced-motion: reduce)').matches` is true at the time the hook applies focus
- **THEN** `scrollIntoView` SHALL be called with `behavior: 'instant'`

#### Scenario: Toast announcement is queued before focus moves

- **GIVEN** a mutation fires a `role="status"` toast (e.g., "Step deleted") in the same commit that sets `pendingFocusTarget`
- **WHEN** the focus hook applies the target
- **THEN** the polite live-region update SHALL be flushed to the assistive-technology speech pipeline in the same event-loop turn as (or earlier than) the focus change
- **AND** unit tests MAY assert this ordering with fake timers; the specific scheduling mechanism is an implementation detail documented in the design

#### Scenario: Tab key moves to next focusable element outside the list after programmatic focus

- **GIVEN** a step card with `tabIndex={-1}` has received programmatic focus after a mutation
- **WHEN** the user presses `Tab`
- **THEN** focus SHALL move to the next focusable element outside the step list (toolbar button, heading, or page-level focusable)
- **AND** pressing `Shift+Tab` SHALL move focus to the previous focusable element before the step list

#### Scenario: Programmatic focus produces a visible focus indicator

- **WHEN** focus moves programmatically to a step card, block card, empty-state button, or the fallback editor `<h2 tabIndex={-1}>` heading
- **THEN** the element SHALL render a focus indicator matching WCAG 2.4.11 (Focus Not Obscured) and 2.4.13 (Focus Appearance) in Chrome, Firefox, and Safari
- **AND** component styles SHALL apply the focus indicator via both `:focus` and `:focus-visible` selectors so Safari's heuristic does not suppress the ring on programmatic focus
- **AND** any CSS transition on the focus indicator SHALL honour `@media (prefers-reduced-motion: reduce)` by disabling the transition (handled at the component CSS layer; no JS involvement)

#### Scenario: Strict Mode double-mount preserves registered element

- **WHEN** a component registers an element, unmounts, and remounts with the same id (as in React Strict Mode)
- **THEN** after the remount the focus registry SHALL resolve the id to the remount's element
- **AND** the first mount's cleanup SHALL NOT delete the remount's element from the registry

#### Scenario: Context value identity stability

- **WHEN** the `FocusRegistryContext.Provider` re-renders without changing the registry
- **THEN** the context `value` reference SHALL be identical to the previous render's `value`
- **AND** no consumer SHALL re-render due solely to the provider re-rendering

#### Scenario: No render loop when a second action re-sets the target

- **WHEN** the hook clears `pendingFocusTarget` in the same commit that another action sets it to a new value
- **THEN** the hook SHALL apply the new value on the next commit
- **AND** no infinite render loop SHALL occur

### Requirement: Focus behavior is input-method agnostic

The `pendingFocusTarget` system SHALL produce identical focus outcomes regardless of whether the triggering mutation originated from a keyboard shortcut, a context menu action, a toolbar button, or a drag-and-drop operation.

#### Scenario: Keyboard delete and context menu delete produce identical focus target

- **GIVEN** a workout with three steps and the middle step selected
- **WHEN** the middle step is deleted via the Delete key
- **THEN** `document.activeElement` after the delete SHALL be the step card originally at position three (now at position two)
- **AND** given the same initial workout, deleting the middle step via the context menu "Delete" action SHALL produce the same `document.activeElement`

#### Scenario: Toolbar paste and Cmd+V produce identical focus target

- **GIVEN** a workout with two steps, step content in the clipboard store, and the first step selected
- **WHEN** the user pastes via Cmd+V
- **THEN** `document.activeElement` SHALL be the newly pasted step card
- **AND** given the same initial state, pasting via the toolbar paste button SHALL produce the same `document.activeElement`

#### Scenario: Drag-and-drop reorder moves focus to the dropped item

- **WHEN** a step is dragged and dropped to a new position
- **THEN** `document.activeElement` after the drop commits SHALL be the step card at its new position

### Requirement: Focus target and undo history reset across Dexie reloads

`pendingFocusTarget` and `undoHistory` SHALL NOT span a Dexie reload. Upon reloading a workout from Dexie, the workout store SHALL initialize `pendingFocusTarget` to `null`, `undoHistory` to an empty array, `historyIndex` to its initial value, and regenerate all `ItemId` values via the configured `IdProvider`. Every Dexie write SHALL strip `id` fields via a single `stripIds` helper so that no `ItemId` values are persisted.

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
