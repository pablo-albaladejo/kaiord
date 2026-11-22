## ADDED Requirements

### Requirement: A shared file is split between register files by section

A file named by more than one register file SHALL be named by each with
`sections` or `keys`, and no section or key SHALL be named by two register
files. `scripts/check-claims.mjs` SHALL fail when a whole file is registered
in one register file and any part of it in another, or when one section or
key is registered in two.

#### Scenario: Two extensions register their own policy sections

- **WHEN** `claims/garmin.json` and `claims/trainingpeaks.json` each name a
  different section of `packages/docs/legal/privacy-policy.md`
- **THEN** `pnpm lint:claims` SHALL hold each section to its own register file

#### Scenario: One section is registered twice

- **WHEN** two register files name the same section of one file
- **THEN** `pnpm lint:claims` SHALL fail and name the section and the first
  owner

### Requirement: Kaiord for TrainingPeaks texts are registered

The TrainingPeaks `extDescription`, the Short and Detailed Description of its
store listing, its permission justifications and its privacy-policy section
SHALL be registered surfaces in `claims/trainingpeaks.json`. They SHALL state
that the extension writes Workouts to the athlete's TrainingPeaks calendar,
that the access token may be kept in the athlete's browser and never travels
to Kaiord, and that each session check mints and stores a token, while the
code does so.

#### Scenario: A token reaches the Kaiord App

- **WHEN** any external action's answer would contain the access token
- **THEN** `packages/trainingpeaks-bridge/test/token-confinement.test.js`
  SHALL fail

#### Scenario: The session check stops minting a token

- **WHEN** checking the session no longer mints and stores a token
- **THEN** the confinement test proving that sentence SHALL fail, so the
  texts are rewritten with the code
