<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# src/adapters/round-trip/

## Purpose

Round-trip testing utilities and real-file verification. Validates KRD ↔ ZWO conversions preserve data within defined tolerances. Includes comparison helpers for step-by-step verification and tolerance checking.

## Key Files

| File                           | Description                                                               |
| ------------------------------ | ------------------------------------------------------------------------- |
| `zwift-round-trip.test.ts`     | Real Zwift file round-trip tests (ZWO → KRD → ZWO verification)           |
| `round-trip.test.ts`           | KRD → ZWO → KRD round-trip tests with tolerance validation                |
| `repetition-block-comparer.ts` | Helper for comparing RepetitionBlock structures with tolerance thresholds |

## Subdirectories

None.

## For AI Agents

### Working In This Directory

- **Round-trip tests**: Verify bidirectional conversion preserves data within defined tolerances. Not unit tests; they validate end-to-end conversion pipelines.
- **Real files**: `zwift-round-trip.test.ts` uses actual Zwift workout files from test fixtures to verify parser and writer handle real-world data.
- **Tolerance thresholds**: Applied at comparison time, not conversion time. Allows precision loss within acceptable limits.
- **Comparison helpers**: `repetition-block-comparer` checks step equality with ±1s, ±1W, ±1 bpm, ±1 rpm tolerances.

### Testing Requirements

- Vitest conventions: `it()` titles start with `"should "`, bodies have `// Arrange // Act // Assert` comments.
- Round-trip tests verify:
  - Sport preserved
  - Metadata preserved
  - Step count correct
  - Targets within tolerance
  - Duration within tolerance
- Real Zwift file tests exercise parser on actual files and verify no data loss.

### Common Patterns

- **Tolerance comparison**:

  ```typescript
  // Check power within ±1W or ±1% FTP
  abs(actualPower - expectedPower) <= 1 ||
    abs(actualPower - expectedPower) / ftp <= 0.01;

  // Check time within ±1s
  abs(actualSeconds - expectedSeconds) <= 1;
  ```

- **Comparer pattern**:
  ```typescript
  compareRepetitionBlock(actual, expected, metadata, tolerance)
  -> { passed: boolean, failures: string[] }
  ```

## Dependencies

### Internal

- `@kaiord/core` (KRD, RepetitionBlock, WorkoutStep, Logger)
- `../` (converters, readers, writers)

### External

- None directly

<!-- MANUAL: -->
