## 1. Handler Return Type Refactor

- [x] 1.1 Change `KeyboardShortcutHandlers` type: all handler functions return `boolean` instead of `void`
- [x] 1.2 Update `build-keyboard-handlers.ts`: add explicit `KeyboardShortcutHandlers` return type annotation to `buildKeyboardHandlers`. Each handler returns `true` when action performed, `false` when guard prevents it. Key guards: `onPaste` returns `true` only if `hasClipboardContent()` AND (`stepIndex !== null` OR workout exists); `onSelectAll` returns `false` when workout has no steps (empty array after filtering); undo/redo/save always return `true`
- [x] 1.3 Update `modifier-shortcut-handlers.ts`: change `handleModifierShortcuts` return type from `void` to `boolean`. Remove `event.preventDefault()` from before handler calls; call handler first using `?? false` fallback (e.g., `const handled = handlers.onCopy?.() ?? false`), then `preventDefault()` only if `handled` is `true`. Also update the caller in `createKeyDownHandler` (`keyboard-shortcut-handlers.ts`) to capture the return value for consistency with `handleAltShortcuts`
- [x] 1.4 Update `handleAltShortcuts` in `modifier-shortcut-handlers.ts`: remove `event.preventDefault()` calls that precede `handlers.onMoveStepUp?.()` and `handlers.onMoveStepDown?.()`. Call handler first with `?? false` fallback, then `preventDefault()` only if handler returns `true`. Return `false` when handler is a no-op
- [x] 1.5 Update `keyboard-shortcut-handlers.ts` escape handler: only `preventDefault()` if `onClearSelection?.() ?? false` returns `true`
- [x] 1.6 Add `onCut` and `onDelete` to `KeyboardShortcutHandlers` type. Add `deleteStep` to `KeyboardHandlerDeps`, sourced from the workout store's step removal action. Implement `onCut` in `build-keyboard-handlers.ts` as copy + delete (returns `true` when single step selected, `false` for multi-selection or no selection). Implement `onDelete` for context menu parity. Add `handlers.onCut` to the `useEffect` dependency array in `useKeyboardShortcuts.ts`
- [x] 1.7 Wire `Cmd+X` in `handleModifierShortcuts` to `onCut`, with `!shift` guard
- [x] 1.8 Write tests for `build-keyboard-handlers.ts` verifying return values for each guard condition (including onPaste with empty clipboard, onSelectAll with empty steps). Also test `createEscapeHandler` in `keyboard-shortcut-handlers.ts` for boolean return (true with selection, false without)

## 2. Exact Modifier Matching

- [x] 2.1 Add `event.shiftKey` guard to non-shift shortcuts in `modifier-shortcut-handlers.ts` (Cmd+S, Cmd+Z, Cmd+C, Cmd+V, Cmd+X, Cmd+A, Cmd+G)
- [x] 2.2 Verify Cmd+Shift+G (ungroup) and Cmd+Shift+Z (redo) remain intercepted
- [x] 2.3 Write tests for modifier matching: Cmd+Shift+C passes through, Cmd+Shift+S passes through, Cmd+Shift+G intercepted

## 3. Form Element Passthrough Extension

- [x] 3.1 Extend `isFormElement()` in `keyboard-shortcut-handlers.ts` to include `contentEditable` elements
- [x] 3.2 Write test for contentEditable passthrough

## 4. Clipboard Store Enhancement

- [x] 4.1 Export `hasClipboardContent()` function from `clipboard-store.ts` that synchronously returns whether in-memory store has content. Consuming files import from `../store/clipboard-store`
- [x] 4.2 Write test for `hasClipboardContent()`

## 5. Custom Context Menu

- [x] 5.1 Add `@radix-ui/react-context-menu` dependency to `packages/workout-spa-editor/package.json`
- [x] 5.2 Create `EditorContextMenu` component using `@radix-ui/react-context-menu` with `aria-label="Workout editor actions"` on the trigger
- [x] 5.3 Implement context-aware menu items with visible shortcut hints (platform-native symbols like `⌘C`) and `aria-keyshortcuts` attributes (ARIA modifier key names like `Meta+C` on macOS, `Control+C` on Windows/Linux — these are independent): Cut ⌘X (when single step selected), Copy ⌘C (when single step selected), Paste ⌘V (when clipboard has content), Delete ⌫ (when step(s) selected, using `onDelete` from shared handler type), separator, Select All ⌘A (when steps exist), Group ⌘G (when 2+ steps selected), Ungroup ⇧⌘G (when block selected). Items are hidden (not disabled) when condition is not met
- [x] 5.4 Implement native fallback: compute `hasAnyAction` on every render (no `useMemo` — `hasClipboardContent()` is not reactive), conditionally render `ContextMenu.Root` only when `hasAnyAction` is true, otherwise render plain wrapper (no ARIA attributes) so native context menu appears
- [x] 5.5 Implement right-click selection behavior: step in multi-selection → keep selection; step not in selection → replace; empty area → clear selection. Blocks are treated as selectable items for right-click purposes, same as steps
- [x] 5.6 Implement focus management: focus returns to step list container after action/dismiss; after Delete, focus moves to next step (or previous if last was deleted); after Paste, focus moves to the newly pasted step
- [x] 5.7 Wrap editor step list area with context menu trigger using `asChild` to avoid extra DOM nodes
- [x] 5.8 Write tests for context menu visibility logic (which items shown per state), selection behavior, and focus management

## 6. Integration & Quality

- [x] 6.1 Verify all existing keyboard shortcut tests still pass
- [x] 6.2 Run `pnpm lint:fix` and fix any warnings/errors
- [x] 6.3 Verify coverage thresholds are met (70% for frontend)
- [ ] 6.4 Manual browser test (requires human testing): Cmd+C without selection copies text, Cmd+V without clipboard pastes text, Cmd+X cuts step, right-click shows context menu with shortcut hints, Cmd+Shift+C opens DevTools
- [x] 6.5 Create changeset
