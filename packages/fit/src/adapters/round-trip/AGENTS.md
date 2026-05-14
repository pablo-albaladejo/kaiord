<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# round-trip

## Purpose

Round-trip conversion tests and benchmarks. Validates FIT ↔ KRD bidirectional fidelity within tolerance ranges. Tests exercise critical conversion paths and measure performance on large datasets.

## Key Files

| File                          | Description                                                             |
| ----------------------------- | ----------------------------------------------------------------------- |
| `round-trip-duration.test.ts` | Round-trip tests for duration type conversion.                          |
| `round-trip-notes.test.ts`    | Round-trip tests for step notes (truncation, preservation).             |
| `round-trip-subsport.test.ts` | Round-trip tests for sport/sub-sport enum mapping.                      |
| `perf-record-batch.test.ts`   | Performance benchmark for record batch conversion (10k records ≤500ms). |

## Subdirectories

None.

## For AI Agents

### Working In This Directory

- **Test pattern:** Create KRD object → convert to FIT → convert back to KRD → assert fields match within tolerance.
- **Tolerances:** Time ±1s, power ±1W or ±1%FTP, HR ±1 bpm, cadence ±1 rpm, coordinates ±5 decimals.
- **Performance budget:** Record batch conversion must process 10k records in ≤500ms.
- **Edge cases:** Truncation of long strings (notes max 256 chars in FIT), sport enum fallbacks, missing fields.

### Testing Requirements

- All round-trip tests must pass with current tolerances.
- Performance tests must execute within budget.
- Tests document expected lossy conversions (e.g., notes truncation).

### Common Patterns

- **Assert tolerance:** Use `toBeCloseTo(expected, decimals)` for numeric fields.
- **Lossy fields:** Notes truncation (FIT 256 char limit), some advanced metrics (TSS, normalized power).

## Dependencies

### Internal

- `@kaiord/core` - Test utilities, schemas.
- All adapter modules under `../`.

### External

- `vitest` - Test runner.

<!-- MANUAL: -->
