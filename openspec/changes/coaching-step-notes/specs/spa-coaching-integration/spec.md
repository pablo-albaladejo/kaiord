## ADDED Requirements

### Requirement: Step notes from a Coaching Activity

A Workout built from a Coaching Activity SHALL keep the coach's cue for each stretch as that step's note, written in the coach's language. The coach's full text SHALL stay the Workout-level note.

When the Workout is read from the steps table (a table that becomes a Workout and no Athlete note) and an AI provider is configured, a notes-only call SHALL write each step's note from the coach's text; it SHALL NOT change any duration, target or repeat. Each step's note SHALL read the cue first, then the step's HR range, within the 200 characters a Garmin step description takes; when they run over, the cue SHALL be cut, never the HR range. With no provider configured no call SHALL be made and each step keeps its HR range alone. When the call fails, the Workout SHALL still be created with the table's steps and HR ranges and the dialog SHALL say the notes could not be added; Regenerate tries again and rewrites every note.

A note the AI wrote on its own, with no cue from the coach behind it, SHALL carry an "AI" label on the step card and on the step's note field; a cue taken from the coach's text, even shortened, SHALL carry none. Editing the note SHALL remove the label. The label SHALL never reach a device.

#### Scenario: The coach's cue lands on the table's steps

- **GIVEN** a Coaching Activity whose text asks for 3 x 30 s single-leg pedalling and whose steps table holds three 30 s steps, and an AI provider
- **WHEN** the Workout is built
- **THEN** each 30 s step's note reads the single-leg cue followed by its HR range, and the steps, targets and repeats are the table's

#### Scenario: The notes call fails

- **GIVEN** a Coaching Activity with a steps table, an AI provider, and a notes call that fails
- **WHEN** the Workout is built
- **THEN** it is created with the table's steps and each step's HR range as its note, and a notice says the step notes could not be added

#### Scenario: The Athlete note changes the notes on Regenerate

- **GIVEN** a Workout built from a steps table and an Athlete note added afterwards
- **WHEN** the athlete regenerates it
- **THEN** the AI builds the Workout with the note, and its step notes follow the note

#### Scenario: Editing an AI note removes its label

- **GIVEN** a step whose note the AI wrote on its own
- **WHEN** the athlete edits the note and saves the step
- **THEN** the step no longer carries the AI label
