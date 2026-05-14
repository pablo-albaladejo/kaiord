<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# src/adapters/target/

## Purpose

Target conversion between KRD domain and ZWO domain. Handles bidirectional mapping of power (watts/FTP %), pace (min/km), heart rate (bpm), and cadence (rpm) targets. Encodes KRD → ZWO and decodes ZWO → KRD with unit conversions and FTP-relative calculations.

## Key Files

| File                             | Description                                                          |
| -------------------------------- | -------------------------------------------------------------------- |
| `index.ts`                       | Re-exports all target converters and mappers                         |
| `power.converter.ts`             | Power target conversion (watts ↔ FTP %) with absolute/relative logic |
| `power.converter.test.ts`        | Tests for power conversion edge cases and rounding                   |
| `pace-cadence.converter.ts`      | Pace (min/km) and cadence (rpm) conversions                          |
| `pace-cadence.converter.test.ts` | Tests for pace/cadence conversions                                   |
| `target.converter.ts`            | Main target type converter (dispatches by target type)               |
| `target.converter.test.ts`       | Integration tests for target conversion                              |
| `target.mapper.ts`               | Simple mapper for target attribute extraction from ZWO               |
| `krd-to-zwift.mapper.ts`         | KRD → ZWO target mapper (encodes target for XML)                     |
| `zwift-to-krd.mapper.ts`         | ZWO → KRD target mapper (decodes target from XML)                    |

## Subdirectories

None.

## For AI Agents

### Working In This Directory

- **Converter pattern**: Power, pace, cadence converters are domain logic with tests. They handle unit conversions, rounding, and FTP-relative calculations.
- **Mapper pattern**: Simple mappers (`*.mapper.ts`) extract or format target attributes without logic (<20 LOC, no tests).
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

- `zod` (schema validation)

<!-- MANUAL: -->
