<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# src/adapters/zwift-to-krd/

## Purpose

ZWO → KRD extraction logic. Extracts metadata, intervals, and tags from parsed ZWO XML into KRD domain. Handles interval type detection, step expansion, target restoration, and round-trip data recovery (FIT attributes from kaiord namespace).

## Key Files

| File                     | Description                                                                                              |
| ------------------------ | -------------------------------------------------------------------------------------------------------- |
| `metadata-extractor.ts`  | Extracts ZWO metadata (author, name, description, sport, duration type) into KRD metadata and extensions |
| `intervals-extractor.ts` | Extracts ZWO interval elements and tags into KRD WorkoutStep array                                       |
| `intervals-processor.ts` | Post-processes extracted intervals (cleanup, normalization, merging)                                     |

## Subdirectories

None.

## For AI Agents

### Working In This Directory

- **Extractor pattern**: Extract metadata and intervals from parsed ZWO XML object. Delegates to interval mappers in `../interval/` for type-specific handling.
- **Metadata extraction**: Reads ZWO `author`, `name`, `description`, `sportType`, `durationType`, `thresholdSecPerKm`. Restores FIT attributes from kaiord namespace.
- **Interval extraction**: Iterates ZWO `workout` element, detects interval type, invokes corresponding mapper from `../interval/`.
- **Tags extraction**: ZWO `tags` → KRD `extensions.zwift.tags` array.
- **Post-processing**: Intervals processor handles final cleanup and validation before returning to converter.

### Testing Requirements

- Vitest conventions: `it()` titles start with `"should "`, bodies have `// Arrange // Act // Assert` comments.
- No individual extractor tests; integration tested via parent `zwift-to-krd.converter.test.ts`.
- Round-trip tests in `round-trip/` verify extractor output produces valid KRD with correct sport, metadata, and step counts.

### Common Patterns

- **Metadata extraction**:

  ```typescript
  extractMetadata(workoutFile) -> {
    metadata: { sport, created_at?, name?, ... },
    fitExtensions: { timeCreated?, manufacturer?, ... } (optional)
  }
  ```

- **Tag extraction**:

  ```typescript
  extractTags(tags): string[]
  // Handles singular and array tag formats
  ```

- **FIT namespace recovery**:

  ```typescript
  "@_kaiord:timeCreated" → metadata.created_at
  "@_kaiord:manufacturer" → extensions.fit.manufacturer
  ```

- **Interval detection**: Delegates to `interval-type-detector` which routes to appropriate mapper.

## Dependencies

### Internal

- `@kaiord/core` (KRD, WorkoutStep, Metadata, Logger)
- `../interval/` (interval mappers and text event extraction)

### External

- None directly

<!-- MANUAL: -->
