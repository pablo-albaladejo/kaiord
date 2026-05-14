<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# record

## Purpose

Time-series record (sample) conversion between FIT and KRD. Handles per-second activity data (heart rate, power, cadence, elevation, temperature, coordinates, running dynamics, etc.) in both directions.

## Key Files

| File                             | Description                                             |
| -------------------------------- | ------------------------------------------------------- |
| `index.ts`                       | Exports mapper types.                                   |
| `fit-to-krd-record.converter.ts` | Converts FIT record messages to KRD TimeSeries samples. |
| `krd-to-fit-record.converter.ts` | Converts KRD TimeSeries samples to FIT record messages. |
| `record-from-fit.mapper.ts`      | Maps individual FIT record fields to KRD sample fields. |
| `record-to-fit.mapper.ts`        | Maps individual KRD sample fields to FIT record fields. |
| `record.mapper.ts`               | Re-exports mappers.                                     |

## Subdirectories

None.

## For AI Agents

### Working In This Directory

- **Record batching:** Activity files contain 1000s of records. Converters process in batches for performance (target: 10k records ≤500ms).
- **FIT record fields:** timestamp, heart_rate, cadence, power, speed, elevation, temperature, coordinates (lat/lon as semicircles), running dynamics (vertical oscillation, stance time, step length).
- **KRD sample fields:** timestamp, heartRate, cadence, power, pace, elevation, temperature, coordinates, runningDynamics.
- **Coordinate conversion:** FIT uses semicircles (2^31 units = 180°); `../shared/coordinate.converter.ts` handles conversion.
- **Optional fields:** Most record fields are optional; omit if not present in source.

### Testing Requirements

- Unit tests for field-level mapping.
- Integration tests for batch conversion.
- Performance test validates 10k-record batch ≤500ms (budget: 500ms).
- Round-trip tests verify coordinate precision (±5 decimals).

### Common Patterns

- **FIT field names:** camelCase (e.g., `heartRate`, `cadence`, `speed`, `enhancedSpeed`, `enhancedAltitude`).
- **Coordinate conversion:** Semicircles ↔ degrees via `../shared/coordinate.converter.ts`.
- **Running dynamics:** Optional nested object with vert_osc, stance_time, step_length.

## Dependencies

### Internal

- `@kaiord/core` - KRD, TimeSeries, Logger.
- `../shared/` - Coordinate conversion.

### External

None.

<!-- MANUAL: -->
