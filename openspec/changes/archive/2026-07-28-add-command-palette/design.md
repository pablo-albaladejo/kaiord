## Context

`useEditorContextMenu` is today's action list. It calls `buildKeyboardHandlers`
(the same guard-aware thunks the keyboard chain uses) and pairs them with seven
booleans — `showCut`, `showCopy`, `showPaste`, `showDelete`, `showSelectAll`,
`showGroup` (`selectedStepIds.length >= 2`), `showUngroup` — plus `hasAnyAction`,
which suppresses the menu entirely when nothing applies. `EditorContextMenu.tsx`
spread those fourteen props by hand into `EditorContextMenuContent`.

The keyboard chain is two `window` `keydown` listeners bound once by
`useKeyboardShortcuts`. Both open with `isFormElement(event.target)`, the
invariant that keeps typing untouched. Handlers return `boolean`; `true` means
handled and the listener calls `preventDefault()`.

`SHORTCUT_CATALOG` (K1) already owns every key literal and is mechanically
paired to `KeyboardShortcutHandlers` by `shortcut-catalog.test.ts`.
`ShortcutSheet` establishes the overlay pattern: Radix `Dialog`, `useLazyDialog`

- `React.lazy` from `LayoutHeader`, `<Suspense fallback={null}>`.

## Goals / Non-Goals

**Goals:**

- One enumerable command list, consumed by both the context menu and the
  palette, so a third copy of "what the editor can do" cannot appear.
- `⌘K` reaches the user mid-typing, without changing any other binding.
- Rows that are honest about running vs. opening a dialog, and that explain
  themselves when disabled.
- Respect the SPA caps: ≤80 lines/file, ≤60 lines/React component function.

**Non-Goals:**

- A direct-group store action. `⌘G` opens the dialog; that stays true.
- Rebindable shortcuts, fuzzy/ranked search, recents or command history.
- Touching `HelpDialog`/`HelpSection`, coach marks or the header layout.

## Decisions

### D1 — The context menu becomes a projection, not a peer

The alternative was to leave `useEditorContextMenu` alone and build the palette
on a second list "derived from the same handlers". That is the drift the
shortcut catalog was created to end, one level up: two lists over one handler
surface, agreeing only by review. Instead `useEditorCommands` is the single
producer and `contextMenuPropsFrom(commands)` is a pure projection onto the
menu's existing prop shape. `hasAnyContextMenuAction` replaces the old
`hasSelection || hasClipboard || hasSteps` with "any menu command available",
which is the same question asked of the authoritative source.

The projection is behaviour-preserving; the guards it projects are not, on
purpose — see D3. Making one list serve both surfaces is what exposed the menu
bug, because a guard that only had to look plausible next to a `show*` prop had
to become exactly right once a row could also render disabled and explain
itself.

Keeping the projection in the `EditorContextMenu` folder (not in the hook) means
the shared list stays free of context-menu vocabulary, and
`EditorContextMenuContent`'s props — and its existing test — are untouched.

### D2 — Command ids ARE catalog row ids

`shortcutId` could have been a free-form field with its own mapping table. It is
instead literally the command id (`cut`, `create-block`, `ungroup-block`, …),
which are already the `SHORTCUT_CATALOG` row ids, so the chips resolve with a
`find` and no second table exists to drift. A test asserts every `shortcutId`
resolves to a catalog row. `learn` rows carry no `shortcutId` and render no
chips.

### D3 — `enabled` mirrors each thunk's own guard, one field per command

The context menu's guards were **wrong**, and this change fixes them rather than
inheriting them. `showCut`/`showCopy` tested `!sid.startsWith("block-")` and
`showUngroup` tested `sid.startsWith("block-")`, but block ids are UUIDs from
`defaultIdProvider()` (`create-repetition-block-action.ts`); `generateBlockId()`
only ever runs for legacy blocks in `workout-migration.ts`. So with an in-app
block selected the menu offered Cut/Copy/Delete (all no-ops, since
`getSelectedStepIndex` returns `null` for a block) and withheld Ungroup, the one
action that would have worked. `build-step-handlers.ts` already carried a
comment saying the prefix test is unreliable; the guards next to it had not been
updated.

`editor-command-guards.ts` therefore derives availability with `findById` — the
same predicate `getSelectedStepIndex` uses — and gives every command its own
field, because commands that look alike do not share a guard:

- `canCut` is `canCopy` **and** `selectedStepIds.length <= 1` (`onCut` bails on a
  multi-selection).
- `canDelete` equals `canCopy`, not "anything is selected": `onDelete` deletes
  the single top-level `selectedStepId` and does nothing for a block.
- `canPaste` needs a workout as well as clipboard content (`onPaste`'s final
  `else return false`).
- `canSelectAll` needs a step carrying `stepIndex`, not merely a non-empty
  `steps` array — a blocks-only workout yields no ids and `onSelectAll` returns
  `false`.

