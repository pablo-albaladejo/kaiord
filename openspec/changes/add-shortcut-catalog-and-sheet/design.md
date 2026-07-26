## Context

Two window `keydown` listeners bound once by `useKeyboardShortcuts` carry every
SPA binding: `createKeyDownHandler` (modifier + Alt + `Delete`/`Backspace`,
delegating to `modifier-shortcut-handlers.ts`) and `createEscapeHandler`. Both
open with the same `isFormElement(event.target)` early return, which is the
invariant that keeps typing in inputs, textareas, selects and contenteditable
regions untouched. Handlers return `boolean`; `true` means "handled" and the
listener calls `preventDefault()`.

The user-facing documentation of that surface is four hand-written JSX files
that repeat the key literals, so the two sides can (and did) diverge. Nothing
fails when they do.

`HelpDialog` already establishes the lazy-dialog pattern in `LayoutHeader`:
`useLazyDialog()` returns `{ open, setOpen, mounted, show }`, the component is
`React.lazy`-imported and only rendered once `mounted` flips, inside a
`<Suspense fallback={null}>`.

## Goals / Non-Goals

**Goals:**

- One declarative source of truth for the bindings, consumed by every surface.
- A test that fails when a handler is added, renamed or removed without the
  catalog following — mechanical, not a review convention.
- `?` opens a shortcut sheet without regressing any existing binding and
  without firing while the user types.
- Drop `navigator.platform`.
- Respect the SPA caps: ≤80 lines/file (ESLint, `skipBlankLines`+`skipComments`),
  ≤60 lines/React component function.

**Non-Goals:**

- Changing what any existing shortcut does.
- The command palette, coach marks, the Help dialog's prose sections, or the
  header layout.
- Making the catalog user-editable / rebindable.

## Decisions

### D1 — `Record<keyof Handlers, true>` as the runtime mirror, not a bare array

`HANDLER_KEYS` needs to exist at runtime for the parity test to enumerate, but a
hand-written `as const` array only checks one direction: `satisfies` catches
extras, never omissions. Declaring `HANDLER_KEY_MAP: Record<keyof
KeyboardShortcutHandlers, true>` and deriving `HANDLER_KEYS = Object.keys(…)`
makes both directions compile-time errors — a new handler without an entry fails
to type-check, and an entry for a deleted handler does too — while still giving
the test a runtime list. No unused type-level assertion consts, no `never`
tricks that silently pass.

### D2 — `?` is a handler on the existing chain, not a second listener stack

`onShowShortcuts` joins `KeyboardShortcutHandlers` and is dispatched from the
non-modifier branch of `createKeyDownHandler`, alongside `Delete`/`Backspace`
(extracted to `handlePlainKeys` to keep the factory under the function cap).
This inherits the `isFormElement` guard and the `preventDefault`-on-`true`
contract for free, which a bespoke listener would have had to re-implement and
could have got wrong. Match is on `event.key === "?"` (the character Shift+/
produces), so alternative layouts work without hard-coding `Shift` + `Slash`.

The consequence is that `onShowShortcuts` is a handler key, so the parity test
demands a catalog row for it. It gets one, in a `help` group — the sheet
documents its own binding, which is the right answer anyway.

### D3 — `LayoutHeader` owns the sheet and subscribes to `?` directly

The sheet lives where the other lazy dialog lives. `LayoutHeader` calls
`useKeyboardShortcuts({ onShowShortcuts })` with a memoized callback rather than
threading a new prop from `AppKeyboardShortcuts` → `App` → `MainLayout` →
`LayoutHeader`. `useKeyboardShortcuts` binds its listeners once and reads
handlers from a ref at fire time, so a second subscription is two extra window
listeners with no re-binding churn, and the two handler sets never collide
(`AppKeyboardShortcuts` does not pass `onShowShortcuts`; the header passes
nothing else).

### D4 — Group ids drive the i18n heading keys

`t(`shortcuts.${group}.heading`)` removes a per-section mapping table and makes
the parity test able to assert headings too. That required renaming the existing
`help.shortcuts.step` namespace to `steps` in both locales; the rendered strings
("Step Management" / "Gestión de pasos") are unchanged, so no visible diff and
`resource-parity.test.ts` stays green.

### D5 — Module layout is cap-driven

14 rows × ~7 lines does not fit the 80-line file cap, so the rows are split into
three sibling modules by family (`global` = file/selection/help, `edit`,
`steps`) and `shortcut-catalog.ts` holds the types, `SHORTCUT_GROUPS` and the
assembled `SHORTCUT_CATALOG`. The row modules import the `ShortcutDef` type from
the catalog; that cycle is type-only and erased at emit. `constants/AGENTS.md`
("constants only, no functions") is respected: the group filter is a one-line
`.filter()` at each of the two call sites, not a helper in `constants/`.

### D6 — Chips are an atom, rows are not

`KeyChips` (atom) owns the `<kbd>` styling, the mac/non-mac pick and the alias
run, and is shared by the Help row and the sheet row. The two rows themselves
stay separate components because their layout genuinely differs (Help:
`justify-between` inside a 2-column grid; sheet: compact column entries).
Sharing the chips is what prevents the styling from drifting; sharing the rows
would have forced a variant prop for no gain.

### D7 — Icons dropped from the shortcut rows

Every previous row carried a hand-picked lucide icon, which cannot live in the
catalog (`constants/` may not import components) and would otherwise need a
second id→icon map — reintroducing exactly the manual sync this change removes.
The design reference for the sheet has no icons either. Rows are now
label + chips.

## Risks / Trade-offs

- **`?` on non-US layouts** → Matching the produced character rather than
  `Shift`+`Slash` is the portable choice. On layouts where `?` needs AltGr the
  browser reports `ctrlKey+altKey` (and, where supported, the `AltGraph`
  modifier state), which a naive modifier check would misclassify as a Ctrl
  shortcut and swallow — so the handler classifies AltGr events as plain keys
  before the modifier branch. Side benefit: AltGr-produced characters can no
  longer trigger Ctrl shortcuts like undo. On layouts where `?` is unshifted
  it fires without Shift, which is harmless.
- **A second `useKeyboardShortcuts` subscription** → Two extra window listeners
  for the lifetime of the header. Measured cost is nil and the alternative was
  four levels of prop threading; if a third subscriber ever appears, promoting
  the handler set to context is the escape hatch.
- **The `help` group appears on the Help page too** → Slightly recursive
  ("Show keyboard shortcuts — ?" documented inside the shortcuts reference), but
  it is how a user discovers the binding, and excluding it would mean an
  arbitrary group blacklist in the renderer.
- **Type-only import cycle between the catalog and its row modules** → Erased at
  emit and invisible to the bundler; the alternative (a fourth `.types.ts`
  module) trades a real file for a cosmetic concern.

## Migration Plan

None. Purely additive at runtime: no persisted data, no schema version, no
public API. Rollback is deleting the new files, restoring the four section
components and dropping `onShowShortcuts` from the handler type.

## Open Questions

- None blocking. Whether the sheet should eventually replace the Help dialog's
  shortcuts section entirely (rather than both rendering the catalog) is a
  question for the later Help-redesign waves, not this change.
