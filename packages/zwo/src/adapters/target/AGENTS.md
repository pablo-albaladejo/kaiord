<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# src/adapters/target/

## Purpose

Target conversion between KRD domain and ZWO domain. Handles bidirectional mapping of power (watts/FTP %), pace (min/km), heart rate (bpm), and cadence (rpm) targets. Encodes KRD → ZWO and decodes ZWO → KRD with unit conversions and FTP-relative calculations.

## Key Files

| File                             | Description                                                          |
| -------------------------------- | -------------------------------------------------------------------- |
| `power.converter.ts`             | Power target conversion (watts ↔ FTP %) with absolute/relative logic |
| `power.converter.test.ts`        | Tests for power conversion edge cases and rounding                   |
| `pace-cadence.converter.ts`      | Pace (min/km) and cadence (rpm) conversions                          |
| `pace-cadence.converter.test.ts` | Tests for pace/cadence conversions                                   |

## Subdirectories

None.

## For AI Agents

### Working In This Directory

- **Converter pattern**: Power, pace, cadence converters are domain logic with tests. They handle unit conversions, rounding, and FTP-relative calculations.
- **Power targets**: ZWO supports absolute (watts) and relative (FTP %) power. KRD uses absolute watts. Conversion handles fallback when FTP missing.
- **Pace targets**: ZWO pace in seconds/km; KRD in meters/second (or km/hour). Converter handles the unit transformation.
- **HR and cadence targets**: Direct bpm/rpm conversions with min/max bounds checking.

### Testing Requirements

- Vitest conventions: `it()` titles start with `"should "`, bodies have `// Arrange // Act // Assert` comments.
- Power tests cover absolute watts, FTP percentage, missing FTP fallback, and rounding.
- Pace/cadence tests cover unit conversions and boundary cases.
- Target converter tests verify dispatch to correct sub-converter based on target type.
- Round-trip tolerance: ±1W power, ±1 bpm HR, ±1 rpm cadence, ±0.1 min/km pace.

### Common Patterns

- **Power conversion**:

  ```typescript
  // KRD → ZWO: absolute watts or FTP percentage
  if (krdTarget.type === "power") {
    zwiftTarget.@_power = krdTarget.absolute_watts ||
                          (krdTarget.ftp_percent * metadata.ftp / 100);
  }

  // ZWO → KRD: always absolute watts
  krdTarget = { type: "power", absolute_watts: zwiftPower };
  ```

- **Pace conversion**:

  ```typescript
  // KRD meters/second → ZWO seconds/km: (1000 / metersPerSecond)
  // ZWO seconds/km → KRD meters/second: (1000 / secondsPerKm)
  ```

- **Cadence**: Direct bpm ↔ rpm mapping (no unit conversion).

- **Dispatch logic**: `target.converter` checks target type and delegates to power/pace-cadence converter.

## Dependencies

### Internal

- `@kaiord/core` (Target, Metadata, Logger)

### External

- None

<!-- MANUAL: -->
