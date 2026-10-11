> Completed: 2026-10-11

# Proposal: The "New session" sheet keeps the day it was opened for

## Why

The 2026-10-10 journeys audit found that the "New session" sheet forgot its
context on every exit except "Generate with AI":

- **Blank** opened `/workout/new?source=scratch` without the day or the sport
  picked on the sheet. "Save & schedule" then wrote the workout on today,
  as cycling (F-27, F-08).
- **Import file** dropped `?date`, so an activity imported from Wednesday's
  sheet landed on its own file date and the user was sent elsewhere.
- **Template** opened the plain Library. It had no picking mode for the day
  (journey 6), and loading a template from there triggered the "discard
  draft" prompt meant for sheet-started drafts (F-07).
- **Close** on a dated sheet navigated to `/workout/new?date=<day>`, which
  reopened the same sheet (F-43).
- The schedule dialog proposed no date for an undated draft and said nothing
  when the date was empty (F-20). It was English-only (F-19).
- "Keep in library" proposed an empty name instead of the workout's name
  (F-17).

## What Changes

- One route builder, `buildNewSessionHref(mode, context)`, carries the
  sheet's `date`, `week` and `from` to every exit. Blank also carries
  `sport`.
- The scratch editor seeds the sport from `?sport=` before the last-used
  sport and the cycling default.
- Close on a dated sheet returns to that day's calendar week. A non-calendar
  origin returns to that origin.
- "Template" opens `/library?source=template-picker&date=<day>`. The page
  explains that it is picking for that day, and "Schedule" proposes that day.
  A template loaded from the Library does not trigger the draft-discard
  prompt.
- "Save & schedule" on an undated draft opens the schedule dialog. The dialog
  proposes the first day of the week in context, or today. It explains an
  empty or invalid date inline and is localized (EN/ES).
- "Keep in library" proposes the workout's name each time it opens.

## Impact

- Specs: `spa-routing` (new requirements for the sheet's context and the
  schedule/keep dialogs).
- Code: `packages/workout-spa-editor` only. There is no data migration.
