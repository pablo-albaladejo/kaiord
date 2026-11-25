## Why

Issue #1684 (parent #1670). Train2Go's daily read already carries the coach's
steps table for many Coaching Activities: rows of duration, zone label, power
in W, heart rate in bpm, and repeat counts. Kaiord dropped it, so every
Workout went through the AI, billed and slower, to rebuild what the coach had
already written down, and the athlete never saw the table in the dialog.

## What Changes

- **Read.** The Train2Go Connector reads the steps grid out of the daily
  block (`parse-activity-steps.ts`), whole or not at all, and the record
  keeps it as `structuredSteps`. No new request, permission or privacy text.
- **Build without the AI.** `chooseCoachingBuilder` reads the table with
  `readStepsTable`: with no Athlete note and a table the KRD can hold, the
  Workout is built from it, with no model call and no provider needed (the
  dialog looks a provider up only when the AI is asked, and shows no AI
  progress otherwise). Each row is a timed step named by its zone label,
  power as its target, heart rate in its note; a repeated row with its
  recovery rows is one repetition.
- **The AI still reads the table.** With an Athlete note, or a table the KRD
  cannot hold (a value out of range, a sport it has no place for), the AI
  gets the coach's text, the table as text, and the note.
- **Show.** The coaching dialog shows the coach's table under the coach's
  text, as written, before and after the Workout is built.

## Capabilities

### Modified Capabilities

- `spa-coaching-integration`: the steps table on the record, the Workout
  built from it without the AI, and the table in the dialog.

## Impact

- `packages/workout-spa-editor`: the Train2Go Connector's daily parser,
  `CoachingActivityRecord.structuredSteps`, the coaching use cases
  (`choose-coaching-builder.ts`, `read-steps-table.ts`,
  `structured-steps-krd.ts`), the dialog (`CoachingStepsTable.tsx`, the
  `GenerateKrdPort` that picks its provider lazily), i18n (en, es).
- Out of scope: writing the table back to Train2Go, a secondary heart-rate
  target (Garmin's writer sends none).
