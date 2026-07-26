> Completed: 2026-07-26

## Why

The SPA's keyboard bindings live in two places that nothing keeps in agreement.
`hooks/keyboard-shortcut-handlers.ts` + `hooks/modifier-shortcut-handlers.ts`
own the real behaviour (13 handlers, including `Ctrl+X` cut, `Delete`/`Backspace`
and the `Ctrl+Shift+Z` redo alias), while four hand-written JSX files under
`components/pages/HelpSection/sections/shortcuts/` re-declare a _subset_ of them
as `<ShortcutRow keys={…}>` literals. The drift is already real and shipped:
`cut` and `delete` are bound but undocumented, and the "paste" row is drawn with
a scissors icon. `HelpSection/AGENTS.md` acknowledges the gap by instructing
agents to "keep keyboard-shortcut docs in sync" — a manual chore with no
mechanical guard behind it.

The shortcuts are also the most-reached-for part of Help, yet reaching them
takes opening the Help dialog and scrolling past Getting Started. There is no
`?` binding, and the placeholder e2e test that claims to cover a shortcut
reference presses `Ctrl+/` and asserts nothing.

`ShortcutRow` additionally decides the platform with the deprecated
`navigator.platform`.

## What Changes

- Add a **single shortcut catalog** (`constants/shortcut-catalog.ts` plus three
  row modules) describing every binding the SPA ships: id, group, keys, mac
  keys, optional alias keys, i18n label key and the handler it documents.
- Pair the catalog to `KeyboardShortcutHandlers` with a **mechanical test**.
  `keyboard-shortcut-handlers.ts` gains `HANDLER_KEYS`, a runtime array derived
  from a `Record<keyof KeyboardShortcutHandlers, true>` so it cannot drift from
  the type in either direction; `shortcut-catalog.test.ts` asserts every handler
  key appears in exactly one catalog row and every catalog label key resolves in
  `locales/en/help.json`. The manual sync chore is deleted.
- Rewrite the four hardcoded shortcut sections as **one** catalog-driven
  `ShortcutGroupSection`, so the Help page is generated from the catalog. Adds
  the previously undocumented `cut` and `delete` rows and the redo alias.
- Two deliberate visual changes to the shortcuts list. **Per-row icons are
  dropped** — rows are now label + key chips: an icon cannot live in the catalog
  (`constants/` may not import components) and a second id→icon map would
  reintroduce exactly the manual sync this change removes; the design reference
  for the sheet has no icons either. **Mac chips now use glyphs** (`⌘ ⇧ ⌥ ⌫`)
  instead of the words `Cmd`/`Shift`/`Alt`, matching what `EditorContextMenu`
  has always rendered via `utils/platform.ts`.
- Add a `?` **shortcut sheet** (`organisms/ShortcutSheet`), a Radix dialog
  lazy-mounted from `LayoutHeader` via `useLazyDialog` + `React.lazy`, the same
  pattern `HelpDialog` uses. It renders the catalog grouped in columns with
  `<kbd>` chips and a platform tag.
- Bind `?` in the existing global keydown chain via a new `onShowShortcuts`
  handler, behind the same `isFormElement` guard as every other binding, so it
  never fires while the user is typing. The guard is extracted to
  `utils/is-form-element.ts` and shared by all listeners in the chain.
- Replace the deprecated `navigator.platform` read with `isMacPlatform()` in
  `utils/platform.ts` (`navigator.userAgentData?.platform ?? navigator.userAgent`),
  alongside `formatShortcutKeys(def, isMac)`.
- Rewrite the assertion-free e2e placeholder to press `?` and assert the sheet,
  a group heading and a key chip.

Out of scope: the command palette, coach marks, the rest of the Help dialog
(Getting Started / Examples / FAQ), and the header layout. The Help button
stays where it is.

## Capabilities

### New Capabilities

- `spa-shortcut-catalog`: one declarative catalog of the SPA's keyboard
  bindings, mechanically paired to the handler surface and to the `help` i18n
  namespace, rendered by both the Help page and a `?`-triggered shortcut sheet
  that respects the form-field guard.

### Modified Capabilities

<!-- None. Existing bindings keep their behaviour; `?` is purely additive. -->

## Impact

- **Package**: `@kaiord/workout-spa-editor` (private SPA) only. No domain,
  application, port or adapter change; no dependency added (Radix Dialog and
  lucide are already used).
- **New files**: `constants/shortcut-catalog.ts`, `constants/shortcut-rows-{global,edit,steps}.ts`,
  `constants/shortcut-catalog.test.ts`, `utils/is-form-element.ts`,
  `utils/platform.test.ts`, `components/atoms/KeyChips/*`,
  `components/pages/HelpSection/sections/shortcuts/ShortcutGroupSection.tsx`,
  `components/organisms/ShortcutSheet/*`.
- **Deleted files**: the four hardcoded
  `sections/shortcuts/{FileOperations,EditOperations,StepManagement,Selection}Shortcuts.tsx`.
- **i18n**: `help.shortcuts.edit.cut`, `help.shortcuts.edit.delete`,
  `help.shortcuts.help.{heading,showShortcuts}` added to `en` and `es`;
  `help.shortcuts.step` renamed to `help.shortcuts.steps` so group headings
  resolve mechanically from the group id. `resource-parity.test.ts` stays green.
- **No** schema/version bump, no public-API impact, no changeset (the SPA is
  private and excluded from the changeset-bot PUBLISHABLE set).
