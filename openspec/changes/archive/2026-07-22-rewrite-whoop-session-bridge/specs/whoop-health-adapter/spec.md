## ADDED Requirements

### Requirement: Internal-API response schemas

`@kaiord/whoop` SHALL define Zod schemas for the WHOOP internal-API responses it
reads: `core-details-bff/v0/cycles/details` (the per-cycle `records` array with
`cycle`, `recovery`, `sleeps`, and `workouts`), `metrics-service/v1/metrics/user/{id}`
(a `{ name, start, values: [{ data, time }] }` time series),
`activities-service/v1/sports/history` (the sport catalog, `id → name/category`),
and the Advanced-Labs `biomarker-tests` list and per-test payloads. Each schema
SHALL reject a payload missing a required field, and the cycles schema SHALL
tolerate the response being either a bare array or a records-wrapped object.

#### Scenario: Cycles/details payload validates both shapes

- **GIVEN** a `cycles/details` response as a bare array and, separately, as `{ records: [...] }`, each first record exposing `cycle`, `recovery`, and `sleeps`
- **WHEN** parsed via the cycles/details schema
- **THEN** both validate and expose the same typed record shape

#### Scenario: Missing required recovery field rejected

- **GIVEN** a record whose `recovery` omits `hrv_rmssd`
- **WHEN** parsed via the cycles/details schema
- **THEN** validation fails

### Requirement: Recovery converts to HRV

`@kaiord/whoop` SHALL provide a pure converter from a WHOOP `recovery` object to
`extensions.health.hrv`: `kind: "hrv"`, `measuredAt` from the recovery
timestamp, `measurementWindow: "overnight"`, `score` from `recovery_score`
(0–100), and `rMSSD` in milliseconds computed as `hrv_rmssd * 1000` (WHOOP
reports RMSSD in seconds). It SHALL be a pure function performing no I/O and
SHALL set `sourceBridgeId: "whoop-bridge"`. (SpO₂, skin temperature, and resting
heart rate from the same recovery are carried by the per-cycle vitals converter
below, not here.)

#### Scenario: Recovery maps to overnight HRV

- **GIVEN** a recovery `{ hrv_rmssd: 0.0571, recovery_score: 66, resting_heart_rate: 55, created_at: "2026-07-10T17:59:12.250Z" }`
- **WHEN** converted to `extensions.health.hrv`
- **THEN** the result SHALL have `rMSSD` ≈ `57.1` (ms, ±1 ms), `measurementWindow: "overnight"`, `score: 66`, and `sourceBridgeId: "whoop-bridge"`

#### Scenario: rMSSD unit conversion is milliseconds

- **GIVEN** a recovery with `hrv_rmssd: 0.045`
- **WHEN** converted to HRV
- **THEN** `rMSSD` SHALL equal `45` milliseconds (±1 ms), never `0.045`

### Requirement: Sleep converts to sleep record

`@kaiord/whoop` SHALL provide a pure converter from a WHOOP `sleeps[]` entry to
`extensions.health.sleep` — `startTime`/`endTime` from the sleep `during`
interval, `totalDurationSeconds` from the sleep quality duration (ms → s),
optional `score`, optional `restingHeartRate`, and a `stages` array derived
from the WHOOP stage durations (`light_sleep_duration → light`,
`slow_wave_sleep_duration → deep`, `rem_sleep_duration → rem`,
`wake_duration → awake`) whose sum is within ±60 s of `totalDurationSeconds`.
It SHALL set `sourceBridgeId: "whoop-bridge"`. (The sleep `respiratory_rate` is
carried by the per-cycle vitals converter below, not here.)

#### Scenario: Sleep maps with stages

- **GIVEN** a WHOOP sleep with a valid `during` interval, `score: 90`, and non-zero light/deep/rem/wake durations
- **WHEN** converted to `extensions.health.sleep`
- **THEN** the result SHALL have `kind: "sleep"`, a populated `startTime`/`endTime`, `score: 90`, and one `stages` entry per non-zero WHOOP stage using the KRD stage names, summing within ±60 s of `totalDurationSeconds`

#### Scenario: Total duration is seconds

- **GIVEN** a WHOOP sleep whose quality duration is `28492370` milliseconds
- **WHEN** converted
- **THEN** `totalDurationSeconds` SHALL be `28492` (±1 s), not the millisecond value

### Requirement: Cycle converts to a single vitals summary

