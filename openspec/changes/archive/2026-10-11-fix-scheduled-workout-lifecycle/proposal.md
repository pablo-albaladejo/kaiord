> Completed: 2026-10-11

# Proposal: Fix the lifecycle of a scheduled workout

## Why

The journeys audit of 2026-10-10 found that a scheduled workout could be
created but not looked after:

- **F-29**: edits on a scheduled workout were persisted only inside the Garmin
  send. Without the extension, nothing was ever saved, and a reload dropped
  every change.
- **F-30**: the detail view's "More options" was permanently disabled, so a
  workout could not be deleted, and the only way to move one was dragging its
  card (journey 15: no keyboard alternative).
- **F-31**: a calendar card opened the editor, skipping the detail view, and a
  disabled "Send to Garmin" did not say why.
- **F-42**: an unknown id at `#/workout/:id` or `#/workout/view/:id` showed a
  spinner forever.
- **F-28**: the card was titled by the sport, and its origin chip printed the
  raw source id (`scratch`).

## What Changes

- **Save**: the editor on a persisted workout gets "Save changes", an unsaved
  marker, a `beforeunload` guard and a confirmed Discard/Back. Saving runs the
  `saveWorkoutEdits` use case: a pushed workout becomes `modified`, and the
  write re-reads the row in one transaction, so a concurrent date move is kept
  and a workout deleted meanwhile stays deleted. The dirty check compares the
  draft against a baseline that a save resets.
- **Detail menu**: "Move to another day" (through `rescheduleWorkout`, the use
  case the calendar drag runs) and "Delete workout" (confirm, then a 10 s
  Undo). When the workout sits on the Garmin calendar, the confirm says it is
  not deleted there.
- **Undo**: `restoreDeletedWorkout` writes the row back with `updatedAt` one
  millisecond after its tombstone's `deletedAt` at least, so the restored row
  wins `mergeSnapshots` against its own tombstone on every device.
- **Card**: opens `#/workout/view/:id`; title is the KRD's workout name, then
  the import's title, then the localized sport; origin chip in words; duration
  from the structure when the import has none.
- **Not found**: both routes say "Workout not found" with a way back once the
  live query settles without a record.

## Decision: deleting in Kaiord leaves Garmin alone

A characterization test pinned what the Garmin export ledger does when its
workout is deleted: nothing. The ledger cascade keys on `kaiordRecordId`,
which a workout row does not carry, so the row (including a pending `retire`
entry) stays as it is; the removal queue drains only inside a send of an
existing record, and placement answers `record-deleted` before reading the
ledger. Send week selects candidates from live workouts. No removal is
queued or sent, so the delete confirm tells the athlete to remove the entry
in Garmin Connect.

## Decision: manual surfaces are canonical for mutating

The detail, the editor and their dialogs are where a scheduled workout is
changed. The conversation is an accelerator that calls the same use cases
(`rescheduleWorkout`, `saveWorkoutEdits`, `workouts.delete`). Calendar cards
carry no mutation buttons; dragging a card is the only direct mutation on the
calendar, and the detail's "Move to another day" is its keyboard alternative.

## Impact

- `spa-calendar`: card click opens the detail; the canonical-surfaces
  invariant; cards name the workout and its origin.
- `spa-workout-state-machine`: an explicit save of a pushed workout moves it
  to `modified`.
