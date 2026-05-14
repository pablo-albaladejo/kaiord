<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# target

## Purpose

Target zone conversion for workout steps. Converts between FIT target types (power, heart rate, cadence, speed/pace, swim stroke) and KRD target union types. Handles zone indices, custom ranges (low/high bounds), and FTP-based power scaling.

## Key Files

| File                             | Description                                                     |
| -------------------------------- | --------------------------------------------------------------- |
| `target.converter.ts`            | Dispatcher: routes FIT target tuple to type-specific converter. |
| `target-power.converter.ts`      | Converts FIT power target (zone, custom range in watts).        |
| `target-heart-rate.converter.ts` | Converts FIT HR target (zone, custom range in bpm).             |
| `target-cadence.converter.ts`    | Converts FIT cadence target (zone, custom range in rpm).        |
| `target-pace.converter.ts`       | Converts FIT speed/pace target (zone, custom range in m/s).     |
| `target-stroke.converter.ts`     | Converts FIT swim stroke target (stroke type enum).             |
| `target.mapper.ts`               | Maps individual FIT target fields to KRD fields.                |
| `target.types.ts`                | Type definitions for FIT target data (FitTargetData).           |
| `power-helpers.ts`               | Power/FTP utilities: watts ↔ %FTP conversion.                   |

## Subdirectories

None.

## For AI Agents

### Working In This Directory

- **FIT target tuple:** (targetType, targetValue, targetHrZone, targetPowerZone, targetCadenceZone, targetSpeedZone, customTargetValueLow, customTargetValueHigh, customTargetPowerLow, customTargetPowerHigh, customTargetHeartRateLow, customTargetHeartRateHigh, customTargetCadenceLow, customTargetCadenceHigh, customTargetSpeedLow, customTargetSpeedHigh).
- **FIT target types:** Power, HR, cadence, speed, swim stroke (enum values).
- **KRD target:** Union type (PowerTarget | HeartRateTarget | CadenceTarget | PaceTarget | SwimStrokeTarget).
- **Zone indices:** FIT zones are numeric (1-7); KRD zones are string enums (e.g., "z1", "z2", ..., "z7").
- **Custom ranges:** FIT allows low/high bounds for custom zones; KRD exposes these in target objects.
- **Power scaling:** Watts and %FTP are interchangeable; conversion requires FTP value (stored in KRD metadata or activity context).

### Testing Requirements

- Unit tests for each target type converter (power, HR, cadence, pace, stroke).
- Tests verify zone enum mapping.
- Tests validate custom range handling.
- Round-trip tests verify power (±1W or ±1%FTP), HR (±1 bpm), cadence (±1 rpm).

### Common Patterns

- **FIT zone enum:** Integer 1–7 (FIT Profile defines zone breakpoints for each sport).
- **KRD zone string:** "z1", "z2", ..., "z7" (mapped via schema enum).
- **Power helpers:** `power-helpers.ts` provides watts ↔ %FTP calculation given FTP threshold.

## Dependencies

### Internal

- `@kaiord/core` - Target types, Logger.
- `../schemas/` - Target type schemas.

### External

None.

<!-- MANUAL: -->
