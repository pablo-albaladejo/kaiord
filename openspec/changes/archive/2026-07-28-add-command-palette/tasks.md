## 1. One enumerable command source

- [x] 1.1 Create `hooks/editor-command.types.ts`: `EditorCommandGroup`, `EditorCommand` (`id`, `group`, `titleKey`, `titleParams?`, `subtitleKey?`, `shortcutId?`, `enabled`, `run`), `EditorCommandGuards` and `EditorCommandInput`.
- [x] 1.2 Create `hooks/build-do-commands.ts`: a `doCommand` factory that derives `titleKey`/`subtitleKey`/`shortcutId` from the id, plus the ten `do` commands wired to the `buildKeyboardHandlers` thunks. `create-block` overrides its title key so a closed guard renders the count-free variant.
- [x] 1.3 Create `hooks/build-learn-commands.ts`: `DOCS_URL`, `openDocs(path)` and three data-driven `learn` rows pointing at pages that exist on the docs site.
- [x] 1.4 Create `hooks/use-editor-commands.ts`: compose `useContextMenuStore` → `buildEditorCommandGuards` → `buildDoCommands` + `buildLearnCommands`, and keep returning the selection helpers the context menu needs.
- [x] 1.5 Write `hooks/build-do-commands.test.ts`: every guard opens exactly its own command, every `run` reaches its thunk, absent thunks do not throw, `shortcutId === id`, and the `create-block` title/subtitle switch.
- [x] 1.6 Write `hooks/use-editor-commands.test.ts`: selection-aware guards and count, clipboard-driven paste, `run` delegation to the store, a closed guard performing no store action, learn rows opening the docs, every `shortcutId` resolving in `SHORTCUT_CATALOG`, every title/subtitle key resolving in `palette.json`, ids unique.

## 2. The context menu as a projection

- [x] 2.1 Create `components/organisms/EditorContextMenu/context-menu-props-from-commands.ts`: `contextMenuPropsFrom(commands)` mapping command ids onto the existing `show*`/`on*` props, and `hasAnyContextMenuAction(props)`.
- [x] 2.2 Rewrite `hooks/use-editor-context-menu.ts` as a projection over `useEditorCommands` — no second guard set, no `handlers` escape hatch.
- [x] 2.3 Collapse `EditorContextMenu.tsx` to `<EditorContextMenuContent {...ctx.menu} />`; `EditorContextMenuContent` and its existing test are untouched.
- [x] 2.4 Write `context-menu-props-from-commands.test.ts`: each command id maps to its `show*` and `on*` pair, a missing command hides its item, and `hasAnyContextMenuAction` is false only when every menu command is disabled.

## 3. The palette

- [x] 3.1 Create `components/organisms/CommandPalette/command-palette-filter.ts`: `PALETTE_GROUPS`, `filterCommands` (accent/case-insensitive substring over the translated title, empty sections dropped) and `flattenSections`.
- [x] 3.2 Create `use-command-palette-nav.ts`: active-index state reset on re-filter, ArrowUp/ArrowDown, Enter-runs-if-enabled, `runAt`. Focus is not moved; `Escape` is left to Radix.
- [x] 3.3 Create `CommandPaletteRow.tsx` (title, subtitle, `KeyChips` from the catalog row, `role="option"` with `aria-selected`/`aria-disabled`), `CommandPaletteList.tsx` (grouped `role="listbox"` with `role="group"` headings) and `CommandPaletteFooter.tsx` (`↵ run`, `? all shortcuts`, docs link).
- [x] 3.4 Create `CommandPalette.tsx`: Radix `Dialog` portal/overlay/content, autofocused search input wired as a combobox with `aria-activedescendant`, the list or the empty state, and the footer. Styles extracted to `palette-styles.ts` for the 80-line cap.
- [x] 3.5 Write `command-palette-filter.test.ts`: group order, empty groups dropped, blank query keeps everything, substring/case/accent matching, no-match returns nothing.
- [x] 3.6 Write `CommandPalette.test.tsx`: both group headings, closed renders nothing, input autofocus, key chips, docs link, filter-on-typing, empty state, Enter runs the first row and closes, ArrowDown/ArrowUp move the active row, `aria-activedescendant` follows it, Escape closes, disabled rows are not runnable by click or Enter and explain their guard, click runs an enabled row, and the footer hands over to the shortcut sheet.

## 4. The `Ctrl+K` binding

- [x] 4.1 Add `onShowCommandPalette` to `KeyboardShortcutHandlers` and to `HANDLER_KEY_MAP`, so K1's parity test demands a catalog row.
- [x] 4.2 Add `handleCommandPaletteKey` to `modifier-shortcut-handlers.ts` and dispatch it at the top of `createKeyDownHandler`, ahead of the `isFormElement` guard; `Shift`/`Alt` variants fall through, `preventDefault` only on a handled event.
- [x] 4.3 Add the `show-command-palette` row to `constants/shortcut-rows-global.ts` in the `help` group (`Ctrl K` / `⌘ K`).
- [x] 4.4 Extend `hooks/use-keyboard-shortcuts.test.ts` with a `command palette shortcut` block: fires on Ctrl/Cmd/uppercase K, fires inside input, textarea and contenteditable, ignores unmodified `k`, ignores `Ctrl+Shift+K` and `Ctrl+Alt+K`, no `preventDefault` when unhandled, `Ctrl+S`/`Ctrl+C`/`Ctrl+G` unaffected, and `?` keeps its form-field suppression.

