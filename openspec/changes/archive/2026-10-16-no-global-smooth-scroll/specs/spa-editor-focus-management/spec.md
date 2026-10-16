## MODIFIED Requirements

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
- **THEN** the hook SHALL call `element.focus({ preventScroll: true })` followed by `element.scrollIntoView({ block: 'nearest', behavior: 'instant' })`
- **AND** the browser's default focus-scroll SHALL NOT execute a competing scroll action
- **AND** when the target is already fully visible, `scrollIntoView({ block: 'nearest' })` is a natural no-op per the CSSOM specification — the hook SHALL NOT compute visibility ahead of time to conditionally skip the call

#### Scenario: The focus scroll jumps whatever the motion preference

- **WHEN** the hook applies focus, with or without `prefers-reduced-motion: reduce`
- **THEN** `scrollIntoView` SHALL be called with `behavior: 'instant'`
- **AND** the scroll SHALL NOT glide: focus follows an action the user just took, and a page still moving under their next press releases it on another element

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