`@kaiord/whoop` SHALL provide a pure converter that produces exactly ONE
`extensions.health.vitals` payload per cycle, folding the daily vitals WHOOP
scatters across the cycle's `recovery` and `sleeps`: `spo2Percent` from
`recovery.spo2`, `skinTempCelsius` from `recovery.skin_temp_celsius`,
`restingHeartRate` from `recovery.resting_heart_rate`, and `respiratoryRate`
from the cycle's sleep `respiratory_rate`. `measuredAt` SHALL be the recovery
timestamp. Absent source fields are simply omitted (the sub-schema requires at
least one). It SHALL set `sourceBridgeId: "whoop-bridge"`. A single vitals
record per cycle avoids two vitals payloads colliding on the same identity.

#### Scenario: Cycle maps to one vitals record

- **GIVEN** a cycle whose `recovery` has `spo2: 96`, `skin_temp_celsius: 35.4`, `resting_heart_rate: 55` and whose sleep has `respiratory_rate: 17.05`
- **WHEN** converted to `extensions.health.vitals`
- **THEN** exactly one payload SHALL be produced carrying `spo2Percent: 96`, `skinTempCelsius: 35.4`, `restingHeartRate: 55`, and `respiratoryRate` ≈ `17.05` (±0.1 rpm)

#### Scenario: Missing vitals fields are omitted

- **GIVEN** a cycle whose `recovery.spo2` is null and whose sleep lacks a respiratory rate
- **WHEN** converted
- **THEN** the single vitals payload SHALL omit `spo2Percent` and `respiratoryRate` while still carrying the present fields, and SHALL remain schema-valid

### Requirement: Cycle converts to strain summary

`@kaiord/whoop` SHALL provide a pure converter from a WHOOP `cycle` object to
`extensions.health.strain`: `date` from the cycle day, `strainScore` from
`scaled_strain` (0–21), `dayAverageHeartRate` from `day_avg_heart_rate`,
`dayMaxHeartRate` from `day_max_heart_rate`, and `energyKilojoules` from
`day_kilojoules`, with `sourceBridgeId: "whoop-bridge"`.

#### Scenario: Cycle maps to strain

- **GIVEN** a cycle `{ scaled_strain: 5.36, day_avg_heart_rate: 58, day_max_heart_rate: 127, day_kilojoules: 7045, days: "['2026-07-10', ...)" }`
- **WHEN** converted to `extensions.health.strain`
- **THEN** the result SHALL have `strainScore` ≈ `5.36`, `dayAverageHeartRate: 58`, `dayMaxHeartRate: 127`, `energyKilojoules: 7045`, and `date: "2026-07-10"`

### Requirement: Metrics series converts to heart-rate series

`@kaiord/whoop` SHALL provide a pure converter from a WHOOP `metrics-service`
`heart_rate` response (`{ name, start, values: [{ data, time }] }`) to
`extensions.health.heartRateSeries`. Because the response does not echo the
sampling step, the converter SHALL take the requested `stepSeconds` as an
explicit argument and set `intervalSeconds` from it. `startTime` SHALL be the
first sample's `time`. `samples` SHALL be built by walking the time grid at
`stepSeconds`: each slot takes the `data` of the value at that timestamp, or
`null` when no value falls in the slot (a gap). It SHALL set `sourceBridgeId:
"whoop-bridge"`.

#### Scenario: HR metrics map to a uniform series

- **GIVEN** `stepSeconds` 600 and a response `{ start: t0, values: [{ data: 75, time: t0 }, { data: 68, time: t0+600000 }] }`
- **WHEN** converted to `extensions.health.heartRateSeries`
- **THEN** the result SHALL have `intervalSeconds: 600`, `samples: [75, 68]`, and `startTime` at `t0`

#### Scenario: Missing slot becomes a null gap

- **GIVEN** `stepSeconds` 600 and values at `t0` and `t0+1200000` with no value at `t0+600000`
- **WHEN** converted
- **THEN** `samples` SHALL be `[75, null, 68]`, preserving the gap slot as `null`

### Requirement: Workouts convert to activity summaries

`@kaiord/whoop` SHALL provide a pure converter from a WHOOP `workouts[]` entry
(within a cycle) to a KRD `activity` — `summary.date`/`start_time` from the
workout `during`, `summary.sport` resolved from `sport_id` via the sports
catalog, `summary.duration_seconds` from the interval, `summary.avg_heart_rate`
from `average_heart_rate`, `summary.total_calories` from `kilojoules` (kJ →
kcal), `summary.source: "whoop"`, and `summary.source_id` from the workout
`activity_id`. An unknown `sport_id` SHALL fall back to a generic sport label,
never fail the conversion.

