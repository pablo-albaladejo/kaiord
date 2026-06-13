# Adapter Contracts — Delta

## ADDED Requirements

### Requirement: Adapters SHALL handle the full KRD intensity vocabulary explicitly

Workout adapters SHALL handle every member of the KRD intensity enum (`warmup`, `active`, `cooldown`, `rest`, `recovery`, `interval`, `other`) on both conversion legs: mapped to a native representation where the format has one, or narrowed with a `Lossy conversion:` warning where it does not. Silent narrowing of unhandled members to a default is a violation.

#### Scenario: Representable intensity survives the round-trip

- **GIVEN** a KRD step with intensity `rest` written to a format with a native rest notion
- **WHEN** the file is read back through the same adapter pair
- **THEN** the restored step carries intensity `rest`

#### Scenario: Unrepresentable intensity narrows loudly

- **GIVEN** a KRD step with intensity `recovery` written to a format with no recovery notion
- **WHEN** the writer substitutes the closest representable intensity (or omits the field)
- **THEN** it SHALL emit a `Lossy conversion:` warning naming `recovery` and the substitution applied

### Requirement: Garmin GCN listing summaries SHALL speak KRD sport vocabulary

The GCN adapter's workout-summary mapping SHALL translate Garmin sport keys to KRD sport vocabulary via the sport mapper; raw Garmin `sportTypeKey` values SHALL NOT appear in `WorkoutSummary.sport`.

#### Scenario: Listed workout shows a KRD sport

- **GIVEN** Garmin Connect returns a workout whose `sportTypeKey` is a Garmin-specific key
- **WHEN** the adapter builds the `WorkoutSummary`
- **THEN** `sport` carries the mapped KRD sport value (or the documented unknown fallback), not the raw key

### Requirement: Garmin GCN end-conditions without a KRD equivalent SHALL degrade loudly

When the GCN adapter encounters an end-condition the KRD duration vocabulary cannot express (e.g. repetition-count conditions), it SHALL emit a `Lossy conversion:` warning naming the condition and the substitution, rather than silently producing an open duration.

#### Scenario: Reps end-condition warns

- **GIVEN** a Garmin step whose end-condition is repetition-based
- **WHEN** the adapter converts it to a KRD duration
- **THEN** a `Lossy conversion:` warning names the reps condition
- **AND** the produced duration is open
