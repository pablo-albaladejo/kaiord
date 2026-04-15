## Why

The workout editor's keyboard shortcut handlers unconditionally call `preventDefault()` on every Cmd/Ctrl modifier combination they recognize, regardless of whether the app action is meaningful in the current context. This breaks native browser behavior: users cannot copy text from the page, paste via right-click, use browser shortcuts like Cmd+Shift+C (DevTools), or interact normally when no workout steps are selected. The golden rule — **never `preventDefault()` unless the app actually handles the event** — is violated throughout.

## What Changes

- **Context-aware `preventDefault`**: Each modifier and alt shortcut checks app state (selected steps, clipboard content, undo/redo availability) before intercepting. If the action would be a no-op, the event passes through to the browser.
- **Exact modifier matching**: Only intercept the exact key combo owned (e.g., `Cmd+C` but not `Cmd+Shift+C`). Extra modifiers → pass through.
- **Cut support**: Add `Cmd+X` as Copy + Delete, both as keyboard shortcut and context menu item.
- **Custom context menu**: Right-click on the editor area shows a context menu with relevant actions (Cut, Copy, Paste, Delete, Group). Falls back to native context menu when no app actions apply.
- **Extended form element detection**: Add `[contenteditable]` elements to the passthrough check so keyboard shortcuts don't fire when editing rich text.

## Capabilities

### New Capabilities

- `spa-editor-context-menu`: Custom right-click context menu for the workout editor area with context-aware actions and native fallback.

### Modified Capabilities

_None. This change fixes implementation behavior (how shortcuts are handled) without changing spec-level requirements. The workout state machine, persistence, and bridge specs are unaffected._

## Impact

- **Package**: `@kaiord/workout-spa-editor` only
- **Layer**: Infrastructure (UI event handlers, React components)
- **Files**:
  - `hooks/modifier-shortcut-handlers.ts` — conditional `preventDefault`, exact modifier matching
  - `hooks/keyboard-shortcut-handlers.ts` — extended `isFormElement`, context parameter
  - `hooks/use-app-keyboard-handlers.ts` — pass app state context to handlers
  - New context menu component (organisms or molecules)
- **No breaking changes** to public API or domain logic
- **New dependency**: `@radix-ui/react-context-menu` (Radix primitive, consistent with existing `@radix-ui/react-dialog`, `react-dropdown-menu`, `react-toast`, `react-tooltip` in the project)
