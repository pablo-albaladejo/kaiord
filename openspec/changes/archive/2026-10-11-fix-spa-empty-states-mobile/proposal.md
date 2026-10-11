> Completed: 2026-10-11

# Proposal: Empty states and the phone layout say what to do next

## Why

The journeys audit of 2026-10-10 found two first-run dead ends:

- **F-05**: the empty library said "save a workout to get started" and
  offered nothing to do it with — no way to create or import from there.
- **F-45**: on a phone, the "New session" sheet put the AI block first. With
  no AI key that block is only a setup prompt, and it pushed "Template",
  "Blank" and "Import file" — the paths that work right now — below the fold
  and under the floating bottom nav (390×664: tiles ending at 854 px, the nav
  starting at 586 px).

Production evidence (`verify:prod --only empty-states-mobile`, sha
`c5951c7c`) failed both: the empty library's only controls were the
default-profile notice and the sport chips, and every non-AI tile sat under
the nav.

## What Changes

- **Empty library**: "New workout" opens the New session sheet, and "Import
  file" opens the file import. A filtered library with no match offers
  neither; the library is not empty there.
- **New session without an AI key**: "Start from" Template / Blank / Import
  file comes first and the AI setup prompt after it. With a key the AI prompt
  stays first, followed by "or start from".
- **One bottom-nav geometry**: `--bottom-nav-height`, `--bottom-nav-gap` and
  `--bottom-nav-fab-rise` live in `index.css`. The nav reads them (and now
  floats above the safe-area inset) and `<main>` pads its end with
  `--bottom-nav-clearance` derived from them, instead of the bar, the FAB and
  the page each restating 64/14/11 px and `pb-28`.
- **Room above the fold**: the default-profile notice wraps its two links
  under the sentence on a phone instead of squeezing the sentence into a
  third of the row, and the New session sheet drops its second 16 px gutter
  below `sm` — `<main>` already provides one.

## Decision: reorder rather than shrink

Making the sheet fit by shrinking the AI block would keep a dead end first.
Without a key the AI block can do nothing but send the athlete to Settings,
so it goes after the paths that work. With a key the AI prompt is the
primary action and keeps its place.

## Impact

- `spa-routing`: the empty library offers its two ways in; on a phone the
  New session sheet without an AI key shows its non-AI starts above the
  bottom nav without scrolling, and the end of any page clears the nav.
