## ADDED Requirements

### Requirement: One daily-wellness reading per day

The SPA SHALL read a day's daily wellness as one reading combined from every
daily-wellness record of that day, without rewriting any of them. Every reader
(the energy balance, the Activity page, the steps trends, the calendar steps
badge and the chat health tool) SHALL use this one reading. The records SHALL
be ranked by the data type's effective source order when its source policy is
"priority" (`sourceOrder` restricted to enabled import policies, manual always
included), then the manual record, then by source id, then by record id, so
the reading is the same whatever order the records are stored in. Per field,
the first ranked record that provides it SHALL win; a manual record provides
only `steps`, so imported calories and intensity survive a manual steps entry.

#### Scenario: Manual steps and imported calories make one reading

- **GIVEN** a `garmin-bridge` daily record with 4000 steps, 650 active and 1750 resting kcal
- **AND** a manual daily record for the same day with 12000 steps
- **WHEN** the day's energy balance is resolved
- **THEN** it reads 12000 steps and the measured 650 + 1750 kcal

#### Scenario: The reading does not depend on storage order

- **GIVEN** an imported and a manual daily record of the same day
- **WHEN** the day is read with the records stored in either order
- **THEN** both reads give the same reading

#### Scenario: A priority source order decides the steps

- **GIVEN** a "priority" policy for daily wellness with `sourceOrder` `garmin-bridge`, `manual` and an enabled Garmin import
- **AND** a Garmin and a manual daily record of the same day
- **WHEN** the day is read
- **THEN** the steps are Garmin's
