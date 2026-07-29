## Context

`useElementHighlight(open, targetSelector)` calls `document.querySelector` and
scrolls the result into view. It has never returned an element in production:
`TUTORIAL_STEPS` sets `position: "center"` on all six steps and sets
`targetSelector` on none. `TutorialDialog` then asks
`getPositionClasses(step.position)` for a Tailwind class string — the function
takes no rect, so `"top"` means `top-[10%]` of the viewport, not "above the
thing". A tutorial written this way could not have anchored even if a step had
tried.

The machinery to anchor properly already exists elsewhere in the tree.
`FocusRegistryContext` (§7.1) maps `ItemId → HTMLElement`; `StepCard` and
`RepetitionBlockCard` both self-register through `useFocusRegistration`, and
`useFocusAfterAction` resolves post-commit focus targets through it.
`atoms/Tooltip/compute-position.ts` turns two `DOMRect`s plus a side and an
align into `{ top, left }` in page coordinates.

K2's `useEditorCommands` is the enumerable list of what the editor can do, each
entry carrying the exact guard its keyboard thunk applies (`canGroup`,
`canUngroup`, …) and a `run` that delegates to that thunk.

## Goals / Non-Goals

**Goals:**

- A mark that points at a real element, or no mark at all.
- Relevance decided by an existing command guard, never by a "seen it" flag.
- One shared positioning implementation with the tooltip atom.
- Delete every surface the docs site already covers.
- Respect the SPA caps: ≤100 lines/file, ≤60 lines/React component function.

**Non-Goals:**

- A linear, ordered, resumable tour. There is no "step 2 of 6" any more.
- Restructuring the header. K4 removes the Help button and nothing else;
  the account menu is Wave H's, and doing it here would rewrite the same
  header tests twice.
- Translating the docs site. EN-only long-form is an accepted decision, and
  the Spanish `help.json` long-form retires alongside the English.

## Decisions

### D1 — Anchors come from the focus registry, not from selectors

`useElementHighlight` keeps its name, its `open` gate and its `scrollIntoView`,
and swaps `document.querySelector(selector)` for
`FocusRegistryContext.getItem(asItemId(id))`. The ids it consumes are the ones
the store already holds (`selectedStepId`, `selectedStepIds`), so no component
needs a new marker class or `data-` attribute, and a card that unmounts drops
out of the registry — the mark stops resolving rather than pointing at a stale
node.

The consequence is a hard scope limit, and it is the right one: a coach mark
can only exist for something registered. Today that is step cards and
repetition-block cards. The design's other implied marks (header, connections,
the push button) have no registry entry, so they are not shipped rather than
faked with a selector.

### D2 — No position, no mark — never a centred fallback

`useAnchoredPosition` returns `null` until both rects are measurable. The host
still renders the bubble into the DOM at that point (a rect is needed to place
it) but with `visibility: "hidden"` and `data-anchored="false"`, exactly the
two-pass measure the `Tooltip` atom does. It never substitutes a centred
position. `pickCoachMark` enforces the same rule one level up: an entry whose
anchor id is `null` is skipped outright.

This is the requirement that makes the retirement real. The failure mode being
retired is not "the tutorial was ugly", it is "a pointer that points nowhere
degrades into a modal", and the code now refuses that degradation twice.

### D3 — Relevance is an existing guard, not a new predicate

`useCoachMark` reads `useEditorCommands()` and treats `enabled` as "this mark
is relevant". A mark's id **is** the command id and **is** the
`SHORTCUT_CATALOG` row id, so the card resolves its key chips the same way
`CommandPaletteRow` does, and `accept()` calls the command's own `run` rather
than reaching into the store.

Writing a second "are three steps selected?" predicate is exactly the drift K1
and K2 were built to end. It also means the copy cannot over-promise: `⌘G`
opens the repetition-block dialog, so the mark's action reads "Open the block
dialog", matching the palette's `create-block.subtitle`.

### D4 — Dismissal is per profile, in the preferences row

`dismissedCoachMarks?: string[]` joins `setupChecklistDismissed` on the
existing `userPreferences` row: optional, unindexed, no Dexie version bump,
carried by the cloud snapshot. A tip taught on the laptop is not re-taught on
the phone.

Per-mark ids rather than one boolean: waving away the grouping tip should not
silence the ungrouping tip, and a future mark should not arrive pre-dismissed
for every existing user.

### D5 — "Replay tutorial" becomes "Show tips again"

There is no tour to replay, so the retired button is not carried over under a
false name. The Settings About group gains an action row that empties
`dismissedCoachMarks`, which is the only thing "replay" can now honestly mean.

`SettingsRowDef` grows `action?: SettingsActionKey`, resolved by
`useSettingsRowActions` — the same shape as `valueKey` → `useSettingsRowValues`,
so the row registry stays declarative and the behaviour stays behind the hook
that owns the state. `SettingsRow` renders an action row as a `<button>` with
no chevron; a row with neither destination nor action stays inert.

### D6 — The e2e suite loses its tutorial assumptions

`disableOnboardingTutorial` wrote `workout-spa-onboarding-completed` into
`localStorage` so specs would not trip over the modal. With no modal and no
key, the helper is a no-op that reads as protection, so it and its three call
sites go. `onboarding.spec.ts` keeps the shortcut-sheet and tooltip flows and
drops everything that asserted on the tour — including the blocks that only
ever asserted on a `workout-spa-first-workout-hints-dismissed` key that no
code has ever written.

## Risks / Trade-offs

- **Only two marks ship.** The design sketches coach marks as a general
  mechanism; the registry currently answers for step and block cards only.
  Accepted: the catalog is ordered and data-driven, so a third mark is a
  registry entry plus copy once its target self-registers.
- **`useCoachMark` adds a live query.** It reads the preferences row through
  the existing `useUserPreferences`, which is one more Dexie subscription on
  the editor page. Accepted over a bespoke read: no new query code, and the
  row is already cached by Dexie for the other consumers.
- **Coverage of retired code disappears with it.** `OnboardingTutorial.test`
  and `HelpSection.test` were ~1000 lines pinning surfaces that no longer
  exist; deleting the subject and the test together is correct, and the new
  modules ship their own tests.
