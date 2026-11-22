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
- **THEN** `workout` SHALL be offered, and no other data type SHALL be offered for that bridge

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

### Requirement: The live copy is read before a re-send

TrainingPeaks is create-only for Kaiord, so the export ledger row keyed by
`(kaiordRecordId, "trainingpeaks-bridge")` is the record of what Kaiord
created there. Before sending a workout that row already confirms, the SPA
SHALL read that one workout by its recorded id through the bridge's
`read-workout` action. Only a `404` SHALL mean the copy is gone: the row is
then marked `forceRepush`, so the send creates the workout again without the
re-push block. Any other answer — present, a server error, a timeout, an
extension too old to know the action — SHALL keep the existing decision, so
a re-send never adds a second copy silently.

#### Scenario: Sending twice leaves one

- **GIVEN** a workout sent to TrainingPeaks and still there, unchanged
- **WHEN** the athlete sends it again
- **THEN** TrainingPeaks SHALL still hold one copy of it

#### Scenario: A copy the athlete deleted is sent again

- **GIVEN** a workout Kaiord sent whose copy the athlete deleted on TrainingPeaks
- **WHEN** the athlete sends it again, changed or not
- **THEN** the SPA SHALL send it without the re-push block, and TrainingPeaks SHALL hold one copy

#### Scenario: An unreadable copy is assumed present

- **GIVEN** a workout Kaiord sent, and a read of its copy that fails with anything but a `404`
- **WHEN** the athlete sends it again unchanged
- **THEN** the SPA SHALL add nothing to TrainingPeaks

### Requirement: The planning horizon is stated before sending

The SPA cannot know the athlete's TrainingPeaks account type: the token
exchange does not report it, and reading it would take a request that
downloads the athlete's profile. For a workout dated after tomorrow (the
browser's date), the send control SHALL therefore state, before any request,
that a Basic account accepts only today and tomorrow and that TrainingPeaks
may refuse the day, without claiming the athlete's account is Basic. The
control SHALL stay enabled. A `402` from the workout write SHALL be shown
with the same reason and one fix (schedule the workout for today or
tomorrow), in the athlete's language, rather than the raw error text.

#### Scenario: A later day is announced before sending

- **GIVEN** a workout dated two days after today
- **WHEN** the send control is shown
- **THEN** it SHALL state the Basic account limit, and nothing SHALL have been sent

#### Scenario: Today and tomorrow carry no notice

- **GIVEN** a workout dated today or tomorrow
- **WHEN** the send control is shown
- **THEN** no planning-horizon notice SHALL be shown

#### Scenario: The refusal names the same reason

- **WHEN** TrainingPeaks answers the workout write with `402`
- **THEN** the SPA SHALL show the planning-horizon explanation, not the bridge's message

### Requirement: An unanswered session check is not a sign-in prompt

When the bridge's `checkSession` reports `authenticated: false` with
`needsReauth: false`, TrainingPeaks failed to answer rather than reporting a
dead session. The push SHALL then say that TrainingPeaks is not answering,
with Try again as the fix, and SHALL NOT ask the athlete to sign in. An
older bridge that omits `needsReauth` keeps the sign-in prompt.

#### Scenario: A server error does not ask for a sign-in

- **GIVEN** a `checkSession` answer of `authenticated: false, needsReauth: false`
- **WHEN** the athlete sends a workout
- **THEN** the SPA SHALL say TrainingPeaks is not answering and SHALL NOT send `push-workout`

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
