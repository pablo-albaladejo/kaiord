## ADDED Requirements

### Requirement: Workout export route to TrainingPeaks

`bridgeSupportsRoute` SHALL report `workout`/`export` as supported for
`trainingpeaks-bridge`, by narrowing `SUPPORTED_EXPORT_TYPES` from `[]` to
`["workout"]`. The key SHALL be edited, never deleted: per the module's stated
invariant an absent key means "unrestricted", so removing it would silently
offer the bridge every export route including the `write:body` one the SPA
does not cable.

#### Scenario: Workout export becomes eligible

- **WHEN** the Connections page resolves export routes for `trainingpeaks-bridge`
- **THEN** `workout` SHALL be offered and no other data type SHALL be

### Requirement: Push is governed by the shared export gate

The SPA SHALL push to TrainingPeaks through `executeWorkoutPush` with
`destinationBridgeId: "trainingpeaks-bridge"`, so the export policy is checked
inside the action and the push is recorded in the export ledger. No active,
enabled export route SHALL mean the push never reaches the bridge, surfacing
`NoActiveExportRouteError` rather than a silent no-op.

#### Scenario: Disabled route fails closed

- **GIVEN** no enabled export policy row for `(profileId, "workout", "trainingpeaks-bridge")`
- **WHEN** the user triggers the TrainingPeaks push
- **THEN** the push SHALL fail with a visible cause and SHALL NOT reach the extension

#### Scenario: Re-push is idempotent

- **GIVEN** a workout already pushed to TrainingPeaks with unchanged content
- **WHEN** the user pushes it again
- **THEN** the export ledger SHALL recognise the prior push rather than creating a duplicate

### Requirement: Athlete id comes from a live session probe

The push SHALL resolve the TrainingPeaks athlete id by calling `checkSession`
on the bridge immediately before building the payload, not from persisted
state, because that is the id the bridge will write against. An unauthenticated
probe SHALL abort the push with a re-login prompt instead of sending a payload
that cannot be attributed.

#### Scenario: Dead session aborts before the write

- **GIVEN** the TrainingPeaks session has expired
- **WHEN** the user triggers the push
- **THEN** the SPA SHALL report that the athlete must sign in, and SHALL NOT send `push-workout`

### Requirement: Profile thresholds are converted into KRD units

TrainingPeaks expresses intensity as a percentage of a threshold, so the
converter divides KRD's absolute targets by the athlete's thresholds. The
profile stores `thresholdPace` as a PACE (`min_per_km` or `min_per_100m`) while
KRD pace targets are a SPEED in metres per second; the SPA SHALL convert
between them explicitly. A `thresholdPace` without its `paceUnit` SHALL yield
no threshold rather than a wrongly-scaled one, and `lthr` — a lactate
threshold, not a ceiling — SHALL NOT be substituted for maximum heart rate.

#### Scenario: Pace threshold is converted, not passed through

- **GIVEN** a profile whose running `thresholdPace` is 4 with unit `min_per_km`
- **WHEN** thresholds are built for a running workout
- **THEN** `thresholdPaceMps` SHALL be the equivalent speed in metres per second

#### Scenario: Unitless pace threshold is dropped

- **GIVEN** a profile whose `thresholdPace` is set but `paceUnit` is absent
- **WHEN** thresholds are built
- **THEN** `thresholdPaceMps` SHALL be undefined, and the converter SHALL warn for each pace target it consequently drops
