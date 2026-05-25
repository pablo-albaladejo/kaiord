## ADDED Requirements

### Requirement: Workout-Only Adapter Writers Reject Health KRDs With Typed Error

Adapters whose target format does not support health data (`@kaiord/tcx`, `@kaiord/zwo`, `@kaiord/garmin`) SHALL refuse to write a KRD whose `type` is one of the six health variants (`sleep_record`, `weight_measurement`, `hrv_summary`, `daily_wellness`, `body_composition`, `stress_episode`). The refusal SHALL be a typed `UnsupportedKrdTypeError` exported from `packages/core/src/domain/errors/unsupported-krd-type-error.ts`, NOT a generic `Error`.

The error SHALL carry two fields readable by consumers:

- `krdType: string` — the offending `krd.type` value
- `adapterName: string` — the name of the rejecting adapter (e.g., `"tcx"`, `"zwo"`, `"garmin"`)

The corresponding readers SHALL never emit a KRD with a health `type`; their output is constrained to `type ∈ { structured_workout, recorded_activity, course }`.

This rule reverses the v1.x de-facto behaviour where workout-only writers threw a generic `Error("Unsupported FIT file type: …")` and FIT silently discarded unrecognised messages. Typed rejection at the writer layer lets the SPA import flow route health-typed KRDs to the FIT pipeline at runtime via `instanceof` checks, and lets consumers exhaustively handle the new variants.

#### Scenario: TCX writer rejects sleep KRD with typed error

- **GIVEN** a KRD with `type: "sleep_record"` and a populated `extensions.health.sleep` payload
- **WHEN** the TCX writer is invoked with this KRD
- **THEN** it throws an `UnsupportedKrdTypeError` with `krdType === "sleep_record"` and `adapterName === "tcx"`

#### Scenario: ZWO writer rejects weight KRD with typed error

- **GIVEN** a KRD with `type: "weight_measurement"`
- **WHEN** the ZWO writer is invoked with this KRD
- **THEN** it throws an `UnsupportedKrdTypeError` with `krdType === "weight_measurement"` and `adapterName === "zwo"`

#### Scenario: GCN writer rejects every health type

- **GIVEN** six KRDs, one per health type
- **WHEN** each is passed to the GCN writer
- **THEN** every call throws an `UnsupportedKrdTypeError` with the correct `krdType` and `adapterName === "garmin"`

#### Scenario: Workout-only readers never emit health types

- **WHEN** any of the TCX, ZWO, or GCN readers parses a syntactically valid source from its format
- **THEN** the resulting KRD's `type` SHALL be one of `structured_workout`, `recorded_activity`, or `course` — never any of the six health types

### Requirement: FIT Adapter Is The Only Bidirectional Implementation For Health In v2.0

The `@kaiord/fit` adapter SHALL provide bidirectional read/write coverage for all six health KRD types in this proposal. Specifically:

- The FIT reader SHALL recognise the FIT `file_type` values `weight (9)`, `monitoringA (15)`, `monitoringDaily (28)`, and `monitoringB (32)`, and the messages `sleep_level`, `monitoring`, `monitoring_info`, `weight_scale`, `body_composition`, `hrv`, and `stress_level`. Each SHALL be routed through a typed mapper to the corresponding health KRD `type` with the appropriate `extensions.health.<metric>` payload populated.
- The FIT writer SHALL accept a KRD with any of the six health types and SHALL emit a FIT binary whose `file_type` and message stream round-trip back to an equivalent KRD within the per-metric tolerances declared by the `health-data` capability.

The previous behaviour in `groupWorkoutMessages` of silently discarding unknown messages via a null-check (`packages/fit/src/adapters/messages/messages.mapper.ts:62-67`) is REPLACED by an explicit dispatch table that routes each known health message to its health mapper. Unknown messages — those not registered in `FIT_MESSAGE_NUMBERS` and not part of the health dispatch table — continue to round-trip through `extensions.fit.unknownMessages` per the existing extension preservation rule, not via silent discard.

#### Scenario: FIT reader routes weight file to weight KRD

- **GIVEN** a Garmin FIT file with `file_type: weight (9)` containing a single `weight_scale` message
- **WHEN** the FIT reader is invoked
- **THEN** the resulting KRD has `type: "weight_measurement"`, `metadata.sport` absent, and `extensions.health.weight` populated with a `WeightMeasurement` validating against the `health-data` weight sub-schema

#### Scenario: FIT writer accepts daily wellness KRD

- **GIVEN** a KRD with `type: "daily_wellness"` and `extensions.health.daily` populated
- **WHEN** the FIT writer is invoked
- **THEN** the writer emits a FIT binary with `file_type: monitoringDaily (28)` and the corresponding `monitoring` and `monitoring_info` messages; no exception is thrown

#### Scenario: Unknown FIT message preserved via extensions.fit

- **GIVEN** a FIT file containing an experimental message number not registered in `FIT_MESSAGE_NUMBERS` nor in the health dispatch table
- **WHEN** the FIT reader processes the file
- **THEN** the unknown message is preserved in `extensions.fit.unknownMessages` per the existing extension namespace rule — it is NOT silently dropped

### Requirement: Adapter Coverage Matrix Documented As Normative Artefact

The `@kaiord/core` package SHALL ship a documentation file (`packages/core/docs/ADAPTER-COVERAGE.md`) that records the canonical coverage matrix of every supported KRD `type` against every adapter in the monorepo. Each cell SHALL be exactly one of: `read+write`, `read-only`, `write-only`, `reject`, or `n/a` (the type does not apply to the format). When an adapter is added or extended, this document SHALL be updated in the same change so the matrix stays accurate.

The matrix at the time of v2.0 release SHALL be:

| Format | structured_workout | recorded_activity | course     | sleep_record | weight_measurement | hrv_summary | daily_wellness | body_composition | stress_episode |
| ------ | ------------------ | ----------------- | ---------- | ------------ | ------------------ | ----------- | -------------- | ---------------- | -------------- |
| FIT    | read+write         | read+write        | read+write | read+write   | read+write         | read+write  | read+write     | read+write       | read+write     |
| TCX    | read+write         | read+write        | n/a        | reject       | reject             | reject      | reject         | reject           | reject         |
| ZWO    | read+write         | n/a               | n/a        | reject       | reject             | reject      | reject         | reject           | reject         |
| GCN    | read+write         | n/a               | n/a        | reject       | reject             | reject      | reject         | reject           | reject         |

Cross-format round-trip tests SHALL exist only for cells where both the source and target are `read+write`. There SHALL NOT be a round-trip test for FIT health → TCX or FIT health → GCN; those pairs are documented as `reject` on the writer side.

#### Scenario: Documentation file exists and lists the v2.0 matrix

- **WHEN** a contributor opens `packages/core/docs/ADAPTER-COVERAGE.md`
- **THEN** the file contains the matrix above (or a strict superset after future additive changes), with each adapter × type cell explicitly labelled

#### Scenario: Cross-format round-trip respects the matrix

- **WHEN** the CI test suite runs cross-format round-trip tests
- **THEN** there is no test attempting `FIT (health type) → TCX → FIT` or any combination crossing a `reject` cell; round-trip coverage is constrained to the matrix's `read+write` rectangles
