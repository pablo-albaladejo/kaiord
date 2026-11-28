## Context

A step's note (`WorkoutStep.notes`, at most 256 characters) is what the
device shows when the step starts; the Garmin writer sends it as the step's
`description`. A coaching Workout also carries the coach's full text as the
Workout-level note, sent as the workout's `description`.

## Decisions

### D1. The workout description is capped at 1024 characters

Garmin publishes no bound for a workout's `description`, and nothing in the
repository (fixtures, captures, docs) shows one. The gate needs a bound, so
it takes a conservative 1024, and the writer cuts a longer coach text to it
rather than have the send refused.

The step `description` sent to Garmin drops from 256 to 200 (owner decision,
26 Nov 2026): Garmin Connect's web workout builder counts a step note up to
200, and a FIT string holds at most 254 bytes. The writer cuts a longer step
note to 200 and the gate refuses one over it. Reading a step note from
Garmin stays bound by KRD's 256. Both caps are provisional until the live
Garmin capture measures them (task 1.4).

### D2. The note origin lives in the step's extensions

- **A.** A new `noteOrigin` field on the KRD step schema.
- **B.** A separate store keyed by Workout and step.
- **C.** `extensions.kaiord.noteOrigin: "ai"` on the step.

C is chosen. `WorkoutStep.extensions` already exists, so the schema does not
change; the mark is stored and synced with the Workout and moves with its
step through edits, copies and reorders, which B could not follow. The format
writers map named fields only, so it never reaches Garmin or a file. Only
`"ai"` is written: a note with no mark is the coach's. Editing the note
clears the mark. `@kaiord/core` owns the helpers (`markAiNote`, `isAiNote`,
`clearNoteOrigin`) so the AI package and the editor read one convention.

### D3. The table notes call returns notes only

- **A.** Ask the parser for the whole Workout again and keep its notes.
- **B.** A dedicated agent whose answer is `{ notes: [{ step, text, origin }] }`.

B is chosen. Its schema holds no duration, target or repeat, its validation
keeps only an in-range `step`, a trimmed `text` cut to 256 and the `origin`,
drops a second note for a step, and the merge writes only `notes` and the
origin mark onto the table's own steps. A hostile answer cannot reach the
structure. The call sends the coach's text and one line per step (its
duration and the coach's zone label), never the HR or power values nor the
athlete's zones, so it carries no health data and asks nothing first.

### D4. When the notes call runs

Only on the table path (a table that becomes a Workout and no Athlete note),
and only when a provider is configured: the port picks the provider lazily,
as the build does, and returns no notes without a provider. With an Athlete
note the AI builds the Workout, and its notes, as before. A failed or
refused call keeps the table Workout with its HR ranges and returns
`stepNotesFailed`, shown as a notice; a cancelled one cancels the build.

### D5. Cue first, then the HR range

The note reads `<cue> · HR <min>-<max> bpm`, built within Garmin's 200 so
the writer never cuts it. When the two run over, the cue is cut, never the
HR range.

## Risks

- The parser cassettes must be re-recorded with the live lane; until then
  the replay lane reports them stale.
