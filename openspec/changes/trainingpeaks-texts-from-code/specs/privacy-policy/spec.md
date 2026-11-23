## ADDED Requirements

### Requirement: The TrainingPeaks section discloses every write

The `## Kaiord for TrainingPeaks Extension` section of the privacy policy
SHALL disclose that the extension adds each Workout the athlete sends from the
Kaiord App to their TrainingPeaks calendar, that it cannot delete anything in
TrainingPeaks or change a Workout already there, that it accepts a weight
write the Kaiord App does not send today, that every check of the sign-in
mints and stores a new token, and the `read:body`, `write:body` and
`write:workouts` capabilities. `check-privacy-policy` SHALL hold one rule per
disclosure, anchored to that section.

#### Scenario: The Workout write is removed from the section

- **WHEN** the sentence disclosing the Workout write is removed from the
  TrainingPeaks section
- **THEN** `check-privacy-policy` SHALL fail on that rule alone
