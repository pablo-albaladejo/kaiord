<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# duration

## Purpose

Workout step duration type mapping. Converts between FIT duration tuples (durationType, durationValue, durationTime, durationDistance, durationHr, durationStep, durationPowerZone, etc.) and KRD step duration union types (simple time/distance, repeat, conditional HR/power zone).

## Key Files

| File                            | Description                                                       |
| ------------------------------- | ----------------------------------------------------------------- |
| `duration.converter.ts`         | Dispatcher: routes FIT duration tuple to type-specific converter. |
| `duration.mapper.ts`            | Maps individual FIT duration fields to KRD fields.                |
| `duration-converters.ts`        | Aggregates duration type-specific converters.                     |
| `repeat-duration-converters.ts` | Aggregates repeat duration converters.                            |

## Subdirectories

None (see `../krd-to-fit/duration-converters/AGENTS.md` for KRD→FIT converters).

## For AI Agents

### Working In This Directory

- **FIT duration tuple:** (durationType, durationValue, durationTime, durationDistance, durationHr, durationStep, durationPowerZone, durationHrZone, durationCadenceZone, durationSpeedZone).
- **Duration types:** Time, distance, HR zone, power zone, cadence zone, speed zone, repeat steps (enum values).
- **KRD duration:** Union of simple (time/distance/calories), repeat (step count + optional HR/cadence/power), conditional (HR/power/cadence/speed zones).
- **Dispatch logic:** `duration.converter.ts` examines FIT durationType and routes to appropriate converter.

### Testing Requirements

- Unit tests for FIT→KRD duration conversion.
- Tests for all duration type branches (time, distance, zones, repeat).
- Round-trip tests verify duration preservation.

### Common Patterns

- **FIT duration type enum:** Numeric identifiers (e.g., 0=time, 1=distance, 2=HR zone, 3=power zone).
- **KRD duration union:** Each variant (SimpleDuration, RepeatDuration, ConditionalDuration) has distinct shape.

## Dependencies

### Internal

- `@kaiord/core` - StepDuration types, Logger.
- `../schemas/` - Duration type schemas.

### External

None.

<!-- MANUAL: -->
