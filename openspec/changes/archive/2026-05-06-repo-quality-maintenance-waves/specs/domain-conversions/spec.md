## ADDED Requirements

### Requirement: Power-zone table lives in domain layer

The 7-band power-zone-to-percent-FTP mapping (zone `1`–`7`) is a fitness-domain truth, not a format encoding. It SHALL live as a pure constant in `packages/core/src/domain/zones/power-zones.ts` and SHALL be the single source of truth for any adapter that needs to translate between a discrete zone number and a percent-FTP value.

The published API of `@kaiord/core` SHALL re-export the helper(s) in an additive-only way (no removals, no signature changes to existing exports). The helpers SHALL be pure functions with zero external imports beyond `zod` schemas already present in `core/src/domain/`.

The audit accompanying the implementation PR SHALL list every adapter file currently containing equivalent zone-table logic and confirm that, post-migration, no such file remains outside `packages/core/src/domain/zones/`.

#### Scenario: Mapping every valid zone returns a finite percent-FTP

- **GIVEN** the helper `zoneToPercentFtp(zone: 1 | 2 | 3 | 4 | 5 | 6 | 7)` exists in `@kaiord/core`
- **WHEN** the helper is invoked for each integer zone in the closed interval `[1, 7]`
- **THEN** the result is a positive number, finite, and monotonically non-decreasing as the zone number grows

#### Scenario: Out-of-range zone is rejected

- **GIVEN** the helper `zoneToPercentFtp` exists
- **WHEN** the helper is invoked with `0`, `8`, `-1`, `NaN`, or any non-integer value
- **THEN** the helper SHALL throw a `RangeError` (or its zod-validated equivalent) — it MUST NOT return `undefined`, `null`, or a silently clamped value

#### Scenario: Round trip across the full input domain

- **GIVEN** the helpers `zoneToPercentFtp(z)` and any inverse used by an adapter (e.g. `percentFtpToZone(p)`)
- **WHEN** the helper's input domain is exercised — exhaustively enumerated if finite and small (e.g. the 7 integer zones for power), or via a property-based generator (`fast-check` or equivalent) producing ≥ 100 cases if the domain is large or continuous (e.g. an HR helper accepting a continuous BPM range)
- **THEN** for every input `z` exercised, `inverse(forward(z))` returns `z` (round-trip identity)

#### Scenario: ZWO adapter migrates without changing existing round-trip tolerances

- **GIVEN** the existing `zwo` adapter previously held its own copy of the zone table at `packages/zwo/src/adapters/target/power.converter.ts:56`
- **WHEN** the adapter is migrated to import from `@kaiord/core` and the round-trip suite runs
- **THEN** every existing FIT ↔ KRD ↔ ZWO round-trip fixture passes within the project's standing tolerances (`time ±1s, power ±1W or ±1%FTP, HR ±1bpm, cadence ±1rpm`); no fixture is modified to make the migration pass

### Requirement: Domain pure-helper directories SHALL NOT acquire side effects

Modules under any of the following directories SHALL remain pure: no I/O, no clock reads, no random number generation, no module-level network or filesystem access. The hexagonal architecture lint (the `lint:architecture` script in root `package.json`, equivalent to `pnpm arch:check`) SHALL continue to report zero errors after the helpers are introduced.

The covered directories are:

- `packages/core/src/domain/zones/` — **active** (created by the `repo-quality-maintenance-waves` change in §6.1).
- `packages/core/src/domain/conversions/` — **reserved**; not created by this change. The forward enumeration makes the purity invariant load-bearing for any future helper added under that path, so a later change that introduces `domain/conversions/` cannot retroactively weaken the contract.

If a future change requires side-effectful behavior (e.g. fetching an athlete-specific zone profile from storage), the work SHALL move to `packages/core/src/application/` with an injected port — never directly into `domain/`.

#### Scenario: Architecture lint stays clean

- **GIVEN** the helpers are added under `packages/core/src/domain/zones/`
- **WHEN** `pnpm lint:architecture` runs (equivalent to `pnpm arch:check`)
- **THEN** it reports `0 errors` and the helpers' import graph contains only other `domain/` modules and `zod`

#### Scenario: New helper with side effects is rejected

- **GIVEN** a developer attempts to add `getCurrentAthleteZones()` (which reads from a database) under `packages/core/src/domain/zones/`
- **WHEN** the architecture lint runs
- **THEN** it fails because the new file imports from outside `domain/`, and the error message points at the helper file
