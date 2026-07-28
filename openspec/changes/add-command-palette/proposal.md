## Why

The SPA's editor actions exist twice and are enumerable nowhere. The right-click
menu (`useEditorContextMenu` + `EditorContextMenuContent`) is the de-facto list —
seven items, each with a live visibility flag — but it only appears if you know
to right-click, and it hides everything that is not currently applicable, so it
teaches nothing. Everything else (undo, redo, save) is reachable only by knowing
the key already. `?` documents the bindings but cannot run them, and the Help
dialog answers "how do I…" with four stacked prose sections.

Most "how do I…" questions are really "do this for me". Nothing in the SPA
answers both, and nothing lets a user search for an action by the words they
would use for it.

There is also a structural problem waiting: adding a second surface over the
same actions without a shared list would create a third hand-maintained copy of
"what the editor can do", the same drift the shortcut catalog was introduced to
end for key bindings.

## What Changes

- Add **one enumerable command source**, `hooks/use-editor-commands.ts` plus
  `build-do-commands.ts` / `build-learn-commands.ts`. An `EditorCommand` carries
  an id, a group (`do` / `learn`), i18n keys for title and subtitle, an optional
  `SHORTCUT_CATALOG` row id for its key chips, a live `enabled` flag and a `run`
  thunk. `run` always delegates to a `buildKeyboardHandlers` thunk; no surface
  re-implements a store action.
- **Rewire the context menu onto that list.** `useEditorContextMenu` becomes a
  projection: `contextMenuPropsFrom(commands)` maps command ids onto the
  existing `show*`/`on*` props, and `hasAnyContextMenuAction` replaces the
  hand-written `hasSelection || hasClipboard || hasSteps` expression with the
  equivalent "any menu command enabled". The rendered menu is unchanged.
- Add the **`⌘K` command palette** (`organisms/CommandPalette`), a Radix dialog
  lazy-mounted from `LayoutHeader` like `ShortcutSheet`: search input, `Do it` /
  `Learn` sections, per-row key chips resolved from the shortcut catalog, and a
  footer with `↵ run`, `? all shortcuts` and a link to the docs site.
- **Honest row copy.** A row states what it actually does. `⌘G` opens the
  repetition-block dialog, so its subtitle reads "Opens the repetition-block
  dialog" and never "Runs now · undo with ⌘Z". No direct-group store action is
  added. A disabled row still renders and explains its guard ("Select 2 or more
  steps") instead of disappearing the way the context menu's items do.
- **Bind `Ctrl+K`/`⌘K` in front of the form-field guard.** Unlike every other
  binding, the palette must answer while the user is typing, so
  `handleCommandPaletteKey` is dispatched at the top of `createKeyDownHandler`,
  before the `isFormElement` early return. `onShowCommandPalette` joins
  `KeyboardShortcutHandlers` and `HANDLER_KEY_MAP`, which makes the existing
  catalog-parity test require a `show-command-palette` row in the `help` group.
- Add the **`palette` i18n namespace** (`en` + `es`), covering every command
  title, its enabled subtitle and its closed-guard `requires` line.

Out of scope: the Help dialog and Help page (`HelpDialog` / `HelpSection`),
coach marks, the setup checklist, the header layout and the avatar menu.

## Capabilities

### New Capabilities

- `spa-command-palette`: one enumerable, guard-aware command source shared by
  the right-click menu and a `⌘K` palette that searches, explains and runs
  editor actions, states honestly whether a row runs or opens a dialog, and
  reaches the user even while they are typing.

### Modified Capabilities

<!-- None. `spa-shortcut-catalog` gains a row through its existing mechanism;
     every pre-existing binding keeps its behaviour. -->

## Impact

- **Package**: `@kaiord/workout-spa-editor` (private SPA) only. No domain,
  application, port or adapter change; no dependency added (Radix Dialog,
  lucide and `normalizeSearchText` are already in the tree).
- **New files**: `hooks/editor-command.types.ts`, `hooks/build-do-commands.ts`,
  `hooks/build-learn-commands.ts`, `hooks/use-editor-commands.ts`,
  `components/organisms/EditorContextMenu/context-menu-props-from-commands.ts`,
  `components/organisms/CommandPalette/*`,
  `components/templates/MainLayout/use-header-overlays.ts`,
  `i18n/locales/{en,es}/palette.json`, and their test suites.
- **Modified files**: `constants/shortcut-rows-global.ts`,
  `hooks/keyboard-shortcut-handlers.ts`, `hooks/modifier-shortcut-handlers.ts`,
  `hooks/use-editor-context-menu.ts`,
  `components/organisms/EditorContextMenu/EditorContextMenu.tsx`,
  `components/templates/MainLayout/LayoutHeader.tsx`,
  `i18n/locales/{en,es}/help.json`, `hooks/use-keyboard-shortcuts.test.ts`.
- **Bundle**: the palette is `React.lazy`-imported, so it ships as its own
  chunk and costs nothing until `⌘K` is pressed.
- **No** schema/version bump, no public-API impact, no changeset (the SPA is
  private and excluded from the changeset-bot PUBLISHABLE set).
