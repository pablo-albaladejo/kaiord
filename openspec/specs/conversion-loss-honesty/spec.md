> Synced: 2026-06-13 (code-semantics-hardening)

# Conversion Loss Honesty

## Purpose

Defines how every format adapter SHALL behave when the target format cannot
faithfully represent KRD data: each drop, approximation, substitution, or
narrowing is announced with a named `Lossy conversion:` warning at the point
it happens, every assumed/fallback value is a named constant, round-trip
extension attributes state their purpose, and unparseable restore data
degrades loudly rather than coercing to a physiologically meaningless value.

## Requirements

### Requirement: Lossy conversions SHALL announce the loss at the point it happens

Any adapter code path that drops, approximates, substitutes, or narrows KRD data because the target format cannot express it SHALL emit a warning through the injected logger whose message begins with `Lossy conversion:` and names the concept lost, accompanied by a context object carrying the original value(s) and the step/entity index where applicable. Structurally parallel branches (e.g. a steady-state and a ramp encoder applying the same approximation) SHALL be consistently honest — one branch warning while its twin stays silent is a violation.

#### Scenario: Watts-to-percent-FTP approximation warns in every branch

- **GIVEN** a KRD power target expressed in watts is encoded to a format that only accepts percent-FTP
- **WHEN** the encoder derives the percentage from an assumed FTP
- **THEN** it SHALL emit a `Lossy conversion:` warning naming the assumed FTP and the original watts, regardless of which encoder branch (steady-state, ramp, interval) performed the approximation

#### Scenario: Enum narrowing warns instead of silently defaulting

- **GIVEN** a KRD step carries an intensity value the target format cannot represent
- **WHEN** the adapter substitutes a representable value or drops the field
- **THEN** it SHALL emit a `Lossy conversion:` warning naming the original intensity and the substitution applied

#### Scenario: Truncation warns with the limit named

- **WHEN** an adapter truncates free text (names, notes) to a wire-format length limit
- **THEN** the limit SHALL be a named constant and the truncation SHALL emit a warning naming the field and the limit

### Requirement: Assumed and fallback values SHALL be named constants with stated rationale

Every value an adapter invents on behalf of the user — assumed FTP, placeholder durations, default substitutions for unknown enum members — SHALL be a named module-level constant whose declaration carries a comment stating why that value was chosen. Inline numeric literals encoding such assumptions are a violation.

#### Scenario: Assumed FTP is a single named constant

- **GIVEN** an encoder needs an FTP value that KRD watts targets do not carry
- **WHEN** two encoder functions in the package perform this derivation
- **THEN** both SHALL reference one named constant (e.g. `ASSUMED_FTP_WATTS`) whose declaration explains the choice, rather than each declaring a local literal

#### Scenario: Placeholder duration is named and explained

- **WHEN** an unsupported KRD duration type is emitted as a fixed-length placeholder block
- **THEN** the placeholder length SHALL be a named constant whose comment states that the real type round-trips via the extension namespace

### Requirement: Round-trip extension attributes SHALL state their purpose where written and read

Modules that write or restore `kaiord:` extension attributes SHALL carry a header comment stating the namespace's purpose: preserving KRD concepts the wire format cannot express so that a round-trip through that format is lossless even though native readers ignore the attributes.

#### Scenario: Restore module declares the namespace contract

- **WHEN** a reader module declares types or functions for `kaiord:original*` attributes
- **THEN** the module SHALL carry a comment explaining that these attributes restore concepts the format cannot natively express

### Requirement: Restore paths SHALL NOT coerce unparseable round-trip data to physiologically meaningless values

When a round-trip extension attribute is present but unparseable or empty, the reader SHALL warn and restore an explicit open/unknown value rather than silently coercing to zero (a 0 bpm, 0 watt, or 0 meter duration masks corruption as data).

#### Scenario: Corrupted round-trip attribute degrades loudly to open

- **GIVEN** a step carries `kaiord:originalDurationType: "heart_rate_less_than"` but no parseable bpm value
- **WHEN** the reader restores the duration
- **THEN** it SHALL emit a warning naming the unparseable attribute
- **AND** restore an open duration instead of `{ bpm: 0 }`
