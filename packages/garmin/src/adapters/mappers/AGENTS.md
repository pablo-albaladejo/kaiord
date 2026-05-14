<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# src/adapters/mappers

## Purpose

Pure enum and domain mappers for GCN ↔ KRD conversion. Translate between KRD domain enums (snake_case) and GCN format enums (camelCase IDs and keys), plus specialized mappers for pace zones and pool info.

## Key Files

| File                           | Description                                                                                             |
| ------------------------------ | ------------------------------------------------------------------------------------------------------- |
| `sport.mapper.ts`              | Maps KRD sport (`running`, `cycling`, etc.) ↔ GCN `sportTypeId`/`sportTypeKey`.                         |
| `condition.mapper.ts`          | Maps KRD condition (`open`, `lap`, `rest`, etc.) ↔ GCN `conditionTypeId`/`conditionTypeKey`.            |
| `equipment.mapper.ts`          | Maps KRD equipment (`goggles`, `kickboard`, etc.) ↔ GCN `equipmentTypeId`/`equipmentTypeKey`.           |
| `intensity.mapper.ts`          | Maps KRD intensity (`easy`, `moderate`, `hard`, etc.) ↔ GCN `intensityTypeId`/`intensityTypeKey`.       |
| `stroke.mapper.ts`             | Maps KRD stroke (`freestyle`, `backstroke`, `breaststroke`, etc.) ↔ GCN `strokeTypeId`/`strokeTypeKey`. |
| `target.converter.ts`          | Converts KRD target (power/HR/speed/cadence) ↔ GCN target structures. Handles pace zones.               |
| `target.converter.test.ts`     | Unit tests for target conversion. Tests all target types, zone boundaries, pace conversions.            |
| `target-to-garmin.mapper.ts`   | Maps KRD target fields → GCN target object (trainer-agnostic structure).                                |
| `target-from-garmin.mapper.ts` | Maps GCN target structure → KRD target fields (inverse of above).                                       |
| `target-pace.mapper.ts`        | Pace zone conversion for running. Maps KRD speed ranges ↔ GCN `trainingSpeedZone`.                      |
| `target-types.ts`              | Type definitions for pace zone table and conversion options.                                            |

## For AI Agents

### Working In This Directory

**Mapper Pattern:**

- Pure transformations: **input → output with no side effects or logging**.
- **No unit tests** (mappers tested via converter tests in `converters/`).
- Keep ≤40 LOC; prefer simple pattern matching or lookup tables.
- Single responsibility: one mapping (sport, condition, equipment, etc.).

**Naming Convention:**

- `*.mapper.ts` for pure enum/value mapping (no tests).
- `*.converter.ts` when logic complexity requires tests (e.g., `target.converter.ts`).

**Enum Mapping Pattern:**

```typescript
// sport.mapper.ts example
export const mapKrdSportToGarmin = (sport: string): { sportTypeId: number; sportTypeKey: string } => {
  const mapping = { running: { id: 1, key: "running" }, cycling: { id: 2, key: "cycling" }, ... };
  return mapping[sport] || { id: 0, key: "unknown" };
};
```

**Target Mapping Complexity:**

- `target.converter.ts` handles complex target logic (zone calculations, pace conversion).
- Tests verify zone boundaries, pace precision (±1bpm, ±1W, ±1%FTP, ±1rpm).
- Sub-mappers (`target-to-garmin.mapper.ts`, `target-from-garmin.mapper.ts`) handle simpler transformations.

**Pace Zone Table:**

- `PaceZoneTable` type exported from `target.converter.ts`.
- Callers may inject custom pace zones via `GarminWriterOptions.paceZones`.
- Maps speed (m/s) ranges → Garmin pace zone definitions.
- Example use case: converting running intervals with pace targets to Garmin zones.

### Testing Requirements

**Mappers:** No dedicated unit tests required. Mappers are tested implicitly via:

- Converter unit tests (`converters/*.converter.test.ts`).
- Round-trip integration tests (`round-trip/round-trip.test.ts`).

**Target Converter:** Tested explicitly in `target.converter.test.ts` due to complexity.

- Coverage: 80%+.
- Test conventions: every `it()` starts with `"should "`, uses AAA sections.
- Round-trip tolerances: power ±1W or ±1%FTP, HR ±1bpm, cadence ±1rpm, pace ±1 second per km/mile.

### Common Patterns

**Lookup Table Pattern:**

```typescript
const equipmentMap = {
  goggles: { id: 5, key: "goggles" },
  kickboard: { id: 6, key: "kickboard" },
  // ...
};

export const mapKrdEquipmentToGarmin = (equipment: string) =>
  equipmentMap[equipment] || { id: 0, key: "unknown" };
```

**Bidirectional Mapping:**

- `mapKrdSportToGarmin(krd) → GCN` for KRD → GCN conversion.
- `mapGarminSportToKrd(gcn) → KRD` for GCN → KRD conversion.
- Both directions tested via round-trip tests.

**Zone/Range Conversion:**

- `target-pace.mapper.ts` converts speed ranges (m/s) to Garmin pace zones.
- Pace zones are running-specific; not applicable to cycling/swimming.
- Stored as optional `PaceZoneTable` in `target.converter.ts` for reuse.

**Error Handling:**

- Mappers do not throw; they return a fallback (e.g., `{ id: 0, key: "unknown" }`).
- Converters validate mapper outputs and throw if invalid.

## Dependencies

### Internal

- `@kaiord/core`: Domain types and enums (for type safety).
- Converters in `../converters/`: for composition in complex cases.

### External

- No external dependencies (pure functions).

<!-- MANUAL: -->
