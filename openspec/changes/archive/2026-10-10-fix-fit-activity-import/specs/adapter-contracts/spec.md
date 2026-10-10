## ADDED Requirements

### Requirement: FIT reader maps recorded activities from the SDK-decoded message shape

The `@kaiord/fit` reader SHALL map activity FIT files from the messages as the `@garmin/fitsdk` `Decoder` returns them by default: `date_time` fields as `Date`, scaled fields already in profile units (it SHALL NOT rescale them), and enums as profile names. A `record` without a `timestamp` SHALL be dropped with a logged warning. Every activity fixture in `test-fixtures/fit/` SHALL have a real-decoder test validated against `krdSchema`.

#### Scenario: Activity file with decoder Dates imports

- **GIVEN** `test-fixtures/fit/Activity.fit`, whose session, lap, record and event messages carry `timestamp`/`startTime` as `Date`
- **WHEN** the FIT reader is invoked
- **THEN** it returns a `recorded_activity` KRD that passes `krdSchema`, with `sessions[0].startTime` equal to `2021-07-20T21:11:20.000Z` and `sessions[0].totalElapsedTime` equal to `3601`

#### Scenario: Pool swim lap stroke name is mapped

- **GIVEN** `activity_poolswim_with_hr.fit`, whose first lap carries `swimStroke: "freestyle"`
- **WHEN** the FIT reader is invoked
- **THEN** `laps[0].swimStroke` is `freestyle`

#### Scenario: Records without a timestamp are dropped

- **GIVEN** `DeveloperData.fit`, whose three `record` messages carry no `timestamp`
- **WHEN** the FIT reader is invoked
- **THEN** it returns a `recorded_activity` KRD with no records and logs a warning naming the dropped count
