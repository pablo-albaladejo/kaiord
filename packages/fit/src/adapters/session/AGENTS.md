<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# session

## Purpose

Activity session metadata conversion. Converts FIT session messages (total time, distance, avg/max heart rate, avg/max power, normalized power, intensity factor, TSS) to KRD session metadata and vice versa.

## Key Files

| File                              | Description                                                       |
| --------------------------------- | ----------------------------------------------------------------- |
| `index.ts`                        | Exports converter types.                                          |
| `fit-to-krd-session.converter.ts` | Converts FIT session message to KRD session metadata.             |
| `krd-to-fit-session.converter.ts` | Converts KRD session metadata to FIT session message.             |
| `session.mapper.ts`               | Maps individual session fields (time, distance, HR, power stats). |

## Subdirectories

None.

## For AI Agents

### Working In This Directory

- **FIT session fields:** timestamp, totalElapsedTime, totalTimerTime, totalDistance, avgHeartRate, maxHeartRate, avgPower, maxPower, normalizedPower, totalAscent, totalDescent, intensityFactor, trainingStressScore, avgSpeed, maxSpeed, sport.
- **KRD session fields:** totalTime (ms), totalDistance (m), avgHeartRate, maxHeartRate, avgPower, maxPower, normalizedPower, intensityFactor, trainingStressScore, totalAscent, totalDescent, avgPace (sec/m), maxPace.
- **Unit conversions:** FIT uses seconds for time, meters for distance; KRD uses milliseconds for time.
- **Power metrics:** FIT avgPower, maxPower are watts; normalized power and TSS are proprietary Garmin calculations derived from power curve data (preserved during round-trip).

### Testing Requirements

- Unit tests for field-level mapping.
- Integration tests for full session conversion.
- Round-trip tests verify time (±1s), distance (meters), power (±1W).

### Common Patterns

- **Time unit conversion:** FIT seconds → KRD milliseconds (multiply by 1000).
- **Pace calculation:** KRD pace = duration / distance (seconds per meter); FIT speed = distance / duration (m/s).
- **Optional power stats:** If power data absent, omit avgPower, maxPower, normalizedPower, intensityFactor, trainingStressScore.

## Dependencies

### Internal

- `@kaiord/core` - KRD, Logger.
- `../shared/` - Type guards.

### External

None.

<!-- MANUAL: -->
