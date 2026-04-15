## Context

The workout editor registers global `keydown` listeners on `window` via `useKeyboardShortcuts`. Modifier shortcuts (Cmd+C, Cmd+V, etc.) are handled in `modifier-shortcut-handlers.ts`, which unconditionally calls `event.preventDefault()` before delegating to the handler callback. Alt shortcuts (Alt+ArrowUp/Down) in `handleAltShortcuts` have the same issue.

The handler callbacks in `build-keyboard-handlers.ts` already contain guard logic (e.g., `onCopy` checks `stepIndex() !== null`), but `preventDefault()` fires before the guard — so even when the handler is a no-op, the native browser action is killed.

**Layer affected**: Infrastructure (UI event handlers, React components). No domain or application changes.

## Goals / Non-Goals

**Goals:**

- `preventDefault()` is only called when the app handler actually performs an action
- Unowned modifier combos (e.g., Cmd+Shift+C, Cmd+Shift+S) pass through to the browser
- Right-click on editor area provides Cut/Copy/Paste/Delete/Group actions via a custom context menu
- Custom context menu falls back to native context menu when no app actions are applicable
- `contentEditable` elements are treated as form elements (shortcuts pass through)
- Context menu items display keyboard shortcut hints (e.g., "Copy  ⌘C")

**Non-Goals:**

- Modifying the workout store or state machine
- Keyboard-triggered context menu (Shift+F10) — deferred to a future iteration. Radix ContextMenu does not support this natively; it would require a custom `onKeyDown` handler on the trigger element. Keyboard-only users can still invoke all context menu actions via existing keyboard shortcuts (Cmd+C, Cmd+X, Cmd+V, Delete, Cmd+G, etc.), so no functionality is lost. However, keyboard-only users lose discovery of available actions and their shortcuts — only the direct invocation remains. Mitigation: the existing keyboard shortcuts help panel (accessible via `?` key) already documents all shortcuts. A future iteration will add Shift+F10 support via a custom `onKeyDown` handler on the trigger element
- Mobile touch/long-press — Radix ContextMenu may trigger on long-press on touch devices; behavior is untested but acceptable as-is since the menu is context-aware

## Decisions

### D1: Handlers return boolean to gate `preventDefault()`

**Decision**: Change handler callback type from `() => void` to `() => boolean`. Return `true` when the action was performed, `false` when it was a no-op.

**Optional chaining**: The current code uses optional chaining (`handlers.onCopy?.()`). Since optional chaining on `undefined` returns `undefined` (not `false`), all call sites MUST use the `?? false` fallback: `const handled = handlers.onCopy?.() ?? false`. This ensures `undefined` is treated as "not handled."

**Where `preventDefault` is called**: Inside the routing functions (`handleModifierShortcuts`, `handleAltShortcuts`), not in the caller. The pattern is: call the handler callback first, check its return value, then call `event.preventDefault()` only if it returned `true`. This means `preventDefault` is removed from before the handler call and moved to after it.

Both routing functions return `boolean` to indicate whether the event was handled: `handleAltShortcuts` already returns `boolean`; `handleModifierShortcuts` changes from `void` to `boolean`. The caller (`createKeyDownHandler`) uses this to know whether to stop processing, but does NOT call `preventDefault` itself — that responsibility is fully inside the routing functions.

**Rationale**: This keeps the context-awareness in `build-keyboard-handlers.ts` where it already exists (the guards are already there), and avoids duplicating app state queries in `modifier-shortcut-handlers.ts`. The modifier handler stays a pure event router with no knowledge of app state.

**New handlers**: `onCut` composes `onCopy` + `deleteStep`; `onDelete` delegates to the workout store's `removeStep` action. Both are added to `KeyboardShortcutHandlers` (callback type) and `KeyboardHandlerDeps` (dependency injection type). `onCut` returns `true` only when a single step is selected (matching `onCopy` constraints); `onDelete` returns `true` when one or more items are selected.

**Alternative considered**: Pass a context object (`{ hasSelection, hasClipboard }`) to `modifier-shortcut-handlers.ts`. Rejected because it duplicates the guards that already exist in the handler callbacks, and couples the event router to app state shape.

### D2: Exact modifier matching via early return

**Decision**: In `handleModifierShortcuts`, each shortcut clause checks its exact modifier requirements. Owned shift combos (`Cmd+Shift+G` for ungroup, `Cmd+Shift+Z` for redo) explicitly require `shift`. All other combos (`Cmd+S`, `Cmd+Z`, `Cmd+C`, `Cmd+V`, `Cmd+X`, `Cmd+A`, `Cmd+G`) explicitly require `!shift`. Any combo with extra modifiers (e.g., `Cmd+Shift+C`, `Cmd+Shift+S`, `Cmd+Shift+X`) passes through to the browser.

**Rationale**: Simple, explicit, no new abstractions. Each shortcut clause checks its exact modifier requirements.

### D3: Radix UI context menu for editor area

**Decision**: Add `@radix-ui/react-context-menu` as a new dependency. The project already uses four Radix primitives (`react-dialog`, `react-dropdown-menu`, `react-toast`, `react-tooltip`), so this is consistent.

