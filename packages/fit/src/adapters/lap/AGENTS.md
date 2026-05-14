<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# lap

## Purpose

Lap segmentation conversion. Maps FIT lap messages (auto-pause splits, distance, trigger type) to KRD lap records and vice versa. Handles lap trigger types (manual, distance, position, power, cadence, heart rate, time).

## Key Files

| File                          | Description                                                 |
| ----------------------------- | ----------------------------------------------------------- |
| `index.ts`                    | Exports converter types.                                    |
| `fit-to-krd-lap.converter.ts` | Converts FIT lap messages to KRD lap records.               |
| `krd-to-fit-lap.converter.ts` | Converts KRD lap records to FIT lap messages.               |
| `fit-to-krd-lap.mapper.ts`    | Maps individual FIT lap fields (time, distance, HR, power). |
| `krd-to-fit-lap.mapper.ts`    | Maps individual KRD lap fields to FIT fields.               |
| `lap-trigger.mapper.ts`       | Maps FIT lap trigger type enum to KRD trigger type.         |

## Subdirectories

None.

## For AI Agents

### Working In This Directory

- **FIT lap fields:** timestamp, startTime, totalElapsedTime, totalTimerTime, totalDistance, messageIndex, eventType, eventSubType, lapTrigger (enum).
- **KRD lap fields:** totalTime (ms), totalDistance (m), trigger (trigger type string).
- **Lap trigger types:** Manual, distance, position, power, cadence, heart rate, time (FIT enum → KRD string).
- **Time semantics:** FIT startTime is when the lap began; totalTimerTime is active time (excluding pauses).

### Testing Requirements

- Unit tests for field mapping and trigger type enum conversion.
- Integration tests for lap array conversion.
- Round-trip tests verify time (±1s), distance (meters).

### Common Patterns

- **Lap trigger dispatch:** `lap-trigger.mapper.ts` maps FIT enum to KRD string (e.g., "manual", "distance", "heart_rate").
- **Time aggregation:** Laps may have totalTimerTime (active) vs. totalElapsedTime (wall clock); KRD uses totalTime (active).

## Dependencies

### Internal

- `@kaiord/core` - KRD, Lap, Logger.
- `../shared/` - Type guards.

### External

None.

<!-- MANUAL: -->