A shared coarse flag is what produced the original defect, so the type has no
`hasSelection`-style field left to share.

Ten `do` commands: the seven the menu shows, plus `undo`, `redo` and `save`,
whose guards (`canUndo`, `canRedo`, `!!currentWorkout`) are already live in the
store selectors. `move-up`/`move-down` are deliberately **not** palette rows:
their guard is positional (`stepIndex() > 0`, `< steps.length - 1`) and depends
on state the row would have to re-derive, so a row could only approximate it.
They stay documented in the shortcut sheet, which the footer links to.

### D4 — `subtitleKey` flips to `.requires` when the guard is closed

The type carries one subtitle slot, and a disabled row needs to say _why_, so
the builder picks `commands.<id>.subtitle` when enabled and
`commands.<id>.requires` when not. Every command therefore has both keys in the
`palette` namespace, which also makes the honesty rule mechanical rather than a
copy-review convention: `create-block.subtitle` is "Opens the repetition-block
dialog", asserted by test.

`create-block` additionally swaps its _title_ key: `titleCount` ("Group the
{{count}} selected steps into a block") when groupable, and the count-free
`title` when not, so a closed guard never renders "the 1 selected steps".

### D5 — `⌘K` is dispatched before the form-field guard

`?` sits behind `isFormElement` because a literal `?` must reach the input. `⌘K`
is a modifier chord with no textual meaning, and the palette's whole point is to
be reachable from wherever the user is — including a workout-name field. So
`handleCommandPaletteKey` runs first in `createKeyDownHandler` and returns
`true` for any matched chord, handled or not, which stops the chain: `Ctrl+K`
means nothing else in the app. `Shift`/`Alt` variants return `false` and fall
through untouched, so `Ctrl+Shift+K` still reaches the browser.

The handler joins `KeyboardShortcutHandlers` and `HANDLER_KEY_MAP`, which makes
K1's parity test _require_ the `show-command-palette` catalog row — the binding
cannot ship undocumented.

### D6 — Focus stays in the input; the active row is `aria-activedescendant`

`ExportFormatSelector/useKeyboardNavigation` moves DOM focus onto the focused
option via `optionRefs`. That is right for a listbox with no text entry and
wrong here: moving focus off the search input would stop the user typing after
the first arrow key. The palette therefore uses the combobox pattern — the input
keeps focus, `aria-activedescendant` publishes the active row, and arrow keys
only move an index. `Escape` is left entirely to the Radix dialog, which already
owns dismissal and focus restore for `ShortcutSheet`.

`useOverlayFocusStash` is deliberately not wired here, and it would not help if
it were: `lib/focus/overlay-count.ts` queries _within_ the `editor-root`
element, while `Dialog.Portal` mounts on `document.body`, so no portalled Radix
dialog is visible to that observer. `ShortcutSheet` and `HelpDialog` portal
identically and have never participated either. Focus restore on close comes
from Radix's own `FocusScope`, which returns focus to the element that had it
when the dialog opened — the behaviour the shortcut sheet already relies on.
Extending the overlay observer to portalled dialogs is a focus-system change,
not a palette change.

### D7 — Filtering is substring over the _translated_ title

`normalizeSearchText` (NFD + diacritic strip + lowercase) already exists for
chat search, so accent- and case-insensitivity comes free and no dependency is
added. Matching runs against `t(titleKey, titleParams)` — the text the user is
reading — not against the key or the id. Subtitles are excluded to keep a query
like "block" from dragging in every row whose subtitle mentions blocks.

## Risks / Trade-offs

- **Two `keydown` subscriptions see every `⌘K`.** `LayoutHeader` binds
  `onShowCommandPalette`; `useAppKeyboardHandlers` binds the editor handlers and
  has no palette handler. Both listeners now early-return on `⌘K`; only the one
  with the handler acts, and `preventDefault` is applied by that one. No
  double-open, no swallowed binding — covered by a test that `Ctrl+S`/`Ctrl+C`/
  `Ctrl+G` are unaffected while `⌘K` is bound.
- **`useEditorCommands` allocates ten closures per render** in both the menu and
  the palette. This is what `useEditorContextMenu` already did with
  `buildKeyboardHandlers`; the list is 13 entries and the palette only exists
  while open.
- **`learn` rows are hardcoded docs links.** The docs site has no
  repetition-block page today, so the three entries point at pages that exist
  (quick start, KRD format, converters) rather than inventing routes. Adding a
  row is one line in `LEARN_PAGES` plus its two i18n keys.

## Migration Plan

Additive. `useEditorContextMenu` keeps its name and its selection helpers; only
its shape changes (`menu` replaces the seven `show*` props, and the `handlers`
escape hatch is gone) and its one consumer is updated in the same change.

## Open Questions

None.
