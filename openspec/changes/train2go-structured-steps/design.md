## Context

Train2Go's daily answer holds, for many Coaching Activities, a steps grid
(`<div class="grid">`) next to the coach's text. Kaiord built every Workout
through the AI from that text. The table is exact; the AI is billed, slow and
may drift from it. The Athlete note (`coaching-athlete-note-regenerate`)
lets the athlete steer a build, and only the AI can apply free text.

## Decisions

### D1. Read the table whole or not at all

- **A.** Keep the rows that read and skip the rest.
- **B.** Drop the whole table on any cell, unit or shape the parser does not
  know.

B is chosen. A Workout from part of a table looks right and is wrong; with
no table the build falls back to the coach's text, which is what happened
before. The dialog shows only a table that was read whole.

### D2. One place chooses between the table and the AI

`chooseCoachingBuilder` is the only code that decides. A table the KRD can
hold and no Athlete note: the table, without the AI. Otherwise the AI, with
the coach's text, the table as text and the note. Create, raw re-process and
Regenerate all go through it, and it stamps the resolved sport on every
build once.

### D3. Table text and table KRD are read apart

- **A.** `readStepsTable` returns `null` whenever the KRD build fails.
- **B.** It returns the table's text whenever the table parses, with a `null`
  KRD when the KRD cannot hold it.

B is chosen. With A, a table with one value out of range vanished from the
AI's prompt although the dialog showed it, so an Athlete note was applied to
the coach's text without the table.

### D4. The provider is looked up only when the AI is asked

- **A.** The dialog resolves the provider before the run and fails with
  `no-provider` when there is none.
- **B.** The `GenerateKrdPort` resolves it when called; none configured throws
  `NoAiProviderError`, classified as `no-provider`. The AI progress and the
  model's name show from that moment.

B is chosen. With A, the table path, which needs no AI, failed for an athlete
with no provider, and showed a model that never ran.

### D5. Heart rate goes in the step's note

KRD steps hold one target and Garmin's writer sends no secondary target.
Power is the target (the coach's primary column); the heart-rate range is
kept as `HR lo-hi bpm` in the step's note, with one formatter shared by the
note and the AI's table text.

## Risks / Trade-offs

- Train2Go may change the grid's markup: D1 turns that into a fallback to the
  AI, not a wrong Workout. The parser test runs on a synthetic fixture in the
  real markup's shape.
