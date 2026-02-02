# Plan: Phase 2 FIT LAP Message Implementation

## Summary

Implement FIT LAP message (ID 19) bidirectional conversion. LAP messages contain per-lap/interval statistics essential for structured workouts and activity analysis.

**Reference**: `docs/roadmap-fit-implementation.md` (Phase 2.1)

---

## Phase Overview

| Task | Priority | Effort | Files |
|------|----------|--------|-------|
| 2.1 Extend KRD Lap Schema | High | 0.5 days | 1 modified |
| 2.2 FIT LAP Schema | High | 0.5 days | 2 new |
| 2.3 LAP Converters | High | 1 day | 5 new files |
| 2.4 Integration | High | 0.5 days | 1 modified |

---

## 2.1 Extend KRD Lap Schema

**File**: `packages/core/src/domain/schemas/krd/lap.ts`

### Current Schema (minimal)
```typescript
export const krdLapSchema = z.object({
  startTime: z.string().datetime(),
  totalElapsedTime: z.number().min(0),
  totalDistance: z.number().min(0).optional(),
  avgHeartRate: z.number().int().min(0).max(300).optional(),
  maxHeartRate: z.number().int().min(0).max(300).optional(),
  avgCadence: z.number().min(0).optional(),
  avgPower: z.number().min(0).optional(),
});
```

### Fields to Add
```typescript
// Timing
totalTimerTime: z.number().min(0).optional(),

// Performance metrics
maxCadence: z.number().min(0).optional(),
maxPower: z.number().min(0).optional(),
normalizedPower: z.number().min(0).optional(),
avgSpeed: z.number().min(0).optional(),
maxSpeed: z.number().min(0).optional(),

// Elevation
totalAscent: z.number().min(0).optional(),
totalDescent: z.number().min(0).optional(),

// Calories
totalCalories: z.number().int().min(0).optional(),

// Classification
trigger: lapTriggerSchema.optional(),
sport: z.string().optional(),
subSport: z.string().optional(),

// Workout reference
workoutStepIndex: z.number().int().min(0).optional(),

// Swimming (optional)
numLengths: z.number().int().min(0).optional(),
swimStroke: z.string().optional(),
```

---

## 2.2 FIT LAP Schema

### File 1: `packages/core/src/adapters/fit/schemas/fit-lap-trigger.ts`

```typescript
export const fitLapTriggerSchema = z.enum([
  "manual",
  "time",
  "distance",
  "positionStart",
  "positionLap",
  "positionWaypoint",
  "positionMarked",
  "sessionEnd",
  "fitnessEquipment",
]);
```

### Trigger Mapping (FIT → KRD)
| FIT LapTrigger | KRD trigger |
|----------------|-------------|
| manual | "manual" |
| time | "time" |
| distance | "distance" |
| positionStart/Lap/Waypoint/Marked | "position" |
| sessionEnd | "session_end" |
| fitnessEquipment | "fitness_equipment" |

### File 2: `packages/core/src/adapters/fit/schemas/fit-lap.ts`

```typescript
export const fitLapSchema = z.object({
  messageIndex: z.number().optional(),
  timestamp: z.number(),
  startTime: z.number(),
  totalElapsedTime: z.number(),
  totalTimerTime: z.number(),
  totalDistance: z.number().optional(),
  avgSpeed: z.number().optional(),
  maxSpeed: z.number().optional(),
  enhancedAvgSpeed: z.number().optional(),
  enhancedMaxSpeed: z.number().optional(),
  avgHeartRate: z.number().optional(),
  maxHeartRate: z.number().optional(),
  avgCadence: z.number().optional(),
  maxCadence: z.number().optional(),
  avgPower: z.number().optional(),
  maxPower: z.number().optional(),
  normalizedPower: z.number().optional(),
  totalAscent: z.number().optional(),
  totalDescent: z.number().optional(),
  totalCalories: z.number().optional(),
  lapTrigger: fitLapTriggerSchema.optional(),
  sport: fitSportSchema.optional(),
  subSport: fitSubSportSchema.optional(),
  numLengths: z.number().optional(),
  swimStroke: z.number().optional(),
  wktStepIndex: z.number().optional(),
});
```

---

## 2.3 LAP Converters

### Directory Structure
```
packages/core/src/adapters/fit/lap/
├── index.ts
├── lap.mapper.ts              # No tests (thin translation)
├── lap-trigger.mapper.ts      # No tests (thin translation)
├── fit-to-krd-lap.converter.ts
├── fit-to-krd-lap.converter.test.ts
├── krd-to-fit-lap.converter.ts
└── krd-to-fit-lap.converter.test.ts
```

