## ADDED Requirements

### Requirement: One daily-wellness reading per day

The SPA SHALL read a day's daily wellness as one reading combined from the
daily-wellness records of that day, without rewriting any of them. The reading
is not a stored record: it carries the head record's id and provenance. Every
reader (the energy balance, the Activity page, the steps trends, the calendar
steps badge and the chat health tool) SHALL use this one reading.

The records SHALL be ranked by the data type's effective source order when its
source policy is "priority" (`sourceOrder` restricted to enabled import
policies, manual always included), then the manual record, then by source id,
then by record id, so the reading is the same whatever order the records are
stored in. The head is the first ranked record that is not a pure manual
record, and it SHALL be read whole, as `resolveEffectiveSource` reads
priority: a field the head lacks (such as `floorsClimbed`) SHALL NOT be filled
from a lower-ranked record. The one field-level exception is `steps`: a pure
manual record holds only `steps`, and when it ranks above the head its steps
replace the head's. A day with only a pure manual record reads only its steps,
so it has no measured calories.

A legacy manual record is an imported record that a manual steps save made
before this change re-stamped `manual`. It is told apart by any non-zero
`activeCalories`, `restingCalories`, intensity minutes or `floorsClimbed`, and
it SHALL be read as a full record (its calories count). A new manual steps
save on that day SHALL keep its measured values and replace only `steps`; this
also covers a device that syncs such a record back after the change.

Under "priority", records of a bridge whose import policy for daily wellness is
disabled SHALL be dropped. A source with no import policy at all (a FIT file
import, `fit-import`) SHALL stay as a fallback ranked after the listed sources.
This differs from `resolveEffectiveSource`, which considers only listed
sources: FIT imports are the main producer of daily-wellness records and have
no import policy, so they never survive in the effective source order, and
dropping them would leave every FIT-imported day blank under priority.

#### Scenario: Manual steps and imported calories make one reading

- **GIVEN** a `fit-import` daily record with 4000 steps, 650 active and 1750 resting kcal
- **AND** a manual daily record for the same day with 12000 steps
- **WHEN** the day's energy balance is resolved
- **THEN** it reads 12000 steps and the measured 650 + 1750 kcal, with the `fit-import` record's provenance

#### Scenario: The reading does not depend on storage order

- **GIVEN** an imported and a manual daily record of the same day
- **WHEN** the day is read with the records stored in any order
- **THEN** every read gives the same reading

#### Scenario: Priority reads the first source whole

- **GIVEN** a "priority" policy for daily wellness with `sourceOrder` `whoop-bridge`, `fit-import` and an enabled WHOOP import
- **AND** a WHOOP daily record without `floorsClimbed` and a `fit-import` record with 12 floors for the same day
- **WHEN** the day is read
- **THEN** the reading is the WHOOP record, with no `floorsClimbed`

#### Scenario: Manual steps lose when the priority order leaves manual out

- **GIVEN** a "priority" policy with `sourceOrder` `whoop-bridge` and an enabled WHOOP import
- **AND** a WHOOP and a manual daily record of the same day
- **WHEN** the day is read
- **THEN** the steps are WHOOP's

#### Scenario: A source with no import policy stays as a fallback

- **GIVEN** a "priority" policy with `sourceOrder` `whoop-bridge`
- **AND** a day whose only daily record is a `fit-import` record
- **WHEN** the day is read
- **THEN** the reading is the `fit-import` record

#### Scenario: A disabled bridge is not read

- **GIVEN** a "priority" policy whose WHOOP import policy is disabled
- **AND** a WHOOP daily record of the day
- **WHEN** the day is read
- **THEN** the WHOOP record does not contribute to the reading

#### Scenario: A legacy manual record keeps its calories

- **GIVEN** a manual daily record with 9500 steps, 640 active and 1720 resting kcal, written by a save before this change
- **WHEN** the day is read, and when the user saves 12000 steps for that day
- **THEN** the reading has 640 + 1720 kcal, and after the save the record holds 12000 steps with the same calories

#### Scenario: A manual-only day is predicted, not measured as 0 kcal

- **GIVEN** a day whose only daily record is a manual steps entry
- **WHEN** the day's energy balance is resolved
- **THEN** the expenditure is predicted from BMR, as for a day with no daily record
