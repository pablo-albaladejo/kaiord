## ADDED Requirements

### Requirement: The coaching dialog estimates a zone profile from the coach's text

The coaching dialog SHALL estimate a zone profile from the activity's
description when it has no structured zone profile to draw (no linked workout,
or a linked workout without a structured KRD). The estimate SHALL read only explicit zones
(`Z1`–`Z5`, `zona N`, `zone N`), RPE values, and one fixed table of
intensity words that does not depend on the athlete, and SHALL NOT read the
activity's `effort` rating. A range SHALL resolve to its lower bound; a
progression between two different zones SHALL set no zone. Repeat notation
SHALL expand into one segment per step.

A timed segment with no zone SHALL be drawn as a neutral bar of its true
width. No chart SHALL render when no segment has a zone, a segment is
measured by distance, or a stated total differs from the breakdown by more
than max(5 minutes, 15% of the stated total). A rendered
estimate SHALL carry the caption "Estimated from coach text", and its
accessible label SHALL say it is an estimate. The estimate SHALL appear only in
the dialog, never on the calendar card or its zone border.

#### Scenario: Explicit zones and repeats are drawn as an estimate

- **GIVEN** an unprocessed coaching plan whose description is "12' Z1, 4x(3' Z4 + 2' Z1), 10' Z1"
- **WHEN** its dialog opens
- **THEN** the dialog SHALL draw a profile totalling 42 minutes with the caption "Estimated from coach text"

#### Scenario: An unzoned segment is drawn as a neutral gap

- **GIVEN** a description "10' z1 + 30' contrastes"
- **WHEN** its dialog opens
- **THEN** the dialog SHALL draw a 10-minute Z1 bar followed by a 30-minute neutral bar

#### Scenario: A distance segment hides the estimate

- **GIVEN** a description "20' z1, 3x(1K progresivo + 2' trote)"
- **WHEN** its dialog opens
- **THEN** no zone profile SHALL render

#### Scenario: A structured workout wins over the text

- **GIVEN** a plan linked to a workout with a structured KRD
- **WHEN** its dialog opens
- **THEN** the dialog SHALL draw the KRD's profile without the estimate caption
