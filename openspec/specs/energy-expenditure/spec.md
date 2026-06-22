> Synced: 2026-06-22 (energy-expenditure-activity-factor)

# energy-expenditure Specification

## Purpose

Defines per-day energy expenditure: basal metabolic rate (Mifflin-St Jeor, or Katch-McArdle when body-fat is known) plus activity, resolved as measured from ingested wellness or predicted from BMR plus a tiered expected-workout-kcal estimate. Anthropometric profile inputs (height, age, sex) gate the basal-derived path.
## Requirements
### Requirement: Anthropometric profile inputs

The profile SHALL support `height` (cm), `birthDate` (from which age is derived),
and `sex` (`male` | `female`), plus optional `restingHeartRate` and `activityLevel`.
Energy features that require basal-metabolic-rate estimation SHALL remain gated until
`height`, `birthDate`, and `sex` are present.

#### Scenario: BMR-dependent feature gated until profile complete

- **GIVEN** a profile with `bodyWeight` but no `height`, `birthDate`, or `sex`
- **WHEN** the user opens an expenditure or goal view
- **THEN** the system prompts to complete the physiological fields
- **AND** SHALL NOT display a basal-derived expenditure number

#### Scenario: Profile fields persisted

- **WHEN** the user saves `height`, `birthDate`, and `sex`
- **THEN** the values persist on the profile
- **AND** are available to the expenditure calculators on the next read

### Requirement: Basal metabolic rate estimation

The system SHALL estimate BMR using Katch-McArdle (`370 + 21.6 · leanBodyMass`) when
body-fat percentage is known from an ingested `BodyComposition` record, and
Mifflin-St Jeor (`10·kg + 6.25·cm − 5·age + (sex==='male' ? +5 : −161)`) otherwise.
The result SHALL record which formula was used.

#### Scenario: Katch-McArdle used when body fat is known

- **GIVEN** a profile with a `BodyComposition` record carrying body-fat percentage
- **WHEN** BMR is computed
- **THEN** the Katch-McArdle formula is applied over lean body mass
- **AND** the result records the formula as `katch-mcardle`

#### Scenario: Mifflin-St Jeor used when body fat is unknown

- **GIVEN** a profile with `height`, `birthDate`, and `sex` but no body-fat data
- **WHEN** BMR is computed
- **THEN** the Mifflin-St Jeor formula is applied
- **AND** the result records the formula as `mifflin-st-jeor`

### Requirement: Daily expenditure resolution

The system SHALL resolve a day's total energy expenditure as measured
(`restingCalories + activeCalories`) when a connection covers that day, and as
predicted (`BMR × activityFactor + expectedActivityKcal`) otherwise, where
`activityFactor` is the profile's activity-level NEAT multiplier
(`sedentary` 1.2, `light` 1.3, `moderate` 1.4, `active` 1.5, `very_active` 1.6;
defaulting to 1.2 when the activity level is unset). These NEAT factors cover
non-exercise daily movement only; scheduled-workout energy is added separately
via `expectedActivityKcal` and SHALL NOT be double-counted. Each resolved value
SHALL be labelled `measured`, `predicted`, or `mixed`. The measured path SHALL
ignore the activity factor.

#### Scenario: Measured expenditure from ingested wellness

- **GIVEN** a day with a `DailyWellness` record carrying `activeCalories` and `restingCalories`
- **WHEN** daily expenditure is resolved
- **THEN** expenditure equals `restingCalories + activeCalories`
- **AND** the value is labelled `measured`

#### Scenario: Predicted expenditure for an uncovered future day

- **GIVEN** a future day with no ingested wellness record
- **WHEN** daily expenditure is resolved
- **THEN** expenditure equals `BMR × activityFactor + expectedActivityKcal`
- **AND** the value is labelled `predicted`

#### Scenario: Moderate-activity rest day scales the basal by the NEAT factor

- **GIVEN** a profile with `activityLevel` = `moderate` and a computed `BMR` of 1750 kcal
- **WHEN** daily expenditure is resolved for a day with no scheduled workout (`expectedActivityKcal` = 0)
- **THEN** the predicted expenditure equals `1750 × 1.4` = 2450 kcal, not the raw 1750 kcal

#### Scenario: Scheduled workout kcal are not double-counted

- **GIVEN** a profile with `activityLevel` = `moderate` and a scheduled workout estimated at 500 `expectedActivityKcal`
- **WHEN** daily expenditure is resolved
- **THEN** the predicted expenditure equals `BMR × 1.4 + 500` — the workout kcal are added once on top of the NEAT-scaled basal and are NOT folded into the activity factor

### Requirement: Expected workout energy estimation

For a planned workout, the system SHALL estimate activity kcal using the first
applicable tier: (1) power-based `avgPower(W)·durationSec/1000` (kJ ≈ kcal),
(2) running distance `≈ 1 kcal/kg/km`, (3) `duration × MET × bodyweight` where MET
is resolved from a MET compendium via a `sport`/`subSport`→activity-code mapping.

#### Scenario: Power-based estimate for a cycling target

- **GIVEN** a planned cycling step with an average power target and duration
- **WHEN** expected activity kcal is estimated
- **THEN** the power tier is used and kcal equals `avgPower · durationSec / 1000`

#### Scenario: MET estimate when no power or distance is available

- **GIVEN** a planned strength session with only sport, intensity, and duration
- **WHEN** expected activity kcal is estimated
- **THEN** the MET tier is used with the sport's mapped compendium MET value and the bodyweight

