## Why

Issue #1685 (parent #1670), owner decisions of 25 Nov 2026. Once the AI has
built the Workout for a Coaching Activity, the athlete cannot steer it,
regenerate it, delete it or keep it apart: "Process with AI" shows only while
there is no Workout and a later call returns the existing one; the coach's
notes are read-only; the dialog has no delete; deleting from the detail page
leaves the Match pointing at nothing, so the next build is left unmatched and
the Activity is stuck; and a Split is undone by the auto-heal, while the Split
button of the linked-workout section does nothing.

## What Changes

- **Athlete note.** "Your note" ("Tu nota") under the coach's text, stored in
  a new `athleteNotes` store (Dexie v41), synced, backed up, cascaded and
  re-keyed like Workouts. The AI reads it after the coach's text, which is
  never changed; it never goes to Train2Go. GLOSSARY.md gets the term.
- **Regenerate.** An explicit, billed rebuild in place (same Match, same Day),
  confirmed after hand edits and warned when on the watch (back to Ready; the
  earlier version stays in Garmin's library). The builder is chosen in one
  place, `chooseCoachingBuilder`: with a steps table and no note the table is
  read without the AI (the `readStepsTable` seam for #1684).
- **Delete workout** in the dialog removes the Workout and its Match, with
  Undo for both and the Garmin notice when placed; the detail page's delete
  removes the Match too. A leftover Match of a deleted Workout no longer
  blocks the next build.
- **Split stays split.** Both Split buttons work; the split detaches the
  Workout built from the Activity, so the auto-heal leaves them apart.
- **Disclosures.** The data-flows inventory names "your coach's plan and
  comments" and "your notes on your coach's activities" for generation; the
  privacy policy says the note goes only to the AI provider.

## Capabilities

### Modified Capabilities

- `spa-coaching-integration`: Athlete note, Regenerate, Delete workout, Split
  stays split; the AI-driven creation reads the note and drops a leftover
  Match.

## Impact

- `packages/workout-spa-editor`: application (coaching use cases), ports and
  Dexie adapter (v41), the coaching dialog, the detail page's delete, i18n
  (en, es), data flows.
- `packages/docs/legal/privacy-policy.md`, `claims/data-flows.json`,
  `GLOSSARY.md`, the UX glossary.
- Out of scope: the Train2Go steps table itself (#1684), deleting from
  Garmin's library (`GARMIN_LIBRARY_DELETES` stays off).
