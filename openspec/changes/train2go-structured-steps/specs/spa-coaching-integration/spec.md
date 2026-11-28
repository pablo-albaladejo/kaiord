## ADDED Requirements

### Requirement: Coach's steps table on a Coaching Activity

The Train2Go Connector SHALL read the steps grid of a Coaching Activity out of the daily read it already makes, and the `CoachingActivityRecord` SHALL keep it as `structuredSteps`: groups of rows, each row a duration in seconds, the coach's zone label, a power range in W and a heart-rate range in bpm, each group under a repeat count. The table SHALL be kept only when every cell of it was read; any unknown cell, unit or shape SHALL drop the whole table. The read SHALL add no request, permission or privacy text.

#### Scenario: A whole table is kept

- **GIVEN** a daily block whose steps grid has a warm-up row, a 4 × block of a work row and a recovery row, and a cool-down row
- **WHEN** the Connector reads the day
- **THEN** the record's `structuredSteps` holds three groups, the second with `repeat: 4` and two rows

#### Scenario: A table with an unreadable cell is dropped

- **GIVEN** a steps grid with one cell in an unknown unit
- **WHEN** the Connector reads the day
- **THEN** the record has no `structuredSteps`

### Requirement: Workout from the coach's steps table without the AI

When a Coaching Activity has a steps table the KRD can hold and no Athlete note, `chooseCoachingBuilder` SHALL build its Workout from the table, with no model call, for a new Workout, a raw one processed in place and a Regenerate alike. Each row SHALL become a timed step named by its zone label, with its power range in W as the target and its heart-rate range as the step's note (`HR lo-hi bpm`); a group repeated N > 1 times SHALL become one repetition holding its rows. The Workout SHALL carry the resolved sport and `aiMeta: null`. No AI provider SHALL be needed: the coaching dialog SHALL look a provider up only when the model is called, and SHALL show no AI progress or model name for a table build. When the model is called and no provider is configured, the use case SHALL fail with `reason: "no-provider"` and write nothing.

When the activity has an Athlete note, or a table the KRD cannot hold (a value out of range, a sport it has no place for), the model SHALL get the coach's text, the table as text (whenever the table was read), and the note.

#### Scenario: A table builds the Workout with no provider configured

- **GIVEN** an activity with a steps table, no Athlete note, and no AI provider configured
- **WHEN** the athlete clicks `[AI process]`, and later `[Regenerate]`
- **THEN** each time the Workout holds the table's steps and repeat with `aiMeta: null`; no model call is made; no AI progress is shown and no error

#### Scenario: A table the KRD cannot hold still reaches the AI

- **GIVEN** an activity whose table has a power value out of the KRD's range, and an Athlete note
- **WHEN** the Workout is built
- **THEN** the model is called with the coach's text, the table's rows as text, and the note

#### Scenario: The AI with no provider fails without writing

- **GIVEN** an activity with no steps table and no AI provider configured
- **WHEN** the athlete clicks `[AI process]`
- **THEN** nothing is written; the result is `{ ok: false, reason: "no-provider" }`; the dialog says no AI provider is configured

### Requirement: Coach's steps table in the coaching dialog

The coaching dialog SHALL show a Coaching Activity's steps table under the coach's text, as the coach wrote it (duration, zone, W, bpm, repeat blocks as "N ×" groups), in English and Spanish, whether or not its Workout is built. An activity without a table SHALL show none.

#### Scenario: The table is shown before and after the build

- **GIVEN** an activity with a steps table
- **WHEN** the athlete opens its dialog, builds the Workout and opens the dialog again
- **THEN** the table is shown both times, with its "4 ×" group
