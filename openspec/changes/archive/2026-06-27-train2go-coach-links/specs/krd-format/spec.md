## ADDED Requirements

### Requirement: Workout-level notes field

The workout structure schema SHALL provide an optional workout-level `notes`
field (`workoutSchema` in `packages/core/src/domain/schemas/workout.ts`) carrying
free-text coaching instructions for the workout as a whole. This field is distinct
from the existing per-step `notes` (which annotates an individual `WorkoutStep`)
and from `name` (a short title).

The field SHALL be:

- `notes` (string, optional): free-text workout-level instructions. MAY contain
  markdown (e.g. `[label](url)` links). When absent, the workout has no
  workout-level notes. The KRD schema SHALL NOT impose a length cap on this field;
  format adapters whose target imposes a cap SHALL truncate best-effort at export
  time (see the relevant adapter contract) rather than rejecting the KRD.

Adapters that support a workout-level free-text concept SHALL round-trip this
field. ZWO SHALL map workout-level `notes` to/from the ZWO workout `description`.
FIT/Garmin, which expose only step-level notes capped at 256 characters, SHALL
NOT be required to round-trip workout-level `notes` losslessly; their handling is
governed by `conversion-loss-honesty` and the adapter contract.

#### Scenario: Workout-level notes accepted and validated

- **GIVEN** a structured-workout KRD whose workout carries `notes: "Z1 warmup, see [video](https://youtu.be/abc)"`
- **WHEN** parsed via `workoutSchema`
- **THEN** validation succeeds and the parsed workout exposes `notes` verbatim

#### Scenario: Workout-level notes is optional

- **GIVEN** a structured-workout KRD whose workout omits `notes`
- **WHEN** parsed via `workoutSchema`
- **THEN** validation succeeds and `notes` is `undefined`

#### Scenario: ZWO round-trip preserves workout-level notes

- **GIVEN** a KRD workout with `notes: "Endurance ride — keep cadence > 85"`
- **WHEN** converted to ZWO and back to KRD
- **THEN** the resulting workout `notes` equals the original within exact-string equality (ZWO carries it as the workout `description`)

#### Scenario: FIT export truncates workout-level notes best-effort

- **GIVEN** a KRD workout with `notes` longer than 256 characters
- **WHEN** exported to FIT
- **THEN** export succeeds and the workout-level instructions are attached
  best-effort as a step note truncated to 256 characters; no error is raised and
  the loss is surfaced per `conversion-loss-honesty`
