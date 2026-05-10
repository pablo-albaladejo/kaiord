## ADDED Requirements

### Requirement: Garmin GCN Adapter Round-Trips Multisport Transition Flag

The Garmin GCN adapter (`@kaiord/garmin`) SHALL accept `isSessionTransitionEnabled: boolean` as an optional field on workout input and SHALL preserve its value through GCN read → write round-trip when present.

The Garmin workout input schema (`garminWorkoutInputSchema` in `packages/garmin/src/adapters/schemas/input/workout-input.schema.ts`) SHALL declare `isSessionTransitionEnabled` as `z.boolean().optional()`.

The GCN writer SHALL emit the field at the workout root level when the input provides a value, and SHALL omit it from the emitted JSON when the input does not provide a value.

The GCN reader SHALL ingest the field when present in the source GCN and propagate it through the adapter's domain model.

#### Scenario: Multisport workout with transitions enabled survives round-trip

- **GIVEN** a multisport GCN workout (`sportTypeKey: "multi_sport"`) with `isSessionTransitionEnabled: true` at the root
- **WHEN** the workout is read by the GCN reader and re-emitted by the GCN writer
- **THEN** the resulting GCN JSON contains `isSessionTransitionEnabled: true` at the root with the same value as the source

#### Scenario: Single-sport workout omits transition flag

- **GIVEN** a single-sport GCN workout (`sportTypeKey: "running"`) with no `isSessionTransitionEnabled` field
- **WHEN** the workout is round-tripped through the GCN adapter
- **THEN** the emitted GCN JSON does not contain an `isSessionTransitionEnabled` key

#### Scenario: Explicitly disabled transitions survive round-trip

- **GIVEN** a multisport GCN workout with `isSessionTransitionEnabled: false` at the root
- **WHEN** the workout is round-tripped
- **THEN** the emitted GCN JSON contains `isSessionTransitionEnabled: false` (the value is preserved verbatim, not coerced to absent)

### Requirement: Garmin GCN Adapter Uses Faster-First Ordering For Range Targets

When the Garmin GCN writer emits range-based targets (`pace.zone`, `power.zone`, `speed.zone`), it SHALL place the faster / higher-intensity bound in `targetValueOne` and the slower / lower-intensity bound in `targetValueTwo`.

For pace targets in m/s, this means `targetValueOne >= targetValueTwo` (higher m/s is faster pace).

For power targets in watts, this means `targetValueOne >= targetValueTwo` (higher wattage is higher intensity).

For speed targets in m/s, this means `targetValueOne >= targetValueTwo`.

This ordering matches how the Garmin Connect server stores and renders range targets. Sending the values in the opposite order causes Garmin's server to silently reverse them on a subset of segments, producing inconsistent display.

#### Scenario: Pace zone target written with faster bound first

- **GIVEN** a workout step with a pace target range `4:40-4:30/km`, encoded as bounds `3.57 m/s` (slower) and `3.70 m/s` (faster)
- **WHEN** the GCN writer emits the step
- **THEN** the emitted JSON has `targetValueOne: 3.70` (faster) and `targetValueTwo: 3.57` (slower)

#### Scenario: Power zone target written with higher wattage first

- **GIVEN** a cycling step with a power target range `260-273 W`
- **WHEN** the GCN writer emits the step
- **THEN** the emitted JSON has `targetValueOne: 273` and `targetValueTwo: 260`

#### Scenario: GCN reader normalizes to faster-first regardless of source order

- **GIVEN** a GCN source with `targetValueOne: 3.57, targetValueTwo: 3.70` (slower-first, opposite of the documented order)
- **WHEN** the GCN reader ingests the step
- **THEN** the resulting domain model represents the same `[slower, faster]` range and the writer re-emits with faster-first ordering

### Requirement: Garmin GCN Adapter Documents Multisport Segment Composition Rules

The `@kaiord/garmin` package SHALL ship a documentation file (`packages/garmin/docs/MULTISPORT-TRANSITIONS.md`) that records the empirical Garmin Connect rules for multisport segment composition.

The document SHALL cover at minimum:

- The combinations of top-level steps Garmin's server accepts within a single multisport segment without reorganizing it (allow-list).
- The combinations Garmin's server rewrites or splits silently (deny-list).
- The role of `isSessionTransitionEnabled` and confirmation that no `transition` sport type exists.
- The expected `targetValueOne` / `targetValueTwo` ordering for range targets.
- The fact that `stepOrder` is global across segments and across nested `RepeatGroupDTO` children.
- A footer noting "Empirical findings as of YYYY-MM-DD" and the workout IDs used to derive the rules, so readers can audit the source.

The document is normative for adapter behavior: when GCN multisport readers/writers are extended, they SHALL be consistent with the rules in that file.

#### Scenario: Documentation file exists and lists composition rules

- **WHEN** a contributor opens `packages/garmin/docs/MULTISPORT-TRANSITIONS.md`
- **THEN** they find an allow-list and a deny-list of segment compositions, the role of `isSessionTransitionEnabled`, the target ordering rule, the global `stepOrder` rule, and a dated empirical-findings footer

#### Scenario: Adapter behavior is consistent with documented rules

- **WHEN** the GCN writer is extended with new multisport functionality
- **THEN** its behavior matches the rules described in `packages/garmin/docs/MULTISPORT-TRANSITIONS.md`, or the document is updated in the same change with a new dated footer
