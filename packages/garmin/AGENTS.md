<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# @kaiord/garmin

## Purpose

GCN (Garmin Connect Native) JSON format adapter for Kaiord. Provides bidirectional conversion between Garmin Connect workout JSON payloads and KRD (Kaiord Record Document) using Zod for runtime validation. Maps GCN structured workout format to/from KRD with support for power, heart rate, speed, cadence targets, repeat blocks, and multisport workouts.

## Key Files

| File                            | Description                                                                                                                                                 |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/index.ts`                  | Public API exports. Factory functions (`createGarminConnectReader`, `createGarminConnectWriter`) and pre-built singletons (`garminReader`, `garminWriter`). |
| `src/adapters/garmin-reader.ts` | Reader port implementation (GCN → KRD).                                                                                                                     |
| `src/adapters/garmin-writer.ts` | Writer port implementation (KRD → GCN).                                                                                                                     |
| `src/test-utils/constants.ts`   | Fixture constants for test files.                                                                                                                           |
| `package.json`                  | Dependencies: `@kaiord/core`, `zod@^4.4.3`.                                                                                                                 |
| `README.md`                     | Public documentation with API examples and feature list.                                                                                                    |
| `docs/README.md`                | Comprehensive documentation index (architecture, implementation, API findings).                                                                             |

## Subdirectories

| Directory         | Purpose                                                                                            |
| ----------------- | -------------------------------------------------------------------------------------------------- |
| `src/adapters/`   | Reader/writer/converter implementations and schema validation (see `adapters/AGENTS.md`).          |
| `src/test-utils/` | Fixture constants for test files (see `test-utils/AGENTS.md`).                                     |
| `docs/`           | Detailed architecture, API findings, schema validation, and testing guides (see `docs/AGENTS.md`). |

## For AI Agents

### Working In This Directory

**Hexagonal Architecture:**

- `@kaiord/garmin` is a pure adapter package: depends on `@kaiord/core` only.
- Exports implement `TextReader` and `TextWriter` ports from core.
- KRD is canonical; all conversions flow GCN → KRD → GCN.

**Export Strategy (Dual Variants):**

- Pre-built singletons: `garminReader`, `garminWriter` (no logger needed for defaults).
- Factory functions: `createGarminConnectReader(logger?)`, `createGarminConnectWriter(options?)` (inject custom logger or options).
- Options type: `GarminWriterOptions = { logger?: Logger; paceZones?: PaceZoneTable }`.
- Callers may use `createDefaultProviders({ garmin: createGarminProviders() })` for integration.

**GCN Format Characteristics:**

- Input schema is flexible: accepts strings or numbers for target values; minimal type objects.
- Output schema is strict: always returns numbers (floats); expanded type objects with displayOrder, unitId, factor; server-assigned IDs (workoutId, stepId, timestamps).
- Multisport support: sportTypeId 10 with multiple workoutSegments; stepOrder must be globally sequential across ALL segments.
- No subsport support in structured workout API.
- Workspace transition flag preserved via extensions: `krd.extensions.gcn.isSessionTransitionEnabled`.

**File Naming:**

- Converters: `*.converter.ts` (complex logic, tested).
- Mappers: `*.mapper.ts` (simple transformation, no test).
- Schemas: `schemas/{common,input,output}/` organize Zod validators by category.

**Schemas (Adapter Camel-Case):**

- GCN uses camelCase: `sportTypeId`, `workoutName`, `workoutSteps`, `trainingSpeedZone`.
- KRD uses snake_case: `sport_type`, `indoor_cycling` (enforced at domain layer).
- Schema enums in `schemas/common/` define mappings (sport, condition, equipment, stroke, target, step, unit).

### Testing Requirements

**Coverage:** 80% for this package.

**Round-Trip Tolerances:**

- Time: ±1s
- Power: ±1W or ±1%FTP
- Heart rate: ±1bpm
- Cadence: ±1rpm

**Test Conventions (Enforced):**

- Every `it()` title MUST start with `"should "` (lowercase, no caps).
- Every `it()` body MUST have canonical `// Arrange`, `// Act`, `// Assert` sections (blank lines between).

**Key Test Patterns:**

- Unit tests for converters: isolated domain logic, mocked KRD/GCN payloads.
- Mapper tests embedded in converter tests (mappers themselves have no dedicated tests).
- Round-trip tests: GCN → KRD → GCN, verify output matches (within tolerance).
- Schema validation tests: input/output schema conformance, error reporting.
- Integration tests in `round-trip/` verify end-to-end workflows with real fixtures.

### Common Patterns

**Error Handling:**

- Use `createGarminParsingError()` for JSON parse/structure issues (inherited from core).
- Errors include field path and message for debugging.

**Logging:**

- All public factories accept optional `Logger` (defaults to `createConsoleLogger`).
- Use `logger.debug()` for internal state (step index, sport mapping, etc.).
- Use `logger.info()` for major milestones (conversion complete).
- Use `logger.warn()` for recoverable issues (missing optional fields).
- Use `logger.error()` for failures (throw after logging).

**Metadata & Extensions:**

- GCN extensions (custom step names, notes) are preserved in KRD.
- KRD stores GCN-specific data as `{ gcn: { isSessionTransitionEnabled?: boolean } }` in extensions.
- Round-trip fidelity: GCN → KRD → GCN preserves all extension data.

**Pace Zones (Running):**

- `PaceZoneTable` optional export for converting pace zones to/from Garmin `trainingSpeedZone`.
- Used by `target-pace.mapper.ts` to map pace ranges to Garmin structures.
- Callers may inject custom pace zones via `GarminWriterOptions.paceZones`.

**Repetition Blocks:**

- Repeat structures (`repetitionType`, `repetitions`, `childStepId`) flattened to individual workout steps.
- Counter mechanism tracks global step order across repeats and non-repeat steps.
- `garmin-repetition.converter.ts` handles nested repeat expansion.

### Contribution Flow

1. Check `openspec/changes/` for active proposal matching the work.
2. Read `design.md` and `tasks.md` if a spec exists.
3. Implement domain → application → ports → adapters (hexagonal order).
4. Add tests (unit + round-trip; AAA + `should ` titles).
5. Verify round-trip tolerances for time, power, HR, cadence.
6. `pnpm -r build && pnpm -r test && pnpm lint:fix`.
7. Add changeset if version-worthy: `pnpm exec changeset`.
8. Update docs if public API changes.

## Dependencies

### Internal

- `@kaiord/core`: Domain types, ports, error factories, logger interface, KRD/Workout schemas.

### External

- `zod@^4.4.3`: Schema validation (GCN input/output structure, enums).
- `@types/node`: Node.js type definitions.
- `typescript`: Language (strict mode).
- `vitest`: Testing framework.

<!-- MANUAL: -->
