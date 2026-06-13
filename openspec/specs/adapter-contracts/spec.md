> Synced: 2026-06-13 (code-semantics-hardening)

# Adapter Contracts

## Purpose

Generic contract that every format-adapter and browser-extension-adapter in the monorepo MUST satisfy, so adapters stay interchangeable behind ports and cannot leak implementation concerns into the domain layer.

## Requirements

### Requirement: Browser Extension Adapter Pattern

Browser extension adapters SHALL communicate with external web APIs by piggybacking on the user's authenticated browser session. The extension SHALL NOT store, transmit, or manage user credentials. Authentication is delegated entirely to the browser's cookie jar.

The extension adapter architecture SHALL separate concerns into:

- **Background service worker**: Message coordination, token capture via `webRequest`, session-scoped state via `chrome.storage.session`, no direct API calls
- **Content script**: Same-origin API execution on the target domain, automatic cookie attachment by the browser, path/method allowlist enforcement
- **External messaging**: SPA communication via `chrome.runtime.onMessageExternal` with allowed origins declared in `externally_connectable`

Browser extension adapters SHALL use the response shape `{ ok: boolean, protocolVersion?: number, data?: unknown, error?: string }` for all external messages.

Browser extension adapters SHALL enforce a path/method allowlist in the content script to restrict API access to only the operations the adapter is designed to support.

#### Scenario: Extension adapter separates concerns

- **WHEN** the SPA sends an API request via the extension
- **THEN** the background service worker routes the request to the content script, which validates the path/method against the allowlist and executes the fetch on the target domain with browser-managed cookies

#### Scenario: No credential storage

- **WHEN** the extension is inspected (storage, memory, network)
- **THEN** no user credentials (passwords, OAuth tokens, API keys) are stored or transmitted by the extension

#### Scenario: Disallowed API path rejected

- **WHEN** a message requests a path outside the allowlist
- **THEN** the content script rejects the request without making a network call

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

### Requirement: TCX Adapter Round-Trips Cadence And Pace Targets On Its Wired Encoding Path

The TCX writer's production encoding path (the converter chain reachable from the registered `TextWriter`, currently `workout/step-to-tcx.converter.ts` → `workout/target-to-tcx.converter.ts` and `duration/duration-walker.converter.ts`) SHALL preserve cadence and pace targets across a full KRD → TCX → KRD round-trip within the configured tolerances (cadence ±1 rpm, time ±1 s). The writer and reader SHALL agree on one canonical encoding for running cadence (steps-per-minute doubling or rpm pass-through, resolved against the TCX schema semantics and Garmin-exported fixtures) and on one canonical pace unit identifier; divergent encodings between writer and reader are a violation regardless of which encoding is chosen. The TCX package SHALL contain exactly one production implementation per conversion direction — orphaned parallel converter chains SHALL NOT exist.

#### Scenario: Running cadence target survives the round-trip

- **GIVEN** a KRD running workout with a step carrying a cadence target of 90 rpm
- **WHEN** the KRD is written to TCX by the wired writer path and read back by the wired reader path
- **THEN** the resulting KRD step SHALL carry a cadence target equal to 90 rpm within ±1 rpm

#### Scenario: Cycling cadence target survives the round-trip unchanged

- **GIVEN** a KRD cycling workout with a step carrying a cadence target of 90 rpm
- **WHEN** the KRD is written to TCX and read back through the wired paths
- **THEN** the resulting KRD step SHALL carry a cadence target equal to 90 rpm within ±1 rpm

#### Scenario: Pace target survives the round-trip with a consistent unit

- **GIVEN** a KRD running workout with a pace target expressed in the canonical KRD speed unit
- **WHEN** the KRD is written to TCX and read back through the wired paths
- **THEN** the resulting pace target SHALL equal the original within the configured tolerance
- **AND** the writer and reader SHALL have used the same unit identifier for the encoded value

#### Scenario: Orphaned converter chain is rejected

- **WHEN** the TCX package contains a target- or duration-converter module that no production code path imports (only tests or re-export barrels reference it)
- **THEN** the module SHALL be removed (or wired in as the single canonical path), and its unique assertions SHALL be ported to the wired path's suite before removal

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