#### Scenario: Workout maps to an activity summary

- **GIVEN** a WHOOP workout with `sport_id: 63`, `average_heart_rate: 89`, `kilojoules: 159.9`, and a valid `during`, plus a sports catalog mapping `63 → "Walking"`
- **WHEN** converted to `activity`
- **THEN** the `summary` SHALL have `sport: "Walking"`, `avg_heart_rate: 89`, a positive `duration_seconds`, `source: "whoop"`, and `source_id` equal to the workout `activity_id`

#### Scenario: Unknown sport id falls back

- **GIVEN** a workout whose `sport_id` is absent from the catalog
- **WHEN** converted
- **THEN** the conversion SHALL succeed with a generic sport label, not throw

### Requirement: Advanced-Labs biomarkers convert to lab reports

`@kaiord/whoop` SHALL provide a pure converter from a WHOOP biomarker test
(metadata plus its biomarker values) to a KRD `LabReport` and its `LabValue`
rows: `LabReport.date` from the test `test_date`, `labName` from the test
`upload_source` when present, `provenance` marking the WHOOP origin, and one
`LabValue` per biomarker carrying the verbatim label, numeric value, unit, and
printed reference range. Canonical parameter mapping SHALL follow the existing
labs rule: a WHOOP biomarker maps to a catalog parameter only by exact
catalog/alias match, otherwise it becomes a `custom:<slug>` row; no value SHALL
be dropped.

#### Scenario: Biomarker test maps to a lab report

- **GIVEN** a WHOOP biomarker test dated `2025-12-10` with N biomarker values, each with a label, value, unit, and printed range
- **WHEN** converted
- **THEN** one `LabReport` dated `2025-12-10` SHALL be produced with N `LabValue` rows, each mapped to a catalog parameter or a `custom:<slug>` row, and none dropped

### Requirement: Every converted record carries a stable external identity

Every converter SHALL stamp a deterministic `externalId` on its output so the SPA
can upsert by `(sourceBridgeId, externalId)` without duplicates across re-syncs.
The identity SHALL derive only from stable source fields, per type:

- HRV, vitals, strain (cycle-scoped, one per cycle): `cycle:{cycle.id}:{kind}`
  (e.g. `cycle:1629599351:hrv`).
- Sleep: the sleep `activity_id`.
- Activity (workout): the workout `activity_id`.
- Heart-rate series: `hr:{userId}:{localDate}` for the day the series covers.
- Lab report: the WHOOP biomarker `test.id`.

When a required source id is absent, the converter SHALL derive a deterministic
composite from the available stable fields (e.g. `{cycle.id}:{during.start}:{sport_id}`
for a workout), never a random id.

#### Scenario: Re-converting the same cycle yields the same ids

- **GIVEN** the same cycle converted twice
- **WHEN** the HRV, vitals, and strain payloads are produced each time
- **THEN** their `externalId` values SHALL be identical across both conversions

#### Scenario: Distinct cycle-scoped records do not collide

- **WHEN** the HRV, vitals, and strain payloads for one cycle are produced
- **THEN** each SHALL carry a distinct `externalId` (differing by the `{kind}` suffix), so none overwrites another on upsert

### Requirement: Adapter is pure with the transport injected

`@kaiord/whoop` SHALL NOT perform OAuth, SHALL NOT own an HTTP client, and SHALL
NOT target the developer API (`/developer/v2/*`). Any service that fetches SHALL
receive its read transport by injection, keeping the package a `core`-only
adapter. The developer-API recovery/sleep schemas and converters SHALL NOT be
exported.

#### Scenario: No developer-API surface remains

- **WHEN** the package's public exports are inspected
- **THEN** they SHALL expose the internal-API schemas and the converters (HRV, vitals, sleep, strain, heart-rate series, activity, lab), and SHALL NOT expose developer-API (`/v2/recovery`, `/v2/activity/sleep`) schemas, converters, or an OAuth client

#### Scenario: Service takes an injected transport

- **WHEN** a WHOOP read service is constructed
- **THEN** it SHALL accept its transport as a dependency and SHALL perform no network or OAuth I/O of its own
