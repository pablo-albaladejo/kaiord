## MODIFIED Requirements

### Requirement: Round-Trip Safety

Converting a workout from any format the Kaiord SDK reads and writes (FIT,
TCX, ZWO, GCN) to KRD and back MUST preserve every value within the declared
tolerances, `DECLARED_TOLERANCES` in `@kaiord/core`:

- Time: ±1 second
- Distance: ±1 meter
- Power: ±1W or ±1% FTP
- Heart rate: ±1 bpm or ±1% of maximum
- Cadence: ±1 rpm
- Pace: ±0.01 m/s

Every other value SHALL come back exactly. A field a format cannot carry, a
field it fills in, and a kind of step it cannot hold SHALL be declared, with a
reason, in that format's Round-trip contract; nothing else may differ. Each
format SHALL have a Round-trip test, run by the CI `round-trip` job, over a
case for every duration type, target type and unit, intensity and sport its
contract does not declare unsupported, a structured workout with repeats,
names and notes, and its workout fixtures.

#### Scenario: FIT to KRD round-trip

- **GIVEN** a valid FIT file with a running workout
- **WHEN** converted to KRD and back to FIT
- **THEN** all field values are within round-trip tolerances

#### Scenario: A value a format drops without a declaration

- **WHEN** a writer stops writing a field its contract does not declare
- **THEN** that format's Round-trip test SHALL fail and name the field

#### Scenario: A declaration that is no longer true

- **WHEN** a format starts carrying a kind of step its contract declares unsupported, or no value needs a declared field
- **THEN** that format's Round-trip test SHALL fail

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

Adapters SHALL round-trip this field where the format has a workout-level text:
ZWO the workout `description`, TCX the Workout `Notes`, GCN the workout
`description`, FIT the workout message's `wktDescription`, cut to the 254 bytes
of a FIT string. The FIT writer SHALL also copy the notes onto a first step that
has none, and the FIT reader SHALL read that copy as the workout notes, not as a
step note.

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

- **GIVEN** a KRD workout with `notes` longer than the 254 bytes of a FIT string
- **WHEN** exported to FIT
- **THEN** export succeeds, the description and the first-step copy are cut on
  a character boundary to 254 bytes; no error is raised and the loss is
  surfaced per `conversion-loss-honesty`

#### Scenario: FIT keeps workout notes as the description

- **GIVEN** a workout with notes and a first step without notes
- **WHEN** it goes KRD → FIT → KRD
- **THEN** the workout notes are equal and the first step has no notes
