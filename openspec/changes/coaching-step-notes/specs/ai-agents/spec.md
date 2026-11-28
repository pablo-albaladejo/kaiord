## ADDED Requirements

### Requirement: The workout parser carries step notes and their origin

The workout parser's wire schema SHALL carry each step's `notes` and `noteOrigin` (`"coach"` or `"ai"`), so the structured-output gate does not drop them. Validation SHALL cut a note to 256 characters before the domain parse and SHALL mark a step whose `noteOrigin` is `"ai"` as written by the AI on its own; `noteOrigin` itself SHALL NOT appear on the Workout.

#### Scenario: The coach's cue reaches the Workout

- **GIVEN** a model answer whose repeated step carries `notes: "Pedaleo a una pierna"`, `noteOrigin: "coach"`
- **WHEN** it passes the wire schema and validation
- **THEN** the Workout's step carries that note, with no AI mark

#### Scenario: A note the AI wrote on its own is marked

- **GIVEN** a model answer whose step carries `noteOrigin: "ai"`
- **WHEN** it is validated
- **THEN** the step is marked as an AI note

### Requirement: Step-notes agent

The `step-notes` agent SHALL write notes for a Workout whose steps are already built. Its answer SHALL be `{ notes: [{ step, text, origin }] }` and validation SHALL keep only a note whose `step` is a step number in range, the first one per step, its trimmed non-blank `text` cut to 256 characters, and its `origin`. Nothing else in the answer SHALL reach the caller. The message SHALL hold the coach's text and one numbered line per step, each fenced as data.

#### Scenario: A hostile answer cannot change a step

- **GIVEN** an answer whose entries also carry a duration, a target and a repeat count, a step number out of range and a second note for one step
- **WHEN** it is validated
- **THEN** only the in-range first note per step survives, with its `step`, `text` and `origin`
