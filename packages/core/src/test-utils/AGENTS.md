<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# test-utils

## Purpose

Public exports under the `@kaiord/core/test-utils` subpath. Fixture loaders that read from the monorepo-root `test-fixtures/{fit,krd,tcx,zwo}/` directories, rosie-based factory builders re-exported from `../tests/fixtures/`, a mock logger, parity-tested `ProfileSnapshot` fixtures (shared between SPA Zod parser and bridge plain-JS validators), and named tolerance/round-trip constants that replace inline magic numbers in tests across the monorepo.

## Key Files

| File                           | Description                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `index.ts`                     | Barrel re-exporting every test-util: fixture loaders, KRD/workout/duration/target builders, mock logger, profile-snapshot fixtures, tolerance and round-trip constants.                                                                                                                                                                                                                     |
| `fixtures.ts`                  | Filesystem fixture loaders: `loadFitFixture(name)`, `loadKrdFixture(name)`, `loadKrdFixtureRaw(name)`, `loadTcxFixture(name)`, `loadZwoFixture(name)`, `getFixturePath(type, name)`, `loadFixturePair(baseName)` (FIT+KRD together), and the `FIXTURE_NAMES` constant (INDIVIDUAL_STEPS, REPEAT_STEPS, CUSTOM_TARGET_VALUES, REPEAT_GREATER_THAN). Reads from `../../../../test-fixtures/`. |
| `tolerance-constants.ts`       | Named numeric literals used by every tolerance/round-trip test: `TOLERANCE_TIME_SEC=1`, `TOLERANCE_POWER_WATTS=1`, etc., plus length-unit samples, pool lengths, faker digit counts, target-range widths, profile-snapshot constants, and `WORKOUT_STEP_NOTES_MAX_LENGTH=256`.                                                                                                              |
| `round-trip-fixtures.ts`       | Domain-named constants for round-trip assertions (POWER_EXPECTED=250, HR_ACTUAL=155, …) plus `createFitBufferSample()` returning a fresh `Uint8Array([1,2,3,4])` per call (prevents cross-test mutation).                                                                                                                                                                                   |
| `profile-snapshot-fixtures.ts` | `baselineSnapshot`/`minimalSnapshot`/`partialZoneSnapshot` (positive) + `negativeSnapshotFixtures` (missing schemaVersion, oversized payload, prototype-pollution, …). Parity-tested by both the SPA's Zod parser and each bridge's hand-rolled plain-JS validator.                                                                                                                         |

## For AI Agents

### Working In This Directory

- Files here are EXPORTED to other packages via `@kaiord/core/test-utils` (see `package.json` exports map). Breaking changes to a public utility name require a coordinated update of every consumer (`@kaiord/fit`, `@kaiord/tcx`, `@kaiord/zwo`, `@kaiord/workout-spa-editor`, bridge packages).
- `FIXTURES_DIR` is computed as `__dirname + ../../../../test-fixtures` — that resolves from BOTH `src/test-utils/` (dev) and `dist/test-utils/` (after build) to the monorepo root. Don't change the depth without updating both paths.
- The barrel re-exports rosie factory builders from `../tests/fixtures/krd/` and `../tests/fixtures/workout/` (e.g. `buildKRD`, `buildWorkout`, `buildWorkoutStep`, `buildTarget`, `buildDuration`). New builders MUST be added here too to be reachable from `@kaiord/core/test-utils`.
- The negative profile-snapshot fixtures intentionally exercise `__proto__` and `constructor` keys to verify the SPA parser rejects prototype-pollution payloads without throwing. Don't simplify these to plain `{}`.
- This subpath is NOT included in the production bundle (separate ESM entry in `package.json`). Adding heavy dependencies here is fine — they won't bloat consumer apps.

### Testing Requirements

- Coverage target: 80%. `fixtures.test.ts` and `index.test.ts` exercise the loaders and re-exports. AAA + `should ` invariants apply.

### Common Patterns

- **Named-literal constants over magic numbers** — every numeric used in an assertion should be `import`ed from `tolerance-constants.ts` or `round-trip-fixtures.ts`.
- **Fresh-buffer factories** (`createFitBufferSample`) — return a new object per call to defuse cross-test mutation.
- **Parity fixtures** — same data exercised by two independent validators (Zod + plain-JS) for protocol-level guarantees.

## Dependencies

### Internal

- `../domain/schemas/krd` — `KRD` type for fixture loaders.
- `../tests/fixtures/krd/*.fixtures.ts` — rosie factories re-exported through the barrel.
- `../tests/fixtures/workout/*.fixtures.ts` — rosie factories re-exported through the barrel.
- `../tests/helpers/test-utils` — `createMockLogger`.
- `../types/profile-snapshot` — `ProfileSnapshot` type.

### External

- `fs`, `path` (Node built-ins) — `readFileSync`, `join` for fixture loaders.

<!-- MANUAL: -->
