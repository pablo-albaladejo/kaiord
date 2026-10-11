## MODIFIED Requirements

### Requirement: Manual wellness entry

The wellness entry surface SHALL offer a manual entry form with labeled fields for **weight**, **sleep hours** (h:mm), **sleep score**, **bedtime**, **wake time**, **HRV**, and **steps**, and an **"Import a file"** action for FIT health files. Its copy SHALL be localized. The form SHALL have a single Save button that persists every filled field in one submission; empty fields SHALL write nothing. When a metric value is saved, the SPA SHALL persist a schema-valid KRD record for the active profile and the clicked day; the live wellness query SHALL cause the corresponding badge to appear on that calendar day after it refreshes. No user-entered metric value SHALL appear in any toast message.

When the user saves a metric for a day that already has a record for that metric, the prior record SHALL be replaced — exactly one record remains for that date and metric. For **steps specifically**, only the `steps` value is replaced; any prior `activeCalories`, `restingCalories`, and `intensityMinutes` fields in the existing daily-wellness record are preserved (merge-preserve, not clobber).

A sleep entry SHALL take its duration from the hours slept, or from bedtime → wake time when only those are given; the wake time falls on the entry's day and the bedtime on the evening before when it is not earlier than the wake time. A sleep score alone SHALL be stored without a duration. The SPA SHALL NOT write a sleep record of zero length: malformed hours, a single clock time without hours, or hours that disagree with bedtime → wake time by more than 60 s SHALL show an inline error and write nothing. A sleep record whose duration is absent or `0` SHALL be shown as "duration not recorded", never as 0 h.

Each per-metric health page (`/health/sleep`, `/health/weight`, `/health/recovery`, `/health/activity`) SHALL offer an "Add data" action that opens the same wellness entry surface for today (the local calendar day), focused on that page's metric (sleep hours, weight, HRV, steps). The health pages' date windows SHALL use local calendar days.

When the user uses "Import a file", the imported health record SHALL be dated by the FIT file's own date — NOT the clicked day — and the user SHALL land on the corresponding Health Hub page. Empty fields write nothing to persistence.

#### Scenario: Wellness surface offers a manual form and an import action

- **WHEN** the wellness entry surface opens for a given day
- **THEN** it shows labeled input fields for weight, sleep hours, sleep score, bedtime, wake time, HRV, and steps, a single Save button, and an "Import a file" action

#### Scenario: Saving a metric value persists a KRD record and shows a badge

- **WHEN** the user enters a weight value and saves
- **THEN** a schema-valid KRD weight record for the active profile and clicked day is persisted, and the weight badge appears in that day's wellness band after the live query refreshes

#### Scenario: Saving a metric for a day that already has it replaces the prior record

- **GIVEN** a weight record already exists for a given day
- **WHEN** the user enters a new weight value and saves
- **THEN** exactly one weight record remains for that date and the displayed value reflects the new entry

#### Scenario: Saving steps preserves prior calories and intensity

- **GIVEN** a daily-wellness record exists for a day with `activeCalories: 300` and `intensityMinutes.moderate: 20` (from a prior import or save)
- **WHEN** the user enters a new steps value and saves
- **THEN** the persisted record has the new steps value AND retains `activeCalories: 300` and `intensityMinutes.moderate: 20`

#### Scenario: Empty fields write nothing

- **GIVEN** the user opens the wellness entry surface and leaves all fields empty
- **WHEN** the user clicks Save
- **THEN** no KRD records are written and no badge appears

#### Scenario: Partial entry saves only filled fields

- **GIVEN** the user enters a weight value and leaves HRV, sleep, and steps empty
- **WHEN** the user clicks Save
- **THEN** exactly one KRD record (weight) is persisted and no records for HRV, sleep, or steps are written

#### Scenario: No user-entered metric value appears in a toast

- **WHEN** the user saves a wellness metric
- **THEN** any success toast contains only a static message with no interpolated metric value

#### Scenario: Import a file uses the FIT file's date, not the clicked day

- **WHEN** the user chooses "Import a file" from the wellness entry surface and imports a FIT health file whose internal date is different from the clicked calendar day
- **THEN** the persisted record is dated by the FIT file's own date, the user lands on the corresponding Health Hub page, and no record is written for the clicked day's date

#### Scenario: Hours slept are stored as the night's duration

- **WHEN** the user enters sleep hours `7:30` and a sleep score `81` and saves
- **THEN** the persisted sleep record has `totalDurationSeconds: 27000` and `score: 81`, and `/health/sleep` shows the night as 7 h 30 min

#### Scenario: A sleep score alone is not a 0 h night

- **WHEN** the user enters only a sleep score `81` and saves
- **THEN** the persisted sleep record has `score: 81` and no `totalDurationSeconds`, and `/health/sleep` shows "duration not recorded" with the score

#### Scenario: Hours that disagree with the clock times are refused

- **WHEN** the user enters sleep hours `8:00`, bedtime `23:00` and wake time `06:30` and saves
- **THEN** an inline error explains the mismatch and no sleep record is written

#### Scenario: Health pages open manual entry on their metric

- **WHEN** the user activates "Add data" on `/health/recovery`
- **THEN** the wellness entry surface opens for today with focus on the HRV field

## ADDED Requirements

### Requirement: Daily readiness names the inputs it was built from

The Daily readiness card SHALL derive its composite score only from the HRV score and the sleep score that are present, and its rationale SHALL name exactly those inputs: overnight HRV and sleep, HRV alone, or the sleep score alone. When the sleep record's source is manual entry, the rationale SHALL say the sleep score was entered by the user, and SHALL NOT attribute the score to overnight HRV when no HRV score contributed. The sleep stat SHALL show "—" when the night's duration was not recorded.

#### Scenario: A typed-in sleep score alone is not credited to HRV

- **GIVEN** the day has a manual sleep record with `score: 81` and no HRV score
- **WHEN** Daily renders the readiness card for that day
- **THEN** the score is 81 and the rationale reads "Based on the sleep score you entered." and does not mention overnight HRV

#### Scenario: Device HRV and a typed-in sleep score are both named

- **GIVEN** the day has a device HRV score and a manual sleep score
- **WHEN** Daily renders the readiness card for that day
- **THEN** the rationale reads "Based on your overnight HRV and the sleep score you entered."
