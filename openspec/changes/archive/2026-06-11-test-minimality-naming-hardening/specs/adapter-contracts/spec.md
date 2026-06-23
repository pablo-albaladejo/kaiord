# Adapter Contracts — Delta

## ADDED Requirements

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
