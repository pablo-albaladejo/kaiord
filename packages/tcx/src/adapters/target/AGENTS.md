<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 -->

# target

## Purpose

TCX Target ↔ KRD Target conversion. Maps heart rate, pace, and cadence targets between formats. Handles target type resolution (zone vs. custom range) and unit conversions (pace in min/km vs. speed in m/s).

## Key Files

| File                             | Description                                                                                  |
| -------------------------------- | -------------------------------------------------------------------------------------------- |
| `target.converter.ts`            | Re-export dispatcher: `convertTcxTarget()` → KRD Target from TCX structure.                  |
| `krd-to-tcx.converter.ts`        | Re-export dispatcher: `convertKrdTargetToTcx()` → TCX Target structure from KRD.             |
| `tcx-to-krd.converter.ts`        | Main TCX → KRD target logic. Maps zone/range targets; delegates to type-specific converters. |
| `heart-rate.converter.ts`        | Heart rate zone/range → KRD HR target. Maps zone number to HR bpm bounds.                    |
| `cadence.converter.ts`           | Cadence zone/range → KRD cadence target. Maps zone number to cadence bounds.                 |
| `pace.converter.ts`              | Pace zone/range → KRD pace target. Converts TCX pace (s/100m) to KRD pace (min/km).          |
| `tcx-target-walker.converter.ts` | State machine to walk TCX Step/Repeat structure, extracting duration and targets.            |
| `heart-rate.mapper.ts`           | Simple HR zone number → (min, max) bpm mapping table (no tests).                             |
| `target.mapper.ts`               | Simple target type mapping (zone enum → KRD target type).                                    |
| `krd-to-tcx.mapper.ts`           | Simple KRD target type → TCX type mapping.                                                   |
| `tcx-to-krd-target.types.ts`     | Type definitions for internal target conversion structures.                                  |
| `tcx-to-krd-target.helpers.ts`   | Utility functions for target extraction and validation.                                      |

## Subdirectories

None. All converters in flat structure.

## For AI Agents

### Working In This Directory

**Conversion Flow (TCX → KRD):**

1. `tcx-to-krd.converter.ts`: Entry point. Receives TCX Step, extracts target structure.
2. Determine target type:
   - If `Zone` element: type is `zone` (e.g., HR zone 3).
   - If range (e.g., `LowRange`, `HighRange`): type is `custom_range`.
3. Delegate to type-specific converter:
   - `heart-rate.converter.ts`: Zone/range → KRD HR target.
   - `cadence.converter.ts`: Zone/range → KRD cadence target.
   - `pace.converter.ts`: Zone/range → KRD pace target (with unit conversion).
4. Return KRD Target object.

**Conversion Flow (KRD → TCX):**

1. `krd-to-tcx.converter.ts`: Entry point. Receives KRD Target.
2. Map KRD target type to TCX element structure.
3. If `zone`: construct `Zone` element with zone number.
4. If `custom_range`: construct range elements (e.g., `LowRange`, `HighRange`).
5. Return TCX Target structure (plain object).

**Target Types (KRD):**

- `heart_rate`: Zone (1-5) or custom range (bpm).
- `cadence`: Zone (1-6) or custom range (rpm).
- `pace`: Zone (1-7, map to min/km) or custom range (min/km).
- `power`: Zone (1-7, FTP-based) or custom range (watts).
- `generic`: No specific target (used if unspecified).

**TCX → KRD Unit Conversions:**

- Pace: TCX uses seconds per 100 meters; KRD uses minutes per kilometer.
  - Formula: `KRD pace (min/km) = (TCX pace (s/100m) * 10) / 60`.
  - Reverse: `TCX pace (s/100m) = (KRD pace (min/km) * 60) / 10`.

**File Naming:**

- `*.converter.ts`: Domain logic, tested.
- `*.mapper.ts`: Identity or enum mapping, no tests.
- `*.helper.ts`: Utility functions.

### Testing Requirements

**Coverage:** 80% (converters only; mappers excluded).

**Test Files:**

- `heart-rate.converter.test.ts`: HR zone/range → KRD conversion.
- `cadence.converter.test.ts`: Cadence zone/range → KRD conversion.
- `pace.converter.test.ts`: Pace zone/range, unit conversion, bounds.
- `target.converter.test.ts`: Top-level target dispatcher logic.
- `tcx-target-walker.converter.test.ts`: TCX Step/Repeat walking, target extraction.
- `krd-to-tcx.converter.test.ts`: KRD → TCX mapping, reverse unit conversion.
- `tcx-to-krd.converter.test.ts`: TCX → KRD dispatcher.

**Test Conventions:**

- Every `it()` title starts with `"should "`.
- Every `it()` body has `// Arrange`, `// Act`, `// Assert`.

**Round-Trip Tolerances (for pace/speed conversions):**

- Pace: ±1s per 100m or ±0.01 min/km (whichever is larger).
- Speed: ±1% or ±0.1 m/s.

### Common Patterns

**Zone Mapping (HR Example):**

```typescript
// HR zone 3 → 130-150 bpm (example)
const HR_ZONE_MAP = {
  1: { min: 100, max: 130 },
  2: { min: 130, max: 160 },
  3: { min: 160, max: 180 },
  // ...
};
```

**Unit Conversion (Pace Example):**

```typescript
// TCX pace in s/100m → KRD pace in min/km
const tcxPaceS100m = 500; // seconds per 100m
const krdPaceMinKm = (tcxPaceS100m * 10) / 60; // min/km
```

**Target Type Resolution:**

```typescript
const target = tcxStep.Target;
if (target.Zone) {
  // Zone target: extract zone number, look up bounds
  const zone = target.Zone.Number;
} else if (target.LowRange !== undefined && target.HighRange !== undefined) {
  // Range target: use low and high directly
  const low = target.LowRange;
  const high = target.HighRange;
}
```

**Logger Usage:**

- Log target type resolved, zone number or range bounds.
- Log unit conversions (e.g., pace conversion factor).
- Use `logger.debug()` for detailed extraction, `logger.info()` for major steps.

**Extensions:**

- TCX may have custom target extensions in `Extensions` blocks.
- Preserve as `extensions: { tcx: { /* raw */ } }` in KRD target.

## Dependencies

### Internal

- `@kaiord/core`: Target, HR/cadence/pace/power target types, Logger.
- Sibling modules:
  - `../duration/duration-walker.converter.ts` (may need to walk TCX structure together).
  - `../schemas/tcx-target.ts` (target type enums).

### External

None (type-only imports from core).