**Native fallback mechanism**: Radix `ContextMenu.Root` intercepts the `contextmenu` event via `preventDefault()`. To achieve native fallback when no actions apply, **conditionally render the entire `ContextMenu.Root`**. When `hasAnyAction` is false, render a plain wrapper (`<div>`) instead of `ContextMenu.Root` + `ContextMenu.Trigger`, so the browser's native context menu fires normally. Compute `hasAnyAction` synchronously from store state before render.

```
hasAnyAction = hasSelectedStep || hasClipboardContent() || hasSteps
```

**Accessibility**: Context menu trigger MUST have `aria-label="Workout editor actions"`. Menu items MUST have descriptive labels. Toast notifications for copy/paste/cut MUST use `role="status"` (Radix Toast already provides this).

### D4: Context menu actions are context-aware

**Decision**: Each menu item is conditionally rendered based on current state:

| Menu item | Shortcut hint | Shown when |
|-----------|--------------|-----------|
| Cut | ⌘X | A single step is selected |
| Copy | ⌘C | A single step is selected |
| Paste | ⌘V | Clipboard store has content |
| Delete | ⌫ | One or more steps are selected |
| Separator | — | Between edit actions and structural actions |
| Select All | ⌘A | Workout has steps |
| Group | ⌘G | 2+ steps are selected |
| Ungroup | ⇧⌘G | Selected item is a block |

**Render strategy**: Items are hidden (not rendered) rather than shown as disabled. Rationale: the context menu is state-aware and only appears when at least one action applies. Showing grayed-out items adds visual noise without aiding discovery — the keyboard shortcut hints already inform users of available actions.

**Focus management**: After a context menu action completes or the menu is dismissed, focus SHALL return to the step list container. After a Delete action, focus SHALL move to the next step (or the previous one if the last step was deleted). Radix ContextMenu handles focus return on dismiss automatically; delete focus management is handled by the existing step list logic.

**Accessibility**: Two separate attributes per menu item:
- **`aria-keyshortcuts`** (machine-readable, ARIA format): uses ARIA modifier key names — `Control+C` on Windows/Linux, `Meta+C` on macOS. Set via platform detection (`navigator.userAgentData?.platform ?? navigator.platform`).
- **Visible shortcut hint** (human-readable, display text): uses platform-native symbols — `⌘C` on macOS, `Ctrl+C` on Windows/Linux. Rendered as right-aligned text in the menu item via Radix `ContextMenu.Shortcut`.

These are independent — `aria-keyshortcuts` follows W3C ARIA key name spec, the visible hint follows platform UI conventions.

**`hasAnyAction` computation**: Compute on every render (no `useMemo`) since `hasClipboardContent()` reads from a module-level variable that is not reactive — it cannot trigger re-renders when clipboard content changes. The computation is cheap (three boolean checks), so memoization is unnecessary. The value is kept fresh because the component re-renders on store state changes (selection, workout) which cover the common case. Clipboard changes from external sources (e.g., OS paste) are inherently eventual — acceptable staleness until the next render cycle.

### D5: Right-click selection behavior

**Decision**: Follow desktop editor conventions (VS Code, Finder):

- Right-click on a step that is part of the current selection → keep selection, show menu for all selected
- Right-click on a step NOT in the current selection → replace selection with that step, show menu
- Right-click on empty area → clear step selection, show menu (Paste/Select All only)

### D6: Extend `isFormElement` with contentEditable check

**Decision**: Add `(target instanceof HTMLElement && target.isContentEditable)` to the `isFormElement` guard in `keyboard-shortcut-handlers.ts`.

**Rationale**: Prevents keyboard shortcuts from firing when the user is editing rich text in a contentEditable element. Currently only checks for `input`, `textarea`, and `select`.

## Risks / Trade-offs

- **[Risk] Handlers that are async (copy/paste) can't synchronously return boolean** → Mitigation: `onCopy` and `onPaste` check the guard condition synchronously (is step selected? is there a workout?) and return the boolean before starting the async operation. The boolean reflects "will I attempt this action?", not "did it succeed?".

- **[Risk] Radix context menu may conflict with existing click/selection handlers on step cards** → Mitigation: Context menu trigger wraps the step list container, not individual cards. `onContextMenu` on step cards should propagate naturally. Test right-click selection behavior thoroughly.

- **[Risk] `memory` variable in clipboard-store is module-private** → Mitigation: Export a `hasClipboardContent(): boolean` function that checks `memory !== null` without exposing the variable.

- **[Risk] Conditional ContextMenu.Root rendering may cause layout shift** → Mitigation: Both the Radix wrapper and the plain `<div>` fallback use identical styling. Radix ContextMenu.Trigger renders as a `<span>` by default — use `asChild` to avoid extra DOM nodes.

- **[Risk] Context menu may be clipped by scroll containers** → Mitigation: Radix ContextMenu renders its content via a portal by default, which avoids `overflow: hidden` clipping from ancestor scroll containers. No additional configuration needed.
