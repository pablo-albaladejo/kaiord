<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# test-utils

## Purpose

Test fixtures and constants. Provides numeric constants (time, power, HR, cadence, coordinates) and tolerance boundaries for test setup and round-trip validation. Used across all adapter tests.

## Key Files

| File           | Description                                                                                                                                                 |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `constants.ts` | Numeric constants: time domains (minutes, seconds), HR/power/cadence/pace samples, coordinates (world cities), tolerances, pool lengths, FIT sample values. |

## Subdirectories

None.

## For AI Agents

### Working In This Directory

- **Pure constants:** No logic, no imports except TypeScript.
- **Constant categories:** Time (ms, sec), samples (HR, power, cadence, pace), coordinates, boundaries (lat/lon), precision, budgets, event/step counts, pool lengths, notes lengths, FTP scaling.
- **Usage:** Import constants into test files for consistent test data across the package.

### Testing Requirements

- No runtime tests needed; constants are compile-time safe.
- Used by integration and round-trip tests.

### Common Patterns

- **Coordinate constants:** Cities worldwide (Barcelona, Madrid, London, Sydney, Tokyo) with precise lat/lon for coordinate conversion tests.
- **Time constants:** Milliseconds for duration, seconds for FIT timestamps.
- **Tolerance constants:** `TIME_TOLERANCE_MS`, `COORD_PRECISION_5`, `PERF_RECORD_BUDGET_MS`.

## Dependencies

### Internal

None.

### External

None.

<!-- MANUAL: -->