## 5. Mounting and i18n

- [x] 5.1 Extract `components/templates/MainLayout/use-header-overlays.ts`: the help/shortcuts/palette lazy dialogs, the `onShowShortcuts` and `onShowCommandPalette` handlers, the palette→sheet handover, and the single `useKeyboardShortcuts` subscription.
- [x] 5.2 Lazy-mount `CommandPalette` from `LayoutHeader` with `React.lazy` inside the existing `<Suspense fallback={null}>`, exactly like `ShortcutSheet`.
- [x] 5.3 Add `i18n/locales/{en,es}/palette.json`: title, search labels, empty state, group headings, footer, `commands.<id>.{title,subtitle,requires}` for all ten commands (plus `create-block.titleCount`) and `learn.<id>.{title,subtitle}`.
- [x] 5.4 Add `shortcuts.help.showCommandPalette` to `i18n/locales/{en,es}/help.json`; `resource-parity.test.ts` and `shortcut-catalog.test.ts` stay green.

## 6. Review round: exact guards and reopen state

- [x] 6.1 Create `hooks/editor-command-guards.ts`: derive availability with `findById` instead of prefix-matching the legacy `block-*` id format, one field per command. Fixes the shipped right-click-menu bug where an in-app block (a `defaultIdProvider()` UUID) offered Cut/Copy/Delete — all no-ops — and withheld Ungroup.
- [x] 6.2 Fold in the same defect class: `canCut` also requires a single selected id, `canDelete` equals `canCopy` (not "anything selected"), `canPaste` also requires a workout, `canSelectAll` requires a step carrying `stepIndex` so a blocks-only workout is disabled.
- [x] 6.3 Replace `EditorCommandGuards`' shared coarse flags (`hasSingleStep`, `hasSelection`, `hasSteps`, `hasWorkout`) with one field per command, so no two commands can share a guard again.
- [x] 6.4 Write `hooks/editor-command-guards.test.ts` (16 cases): block / step / step-inside-block / blocks-only / empty selection / multi-selection, plus each paste and select-all branch.
- [x] 6.5 Write `hooks/use-editor-context-menu.test.ts`: the composite store → guards → `show*`/`on*` chain that `EditorContextMenuContent.test.tsx` (presentational) cannot cover.
- [x] 6.6 Extract `CommandPaletteBody.tsx` so the query and active row live inside `Dialog.Content`, which Radix unmounts on close — `useLazyDialog` latches `mounted`, so state held in `CommandPalette` leaked across openings. Regression test reopens the palette and asserts Enter runs the first row again.
- [x] 6.7 a11y: thread `hasResults` into `CommandPaletteInput` so `aria-controls`/`aria-expanded` do not dangle in the empty state, add `aria-autocomplete="list"`, and give the empty-state paragraph `role="status"` so it is announced.
- [x] 6.8 Drop the `useMemo` around `filterCommands` — `t` was a fresh closure and `commands` a fresh array every render, so it never memoized and only implied a guarantee it did not provide.
- [x] 6.9 Correct `design.md`: portalled Radix dialogs are invisible to `useOverlayFocusStash` (it queries within `editor-root`); focus restore comes from Radix's own `FocusScope`. Rewrite D1/D3 to record that the guards were fixed, not inherited.
- [x] 6.10 Make `commands.delete` singular in `en`/`es` — `onDelete` removes the one `selectedStepId`, not the whole multi-selection.

## 7. Review nits

- [x] 7.1 Cover the one visible menu change in `use-editor-context-menu.test.ts`: a multi-selection with no focused step offers group but not delete, and the menu still opens. `toggleStepSelection` and `selectAllSteps` both leave `selectedStepId` null, so `onDelete` never had a step to act on — the item was always a no-op.
- [x] 7.2 Drop the dead `animate-in`/`animate-out`/`fade-in-0`/`fade-out-0` classes from `palette-styles.ts` (they emit no CSS in this tree) and record why the palette must stay un-animated: `CommandPaletteBody` resets its state by unmounting, and an exit animation would hold it mounted through `Presence`, reopening the stale-query window. Cross-referenced from the `CommandPaletteBody` comment.
- [x] 7.3 Make the cut/copy/delete `requires` copy exact for a step inside a block — "Select a step in the main list" rather than "Select a single step first", which was false for a nested selection. Cut keeps "a single step" because its guard also refuses a multi-selection.
- [x] 7.4 Clarify in `spec.md` that commands must not share a guard _field_, even where two evaluate the same condition.

## 8. Verification

- [x] 8.1 `pnpm --filter @kaiord/workout-spa-editor test` — full suite passing.
- [x] 8.2 `tsc -p tsconfig.app.json --noEmit` clean.
- [x] 8.3 `pnpm --filter @kaiord/workout-spa-editor lint` clean, including the 80-line file and 60-line component caps.
- [x] 8.4 `pnpm test:scripts` unchanged-green; Prettier clean on every touched file.
- [x] 8.5 `npx openspec validate add-command-palette` passes.
- [x] 8.6 Production build emits the palette as its own lazy chunk.
