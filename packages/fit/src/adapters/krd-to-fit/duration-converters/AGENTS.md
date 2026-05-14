<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# duration-converters

## Purpose

Duration type-specific converters for KRD→FIT. Each converter handles a particular KRD step duration type (simple time/distance, repeat, conditional, repeat with HR/power target) and maps it to FIT duration fields (durationType, durationValue, durationTime, durationDistance, durationHr, durationPowerZone, etc.).

## Key Files

| File                 | Description                                                                            |
| -------------------- | -------------------------------------------------------------------------------------- |
| `simple.ts`          | Converts simple durations (time, distance) to FIT fields.                              |
| `repeat.ts`          | Converts repeat durations (step repeat count, repeat HR/cadence/power) to FIT fields.  |
| `conditional.ts`     | Converts conditional durations (HR zone, power zone, cadence zone) to FIT zone fields. |
| `repeat-hr-power.ts` | Converts repeat durations with HR/power targets to FIT power/HR zone fields.           |

## Subdirectories

None.

## For AI Agents

### Working In This Directory

- **Duration types:** KRD defines step duration as a union of simple (time/distance), repeat, and conditional (HR/power zone) types.
- **FIT fields:** FIT encodes duration as tuple (durationType, durationValue, durationTime, durationDistance, durationHr, durationStep, durationPowerZone, durationHrZone, durationCadenceZone, durationSpeedZone).
- **Dispatch:** Parent `../krd-to-fit-duration.mapper.ts` examines KRD duration type and calls the appropriate converter.
- **No validation:** These converters assume valid KRD input (parent has already validated with Zod).

### Testing Requirements

- Unit tests for each converter (simple, repeat, conditional, repeat-hr-power).
- Round-trip tests verify KRD→FIT→KRD duration fidelity.

### Common Patterns

- **Simple durations:** Fill `durationValue`, `durationTime`, or `durationDistance`; leave others undefined.
- **Repeat durations:** Fill `durationStep` (step count), optionally `repeatHr`/`repeatCadence`/`repeatPower`.
- **Conditional durations:** Fill `durationHrZone`, `durationPowerZone`, `durationCadenceZone`, `durationSpeedZone` (zone indices).

## Dependencies

### Internal

- `@kaiord/core` - KRD types (StepDuration and variants).

### External

None.

<!-- MANUAL: -->
