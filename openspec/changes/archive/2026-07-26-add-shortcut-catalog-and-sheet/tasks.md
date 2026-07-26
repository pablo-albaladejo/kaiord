## 1. Platform detection and shared guards

- [x] 1.1 Rewrite `utils/platform.ts`: `isMacPlatform()` reads `navigator.userAgentData?.platform ?? navigator.userAgent` (never the deprecated `navigator.platform`); keep `isMac`/`modifierSymbol`/`shiftSymbol`/`deleteSymbol`/`ariaModifier` for `EditorContextMenu`; add `formatShortcutKeys(def, mac)`.
- [x] 1.2 Extract `utils/is-form-element.ts` from `keyboard-shortcut-handlers.ts` so every listener in the keydown chain shares one guard.
- [x] 1.3 Write `utils/platform.test.ts`: userAgentData wins over the UA string, UA fallback for both platforms, `navigator.platform` is never read (getter spy), and the three `formatShortcutKeys` branches.

## 2. Shortcut catalog

- [x] 2.1 Create `constants/shortcut-catalog.ts`: `ShortcutGroup`, `ShortcutDef` (`id`, `group`, `keys`, `macKeys?`, `aliasKeys?`, `aliasMacKeys?`, `labelKey`, `handlerKey`), `SHORTCUT_GROUPS`, `SHORTCUT_CATALOG`.
- [x] 2.2 Create the row modules `constants/shortcut-rows-global.ts` (save, select-all, clear-selection, show-shortcuts), `constants/shortcut-rows-edit.ts` (undo, redo + `Ctrl+Shift+Z` alias, copy, cut, paste, delete + `Backspace` alias) and `constants/shortcut-rows-steps.ts` (move-up, move-down, create-block, ungroup-block) — split to respect the 80-line file cap.
- [x] 2.3 Add `HANDLER_KEYS` to `hooks/keyboard-shortcut-handlers.ts`, derived from a `Record<keyof KeyboardShortcutHandlers, true>` so omissions and extras are both compile-time errors.
- [x] 2.4 Write `constants/shortcut-catalog.test.ts`: every `HANDLER_KEYS` entry maps to exactly one row, no row names an unknown handler, every `labelKey` and every `shortcuts.<group>.heading` resolves in `locales/en/help.json`, ids unique, groups known, keys non-empty.
- [x] 2.5 Add the missing i18n keys (`shortcuts.edit.cut`, `shortcuts.edit.delete`, `shortcuts.help.heading`, `shortcuts.help.showShortcuts`) and rename `shortcuts.step` → `shortcuts.steps` in both `en` and `es`; `resource-parity.test.ts` stays green.

## 3. Catalog-driven Help section

- [x] 3.1 Create `components/atoms/KeyChips/KeyChips.tsx` (+ `index.ts`): `<kbd>` chips for a `ShortcutDef` on the current platform, plus the alias run.
- [x] 3.2 Rewrite `HelpSection/components/ShortcutRow.tsx` to take a `ShortcutDef`, translate `def.labelKey` and delegate chips to `KeyChips` — the deprecated `navigator.platform` read is gone.
- [x] 3.3 Replace the four hardcoded `sections/shortcuts/*.tsx` with one `ShortcutGroupSection.tsx` that filters the catalog by group; `KeyboardShortcutsSection.tsx` maps `SHORTCUT_GROUPS`.
- [x] 3.4 Extend `HelpSection.test.tsx`: cut and delete rows assert, the `help` group renders, and every catalog row's English label is present.

## 4. `?` shortcut sheet

- [x] 4.1 Add `onShowShortcuts` to `KeyboardShortcutHandlers` and dispatch `event.key === "?"` from the non-modifier branch of `createKeyDownHandler` (extracted to `handlePlainKeys`), behind the existing `isFormElement` guard and the `preventDefault`-on-`true` contract.
- [x] 4.2 Create `components/organisms/ShortcutSheet/ShortcutSheet.tsx` (Radix `Dialog` portal/overlay/content like `HelpDialog`; title, platform tag, close button, grouped grid) and `ShortcutSheetGroup.tsx` (one catalog group per column).
- [x] 4.3 Lazy-mount the sheet from `LayoutHeader` with `useLazyDialog` + `React.lazy`, and subscribe to `?` via `useKeyboardShortcuts({ onShowShortcuts })`.
- [x] 4.4 Write `ShortcutSheet.test.tsx`: title, every group heading, every catalog row, a chip per row, the platform tag, close on Escape and on the close button.
- [x] 4.5 Extend `use-keyboard-shortcuts.test.ts`: `?` calls the handler and prevents default; `Ctrl+?`/`Cmd+?` do not; `?` inside an input/textarea/contenteditable does not; no `preventDefault` when the handler returns `false`; `Delete` still reaches `onDelete` while `?` is bound.

## 5. e2e

- [x] 5.1 Replace the assertion-free "should display keyboard shortcuts reference" placeholder in `e2e/onboarding.spec.ts` with a test that presses `?` and asserts the sheet, the "Keyboard Shortcuts" title, the "File Operations" group heading and a `<kbd>` chip.

## 6. Quality gates

- [x] 6.1 Full SPA suite green: 823 files / 5731 tests, 100% pass, `resource-parity.test.ts` included.
- [x] 6.2 `tsc -b --noEmit` clean; ESLint `--max-warnings=0` clean; Prettier clean on every touched file; `pnpm test:scripts` unchanged-green.
- [x] 6.3 `npx openspec validate add-shortcut-catalog-and-sheet` passes. No changeset — `@kaiord/workout-spa-editor` is private and excluded from the changeset-bot PUBLISHABLE set.
