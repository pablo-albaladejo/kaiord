<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# src/adapters/duration/

## Purpose

Duration encoding/decoding logic for time-based vs. distance-based workouts. ZWO supports both duration types; this module handles the conversions and mappings between KRD WorkoutStep and ZWO duration attributes.

## Key Files

| File                         | Description                                                |
| ---------------------------- | ---------------------------------------------------------- |
| `duration.converter.ts`      | Main converter logic for duration bidirectional conversion |
| `duration.converter.test.ts` | Tests for duration conversion edge cases                   |
| `duration.mapper.ts`         | Simple mapper for duration attribute extraction from ZWO   |

## Subdirectories

None.

## For AI Agents

### Working In This Directory

- **Duration types**: ZWO supports `"time"` (seconds) and `"distance"` (kilometers). KRD WorkoutStep uses `duration_ms` and `distance_km`.
- **Converter logic**: Maps between the two representations. Test covers unit conversions, rounding, and edge cases.
- **Mapper pattern**: `duration.mapper.ts` is a simple extractor (no logic, <20 LOC, no tests).

### Testing Requirements

- Vitest conventions apply: `it()` titles start with `"should "`, bodies have `// Arrange // Act // Assert` comments.
- Tests cover unit conversions: seconds ↔ milliseconds, kilometers ↔ meters.
- Round-trip tolerance: ±1s for time, ±1 meter for distance.

### Common Patterns

- Duration mapped in both directions: KRD WorkoutStep duration_ms → ZWO seconds, ZWO distance → KRD distance_km.
- Rounding handled consistently across conversions.

## Dependencies

### Internal

- `@kaiord/core` (WorkoutStep, KRD types)

### External

- `zod` (schema validation)

<!-- MANUAL: -->