### lap.mapper.ts (Pattern from session.mapper.ts)
```typescript
export const mapFitLapToKrd = (fit: FitLap): KRDLap => ({
  startTime: new Date(fit.startTime * 1000).toISOString(),
  totalElapsedTime: fit.totalElapsedTime / 1000,
  totalTimerTime: fit.totalTimerTime !== undefined
    ? fit.totalTimerTime / 1000
    : undefined,
  avgSpeed: fit.enhancedAvgSpeed ?? fit.avgSpeed,
  maxSpeed: fit.enhancedMaxSpeed ?? fit.maxSpeed,
  // ... other fields
  trigger: fit.lapTrigger ? mapFitLapTriggerToKrd(fit.lapTrigger) : undefined,
});

export const mapKrdLapToFit = (krd: KRDLap): Partial<FitLap> => ({
  startTime: Math.floor(new Date(krd.startTime).getTime() / 1000),
  totalElapsedTime: krd.totalElapsedTime * 1000,
  totalTimerTime: krd.totalTimerTime !== undefined
    ? krd.totalTimerTime * 1000
    : krd.totalElapsedTime * 1000,
  // ... other fields
});
```

### fit-to-krd-lap.converter.ts
```typescript
export const convertFitToKrdLap = (data: Record<string, unknown>): KRDLap => {
  const fitLap = fitLapSchema.parse(data) as FitLap;
  return mapFitLapToKrd(fitLap);
};

export const convertFitToKrdLaps = (
  laps: Record<string, unknown>[]
): KRDLap[] => laps.map(convertFitToKrdLap);
```

### Test Strategy (AAA pattern)
```typescript
describe("convertFitToKrdLap", () => {
  it("should convert FIT lap with required fields", () => {
    // Arrange
    const fitLap = { timestamp: 1704067200, startTime: 1704067200, ... };

    // Act
    const result = convertFitToKrdLap(fitLap);

    // Assert
    expect(result.startTime).toBe("2024-01-01T00:00:00.000Z");
  });
});
```

### Test Cases
- Convert lap with required fields only
- Convert lap with performance metrics (HR, power, cadence)
- Prefer enhanced speed over regular
- Convert lap with elevation data
- Convert lap with all trigger types
- Convert lap with swimming fields
- Preserve zero totalTimerTime
- Round-trip: KRD → FIT → KRD preserves data
- Throw error for invalid data

---

## 2.4 Integration

### File: `packages/core/src/adapters/fit/messages/activity.mapper.ts`

```typescript
import { convertFitToKrdLaps } from "../lap";

export const mapActivityFileToKRD = (messages, logger): KRD => {
  // ... existing code
  const lapMsgs = messages[fitMessageKeySchema.enum.lapMesgs] || [];

  logger.debug("Mapping activity file", {
    sessions: sessionMsgs.length,
    records: recordMsgs.length,
    events: eventMsgs.length,
    laps: lapMsgs.length,  // Add this
  });

  const laps = convertFitToKrdLaps(lapMsgs);  // Add this

  return {
    // ... existing
    extensions: {
      fit: fitExtensions,
      activity: { session, records, events, laps },  // Add laps
    },
  };
};
```

---

## Files Summary

### New Files (7 files)
```
packages/core/src/adapters/fit/
├── schemas/
│   ├── fit-lap.ts
│   └── fit-lap-trigger.ts
└── lap/
    ├── index.ts
    ├── lap.mapper.ts
    ├── lap-trigger.mapper.ts
    ├── fit-to-krd-lap.converter.ts
    ├── fit-to-krd-lap.converter.test.ts
    ├── krd-to-fit-lap.converter.ts
    └── krd-to-fit-lap.converter.test.ts
```

### Modified Files (2 files)
```
packages/core/src/
├── domain/schemas/krd/lap.ts          # Extend with new fields
└── adapters/fit/messages/activity.mapper.ts  # Wire up lap extraction
```

---

## Implementation Order

1. [ ] Extend `domain/schemas/krd/lap.ts` with new fields
2. [ ] Create `schemas/fit-lap-trigger.ts` with trigger enum
3. [ ] Create `schemas/fit-lap.ts` with FIT LAP schema
4. [ ] Create `lap/lap-trigger.mapper.ts` with trigger mappings
5. [ ] Create `lap/lap.mapper.ts` with field translation
6. [ ] Create `lap/fit-to-krd-lap.converter.ts` + tests
7. [ ] Create `lap/krd-to-fit-lap.converter.ts` + tests
8. [ ] Create `lap/index.ts` exports
9. [ ] Integrate in `activity.mapper.ts`
10. [ ] Run full test suite
11. [ ] Create changeset

---

## Verification Commands

```bash
# Run lap converter tests
pnpm --filter @kaiord/core test lap.converter

# Run all core tests
pnpm --filter @kaiord/core test

# Build check
pnpm --filter @kaiord/core build

# Lint
pnpm lint

# Full validation
pnpm -r test && pnpm -r build && pnpm lint
```

---

## Acceptance Criteria

- [ ] FIT LAP messages parse correctly (all trigger types)
- [ ] KRD lap schema extended with new fields
- [ ] Bidirectional conversion FIT LAP ↔ KRD lap works
- [ ] Round-trip tests pass with tolerances (±1s time, ±1W power, ±1bpm HR)
- [ ] Enhanced speed preferred over regular speed
- [ ] Zero totalTimerTime preserved through round-trip
- [ ] activity.mapper.ts extracts and converts laps
- [ ] Test coverage ≥ 80% for converters
- [ ] No file exceeds 100 lines (except tests)
- [ ] Build passes without warnings
