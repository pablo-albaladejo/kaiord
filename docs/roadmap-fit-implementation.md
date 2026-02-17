# FIT Implementation Roadmap

> Complete Garmin FIT SDK implementation for @kaiord/core

**Status**: ~35-40% complete (workout files only)
**Goal**: Full FIT file support (workouts, activities, courses)
**Last Updated**: 2026-02-01

---

## Table of Contents

1. [Current State](#current-state)
2. [Phase 1: Critical Features](#phase-1-critical-features)
3. [Phase 2: Important Features](#phase-2-important-features)
4. [Phase 3: Advanced Features](#phase-3-advanced-features)
5. [Technical Specifications](#technical-specifications)
6. [File Structure](#file-structure)
7. [Testing Strategy](#testing-strategy)
8. [Migration Notes](#migration-notes)

---

## Current State

### Implemented Message Types

| Message      | ID  | Status      | File Location              |
| ------------ | --- | ----------- | -------------------------- |
| FILE_ID      | 0   | ✅ Complete | `adapters/fit/metadata/`   |
| WORKOUT      | 26  | ✅ Complete | `adapters/fit/messages/`   |
| WORKOUT_STEP | 27  | ✅ Complete | `adapters/fit/krd-to-fit/` |

### Implemented Features

```
✅ 15 duration types (time, distance, calories, conditionals, repeats)
✅ 6 target types (power, HR, cadence, speed, swim stroke, open)
✅ 4 sport types + 65 sub-sport types
✅ 7 swim stroke types with bidirectional mapping
✅ 6 equipment types (swimming accessories)
✅ 7 intensity levels
✅ Notes field (max 256 chars with truncation option)
✅ Developer field preservation (read-only)
✅ Unknown message preservation
✅ Round-trip conversion (FIT ↔ KRD ↔ TCX/ZWO)
```

### Test Coverage

| Area                | Lines     | Status           |
| ------------------- | --------- | ---------------- |
| Duration conversion | 861       | ✅ Comprehensive |
| Target conversion   | 1,027     | ✅ Comprehensive |
| KRD↔FIT roundtrip   | 2,028     | ✅ Comprehensive |
| Swimming            | 428       | ✅ Good          |
| Notes handling      | 340       | ✅ Good          |
| Metadata            | 185       | ✅ Good          |
| **Total**           | **6,522** |                  |

---

## Phase 1: Critical Features

> **Goal**: Enable full activity file support
> **Estimated effort**: 10-12 days

### 1.1 SESSION Message Implementation

**Priority**: 🔴 Critical
**Effort**: 2-3 days
**FIT Message ID**: 18

#### Description

SESSION messages contain aggregate statistics for the entire workout/activity. Required for activity files and useful for workout summaries.

#### FIT Fields to Implement

```typescript
type FitSessionMessage = {
  // Timing
  timestamp: number; // FIT timestamp (seconds since epoch)
  startTime: number; // Activity start time
  totalElapsedTime: number; // Total time including pauses (ms)
  totalTimerTime: number; // Active time only (ms)

  // Distance & Calories
  totalDistance: number; // meters
  totalCalories: number; // kcal
  totalFatCalories?: number; // kcal from fat

  // Speed
  avgSpeed?: number; // m/s
  maxSpeed?: number; // m/s
  enhancedAvgSpeed?: number; // m/s (higher precision)
  enhancedMaxSpeed?: number; // m/s (higher precision)

  // Heart Rate
  avgHeartRate?: number; // bpm
  maxHeartRate?: number; // bpm
  minHeartRate?: number; // bpm

  // Cadence
  avgCadence?: number; // rpm or spm
  maxCadence?: number; // rpm or spm
  avgFractionalCadence?: number;

  // Power (cycling)
  avgPower?: number; // watts
  maxPower?: number; // watts
  normalizedPower?: number; // watts (NP)
  trainingStressScore?: number; // TSS
  intensityFactor?: number; // IF
  leftRightBalance?: number;

  // Elevation
  totalAscent?: number; // meters
  totalDescent?: number; // meters

  // Classification
  sport: FitSport;
  subSport: FitSubSport;

  // Swimming specific
  numLengths?: number;
  numActiveLengths?: number;
  poolLength?: number; // meters
  poolLengthUnit?: "metric" | "statute";
  avgStrokeCount?: number;
  avgStrokeDistance?: number;
  swimStroke?: FitSwimStroke;

  // Workout reference
  firstLapIndex?: number;
  numLaps?: number;
};
```

#### KRD Schema Extension

```typescript
// Add to domain/schemas/session.ts
const sessionSchema = z.object({
  start_time: z.string().datetime(),
  total_elapsed_time: z.number().positive(),
  total_timer_time: z.number().positive(),
  total_distance: z.number().nonnegative().optional(),
  total_calories: z.number().nonnegative().optional(),
  avg_speed: z.number().nonnegative().optional(),
  max_speed: z.number().nonnegative().optional(),
  avg_heart_rate: z.number().int().min(0).max(255).optional(),
  max_heart_rate: z.number().int().min(0).max(255).optional(),
  avg_cadence: z.number().nonnegative().optional(),
  max_cadence: z.number().nonnegative().optional(),
  avg_power: z.number().nonnegative().optional(),
  max_power: z.number().nonnegative().optional(),
  normalized_power: z.number().nonnegative().optional(),
  training_stress_score: z.number().nonnegative().optional(),
  intensity_factor: z.number().nonnegative().optional(),
  total_ascent: z.number().nonnegative().optional(),
  total_descent: z.number().nonnegative().optional(),
  sport: sportSchema,
  sub_sport: subSportSchema.optional(),
  num_laps: z.number().int().nonnegative().optional(),
});
```

#### Files to Create

```
packages/core/src/
├── domain/schemas/session.ts
├── adapters/fit/
│   ├── session/
│   │   ├── session.mapper.ts
│   │   ├── session.mapper.test.ts
│   │   ├── fit-to-krd-session.converter.ts
│   │   ├── krd-to-fit-session.converter.ts
│   │   └── index.ts
│   └── schemas/fit-session.ts
```

#### Acceptance Criteria

- [ ] Parse SESSION messages from FIT files
- [ ] Convert SESSION to KRD session schema
- [ ] Convert KRD session back to FIT SESSION
- [ ] Round-trip test with ±1s time tolerance
- [ ] Round-trip test with ±1W power tolerance
- [ ] Handle optional fields gracefully
- [ ] Preserve unknown fields in extensions

---

### 1.2 RECORD Message Implementation

**Priority**: 🔴 Critical
**Effort**: 2-3 days
**FIT Message ID**: 20

#### Description

RECORD messages contain time-series data points (typically 1 per second). Essential for activity files with GPS, power, HR data over time.

#### FIT Fields to Implement

```typescript
type FitRecordMessage = {
  timestamp: number; // FIT timestamp

  // Position
  positionLat?: number; // semicircles
  positionLong?: number; // semicircles
  altitude?: number; // meters (with offset)
  enhancedAltitude?: number; // meters (higher precision)

  // Speed & Distance
  speed?: number; // m/s
  enhancedSpeed?: number; // m/s (higher precision)
  distance?: number; // cumulative meters

  // Heart Rate
  heartRate?: number; // bpm

  // Cadence
  cadence?: number; // rpm or spm
  fractionalCadence?: number; // fractional part

  // Power
  power?: number; // watts
  leftRightBalance?: number;
  leftPedalSmoothness?: number;
  rightPedalSmoothness?: number;
  leftTorqueEffectiveness?: number;
  rightTorqueEffectiveness?: number;

  // Environment
  temperature?: number; // celsius

  // Cycling dynamics
  leftPlatformCenterOffset?: number;
  rightPlatformCenterOffset?: number;
  leftPowerPhaseStart?: number;
  leftPowerPhaseEnd?: number;
  rightPowerPhaseStart?: number;
  rightPowerPhaseEnd?: number;

  // Running dynamics
  verticalOscillation?: number;
  stanceTime?: number;
  stanceTimePercent?: number;
  verticalRatio?: number;
  stepLength?: number;

  // Compressed timestamp
  compressedTimestamp?: number;
};
```

#### KRD Schema Extension

```typescript
// Add to domain/schemas/record.ts
const recordSchema = z.object({
  timestamp: z.string().datetime(),

  // Position (converted from semicircles to degrees)
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  altitude: z.number().optional(),

  // Metrics
  speed: z.number().nonnegative().optional(),
  distance: z.number().nonnegative().optional(),
  heart_rate: z.number().int().min(0).max(255).optional(),
  cadence: z.number().nonnegative().optional(),
  power: z.number().nonnegative().optional(),
  temperature: z.number().optional(),

  // Running dynamics
  vertical_oscillation: z.number().nonnegative().optional(),
  stance_time: z.number().nonnegative().optional(),
  step_length: z.number().nonnegative().optional(),

  // Power balance
  left_right_balance: z.number().min(0).max(100).optional(),
});

// Coordinate conversion utilities
const SEMICIRCLES_TO_DEGREES = 180 / Math.pow(2, 31);
const DEGREES_TO_SEMICIRCLES = Math.pow(2, 31) / 180;
```

#### Files to Create

```
packages/core/src/
├── domain/schemas/record.ts
├── adapters/fit/
│   ├── record/
│   │   ├── record.mapper.ts
│   │   ├── record.mapper.test.ts
│   │   ├── fit-to-krd-record.converter.ts
│   │   ├── krd-to-fit-record.converter.ts
│   │   ├── coordinate.converter.ts
│   │   ├── coordinate.converter.test.ts
│   │   └── index.ts
│   └── schemas/fit-record.ts
```

#### Performance Considerations

```typescript
// Records can be numerous (1/second for hours)
// Use streaming/chunked processing for large files

type RecordProcessingOptions = {
  chunkSize?: number; // Default: 1000 records
  skipFields?: string[]; // Fields to ignore for performance
  downsample?: number; // Keep every Nth record
};
```

#### Acceptance Criteria

- [ ] Parse RECORD messages from FIT files
- [ ] Convert semicircles to degrees and back
- [ ] Handle compressed timestamps
- [ ] Support streaming for large files
- [ ] Round-trip test with coordinate precision (6 decimal places)
- [ ] Performance: process 10,000 records in <1s

---

### 1.3 EVENT Message Implementation

**Priority**: 🔴 Critical
**Effort**: 2-3 days
**FIT Message ID**: 21

#### Description

EVENT messages capture workout events like start, stop, pause, markers, and text coaching cues.

#### FIT Fields to Implement

```typescript
type FitEventMessage = {
  timestamp: number;
  event: FitEvent;
  eventType: FitEventType;
  data?: number;
  data16?: number;
  score?: number;
  opponentScore?: number;
  frontGearNum?: number;
  frontGear?: number;
  rearGearNum?: number;
  rearGear?: number;
  deviceIndex?: number;
  radarThreatLevelMax?: number;
  radarThreatCount?: number;
};

enum FitEvent {
  TIMER = 0,
  WORKOUT = 3,
  WORKOUT_STEP = 4,
  POWER_DOWN = 5,
  POWER_UP = 6,
  OFF_COURSE = 7,
  SESSION = 8,
  LAP = 9,
  COURSE_POINT = 10,
  BATTERY = 11,
  VIRTUAL_PARTNER_PACE = 12,
  HR_HIGH_ALERT = 13,
  HR_LOW_ALERT = 14,
  SPEED_HIGH_ALERT = 15,
  SPEED_LOW_ALERT = 16,
  CAD_HIGH_ALERT = 17,
  CAD_LOW_ALERT = 18,
  POWER_HIGH_ALERT = 19,
  POWER_LOW_ALERT = 20,
  RECOVERY_HR = 21,
  BATTERY_LOW = 22,
  TIME_DURATION_ALERT = 23,
  DISTANCE_DURATION_ALERT = 24,
  CALORIE_DURATION_ALERT = 25,
  ACTIVITY = 26,
  FITNESS_EQUIPMENT = 27,
  LENGTH = 28,
  USER_MARKER = 32,
  SPORT_POINT = 33,
  CALIBRATION = 36,
  FRONT_GEAR_CHANGE = 42,
  REAR_GEAR_CHANGE = 43,
  RIDER_POSITION_CHANGE = 44,
  ELEV_HIGH_ALERT = 45,
  ELEV_LOW_ALERT = 46,
  COMM_TIMEOUT = 47,
  AUTO_ACTIVITY_DETECT = 54,
  DIVE_ALERT = 56,
  DIVE_GAS_SWITCHED = 57,
  TANK_PRESSURE_RESERVE = 71,
  TANK_PRESSURE_CRITICAL = 72,
  TANK_LOST = 73,
  RADAR_THREAT_ALERT = 75,
  TANK_BATTERY_LOW = 76,
  TANK_POD_CONNECTED = 81,
  TANK_POD_DISCONNECTED = 82,
}

enum FitEventType {
  START = 0,
  STOP = 1,
  CONSECUTIVE_DEPRECIATED = 2,
  MARKER = 3,
  STOP_ALL = 4,
  BEGIN_DEPRECIATED = 5,
  END_DEPRECIATED = 6,
  END_ALL_DEPRECIATED = 7,
  STOP_DISABLE = 8,
  STOP_DISABLE_ALL = 9,
}
```

#### KRD Schema Extension

```typescript
// Add to domain/schemas/event.ts
const eventTypeSchema = z.enum([
  "start",
  "stop",
  "pause",
  "resume",
  "lap",
  "marker",
  "workout_step",
  "alert",
  "gear_change",
  "user_marker",
]);

const eventSchema = z.object({
  timestamp: z.string().datetime(),
  type: eventTypeSchema,
  event_category: z.string(),
  data: z.record(z.unknown()).optional(),
  message: z.string().max(256).optional(),
});
```

#### Files to Create

```
packages/core/src/
├── domain/schemas/event.ts
├── adapters/fit/
│   ├── event/
│   │   ├── event.mapper.ts
│   │   ├── event.mapper.test.ts
│   │   ├── fit-to-krd-event.converter.ts
│   │   ├── krd-to-fit-event.converter.ts
│   │   └── index.ts
│   └── schemas/fit-event.ts
```

#### Acceptance Criteria

- [ ] Parse EVENT messages from FIT files
- [ ] Map all FitEvent types to KRD event categories
- [ ] Map all FitEventType values correctly
- [ ] Support USER_MARKER for coaching cues
- [ ] Round-trip test for common event types
- [ ] Preserve event-specific data fields

---

### 1.4 Fix stroke_type Target Conversion

**Priority**: 🔴 Critical
**Effort**: 1 day
**Bug Location**: `adapters/fit/krd-to-fit/krd-to-fit-target.mapper.ts`

#### Current Issue

```typescript
// Current code silently ignores stroke_type targets
// Swimming workouts lose their stroke information on KRD→FIT conversion
```

#### Solution

```typescript
// Add to krd-to-fit-target.mapper.ts

import { SWIM_STROKE_TO_FIT } from "../../shared/swim-stroke-mapping";

export function convertStrokeTypeTarget(
  step: WorkoutStep,
  message: Partial<FitWorkoutStepMessage>
): void {
  if (step.target.type !== targetTypeSchema.enum.stroke_type) {
    return;
  }

  const strokeValue = step.target.value;
  if (
    !strokeValue ||
    typeof strokeValue !== "object" ||
    !("value" in strokeValue)
  ) {
    return;
  }

  const fitStroke = SWIM_STROKE_TO_FIT[strokeValue.value as SwimStroke];
  if (fitStroke === undefined) {
    return;
  }

  message.targetType = fitTargetTypeSchema.enum.swimStroke;
  message.targetSwimStroke = fitStroke;
}

// Update convertTarget() to include stroke handling
export function convertTarget(
  step: WorkoutStep
): Partial<FitWorkoutStepMessage> {
  const message: Partial<FitWorkoutStepMessage> = {};

  if (!step.target) {
    message.targetType = fitTargetTypeSchema.enum.open;
    return message;
  }

  switch (step.target.type) {
    case targetTypeSchema.enum.power:
      convertPowerTarget(step, message);
      break;
    case targetTypeSchema.enum.heart_rate:
      convertHeartRateTarget(step, message);
      break;
    case targetTypeSchema.enum.cadence:
      convertCadenceTarget(step, message);
      break;
    case targetTypeSchema.enum.pace:
      convertPaceTarget(step, message);
      break;
    case targetTypeSchema.enum.stroke_type: // ADD THIS
      convertStrokeTypeTarget(step, message);
      break;
    default:
      message.targetType = fitTargetTypeSchema.enum.open;
  }

  return message;
}
```

#### Test to Add

```typescript
// Add to krd-to-fit-target.mapper.test.ts

describe("stroke_type target conversion", () => {
  it("should convert freestyle stroke target", () => {
    const step: WorkoutStep = {
      type: "active",
      duration: { type: "distance", value: 100 },
      target: {
        type: "stroke_type",
        value: { value: "freestyle" },
      },
    };

    const result = convertTarget(step);

    expect(result.targetType).toBe(fitTargetTypeSchema.enum.swimStroke);
    expect(result.targetSwimStroke).toBe(0); // freestyle = 0
  });

  it("should handle all swim stroke types", () => {
    const strokes = [
      "freestyle",
      "backstroke",
      "breaststroke",
      "butterfly",
      "drill",
      "mixed",
    ];

    strokes.forEach((stroke, index) => {
      const step: WorkoutStep = {
        type: "active",
        duration: { type: "time", value: 60 },
        target: { type: "stroke_type", value: { value: stroke } },
      };

      const result = convertTarget(step);
      expect(result.targetType).toBe(fitTargetTypeSchema.enum.swimStroke);
      expect(result.targetSwimStroke).toBeDefined();
    });
  });
});
```

#### Acceptance Criteria

- [ ] stroke_type targets convert correctly to FIT swimStroke
- [ ] All 7 swim strokes map bidirectionally
- [ ] Round-trip test passes for swimming workout with stroke targets
- [ ] No regression in existing target conversions

---

## Phase 2: Important Features

> **Goal**: Complete FIT file type support
> **Estimated effort**: 5-7 days

### 2.1 LAP Message Implementation

**Priority**: 🟠 Important
**Effort**: 2 days
**FIT Message ID**: 19

#### Description

LAP messages contain per-lap/per-interval statistics. Essential for structured interval workouts and activity analysis.

#### FIT Fields to Implement

```typescript
type FitLapMessage = {
  messageIndex: number;
  timestamp: number;
  event: FitEvent;
  eventType: FitEventType;
  startTime: number;

  // Position
  startPositionLat?: number;
  startPositionLong?: number;
  endPositionLat?: number;
  endPositionLong?: number;

  // Timing
  totalElapsedTime: number;
  totalTimerTime: number;

  // Distance
  totalDistance?: number;

  // Speed
  avgSpeed?: number;
  maxSpeed?: number;
  enhancedAvgSpeed?: number;
  enhancedMaxSpeed?: number;

  // Heart Rate
  avgHeartRate?: number;
  maxHeartRate?: number;

  // Cadence
  avgCadence?: number;
  maxCadence?: number;

  // Power
  avgPower?: number;
  maxPower?: number;
  normalizedPower?: number;

  // Elevation
  totalAscent?: number;
  totalDescent?: number;

  // Calories
  totalCalories?: number;
  totalFatCalories?: number;

  // Classification
  intensity?: FitIntensity;
  lapTrigger: FitLapTrigger;
  sport?: FitSport;
  subSport?: FitSubSport;

  // Swimming
  numLengths?: number;
  numActiveLengths?: number;
  firstLengthIndex?: number;
  avgStrokeDistance?: number;
  swimStroke?: FitSwimStroke;
  avgStrokeCount?: number;

  // Workout reference
  wktStepIndex?: number;
};

enum FitLapTrigger {
  MANUAL = 0,
  TIME = 1,
  DISTANCE = 2,
  POSITION_START = 3,
  POSITION_LAP = 4,
  POSITION_WAYPOINT = 5,
  POSITION_MARKED = 6,
  SESSION_END = 7,
  FITNESS_EQUIPMENT = 8,
}
```

#### KRD Schema Extension

```typescript
// Add to domain/schemas/lap.ts
const lapSchema = z.object({
  index: z.number().int().nonnegative(),
  start_time: z.string().datetime(),
  total_elapsed_time: z.number().positive(),
  total_timer_time: z.number().positive(),
  total_distance: z.number().nonnegative().optional(),
  total_calories: z.number().nonnegative().optional(),
  avg_speed: z.number().nonnegative().optional(),
  max_speed: z.number().nonnegative().optional(),
  avg_heart_rate: z.number().int().min(0).max(255).optional(),
  max_heart_rate: z.number().int().min(0).max(255).optional(),
  avg_cadence: z.number().nonnegative().optional(),
  max_cadence: z.number().nonnegative().optional(),
  avg_power: z.number().nonnegative().optional(),
  max_power: z.number().nonnegative().optional(),
  total_ascent: z.number().nonnegative().optional(),
  total_descent: z.number().nonnegative().optional(),
  intensity: intensitySchema.optional(),
  trigger: z.enum(["manual", "time", "distance", "position", "session_end"]),
  sport: sportSchema.optional(),
  sub_sport: subSportSchema.optional(),
  workout_step_index: z.number().int().nonnegative().optional(),
});
```

#### Files to Create

```
packages/core/src/
├── domain/schemas/lap.ts
├── adapters/fit/
│   ├── lap/
│   │   ├── lap.mapper.ts
│   │   ├── lap.mapper.test.ts
│   │   ├── fit-to-krd-lap.converter.ts
│   │   ├── krd-to-fit-lap.converter.ts
│   │   └── index.ts
│   └── schemas/fit-lap.ts
```

#### Acceptance Criteria

- [ ] Parse LAP messages from FIT files
- [ ] Map lap triggers correctly
- [ ] Link laps to workout steps via wktStepIndex
- [ ] Handle swimming-specific lap fields
- [ ] Round-trip test with all lap triggers

---

### 2.2 Activity & Course File Type Support

**Priority**: 🟠 Important
**Effort**: 2 days
**Affected Files**: Multiple

#### Description

Currently only `workout` file type is supported. Need to add support for `activity` (recorded activities) and `course` (routes/courses) file types.

#### FIT File Types

```typescript
enum FitFileType {
  DEVICE = 1,
  SETTINGS = 2,
  SPORT = 3,
  ACTIVITY = 4,
  WORKOUT = 5,
  COURSE = 6,
  SCHEDULES = 7,
  WEIGHT = 9,
  TOTALS = 10,
  GOALS = 11,
  BLOOD_PRESSURE = 14,
  MONITORING_A = 15,
  ACTIVITY_SUMMARY = 20,
  MONITORING_DAILY = 28,
  MONITORING_B = 32,
  SEGMENT = 34,
  SEGMENT_LIST = 35,
  EXD_CONFIGURATION = 40,
  MFG_RANGE_MIN = 0xf7,
  MFG_RANGE_MAX = 0xfe,
}
```

#### Files to Modify

```typescript
// adapters/fit/messages/messages.mapper.ts
// Update to handle different file types

export function createFitMessages(krd: KRD): FitMessages {
  const fileType = krd.metadata?.file_type ?? "workout";

  switch (fileType) {
    case "workout":
      return createWorkoutMessages(krd);
    case "activity":
      return createActivityMessages(krd);
    case "course":
      return createCourseMessages(krd);
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}
```

#### Activity File Structure

```typescript
type ActivityFitMessages = {
  fileIdMesgs: FitFileIdMessage[];
  deviceInfoMesgs?: FitDeviceInfoMessage[];
  eventMesgs: FitEventMessage[];
  recordMesgs: FitRecordMessage[];
  lapMesgs: FitLapMessage[];
  sessionMesgs: FitSessionMessage[];
  activityMesgs: FitActivityMessage[];
};
```

#### Course File Structure

```typescript
type CourseFitMessages = {
  fileIdMesgs: FitFileIdMessage[];
  courseMesgs: FitCourseMessage[];
  coursePointMesgs: FitCoursePointMessage[];
  lapMesgs: FitLapMessage[];
  recordMesgs: FitRecordMessage[];
  eventMesgs?: FitEventMessage[];
};

type FitCourseMessage = {
  name?: string;
  capabilities?: number;
  sport?: FitSport;
  subSport?: FitSubSport;
};

type FitCoursePointMessage = {
  messageIndex: number;
  timestamp?: number;
  positionLat: number;
  positionLong: number;
  distance?: number;
  type: FitCoursePointType;
  name?: string;
  favorite?: boolean;
};

enum FitCoursePointType {
  GENERIC = 0,
  SUMMIT = 1,
  VALLEY = 2,
  WATER = 3,
  FOOD = 4,
  DANGER = 5,
  LEFT = 6,
  RIGHT = 7,
  STRAIGHT = 8,
  FIRST_AID = 9,
  FOURTH_CATEGORY = 10,
  THIRD_CATEGORY = 11,
  SECOND_CATEGORY = 12,
  FIRST_CATEGORY = 13,
  HORS_CATEGORY = 14,
  SPRINT = 15,
  LEFT_FORK = 16,
  RIGHT_FORK = 17,
  MIDDLE_FORK = 18,
  SLIGHT_LEFT = 19,
  SHARP_LEFT = 20,
  SLIGHT_RIGHT = 21,
  SHARP_RIGHT = 22,
  U_TURN = 23,
  SEGMENT_START = 24,
  SEGMENT_END = 25,
}
```

#### Acceptance Criteria

- [ ] Detect file type from FILE_ID message
- [ ] Parse activity files with records, laps, sessions
- [ ] Parse course files with course points
- [ ] Generate correct file type in FILE_ID when writing
- [ ] Validate required messages per file type

---

### 2.3 DEVICE Message Implementation

**Priority**: 🟠 Important
**Effort**: 1 day
**FIT Message ID**: 23

#### FIT Fields to Implement

```typescript
type FitDeviceInfoMessage = {
  timestamp?: number;
  deviceIndex?: number;
  deviceType?: FitDeviceType;
  manufacturer?: FitManufacturer;
  serialNumber?: number;
  product?: number;
  softwareVersion?: number;
  hardwareVersion?: number;
  cumOperatingTime?: number;
  batteryVoltage?: number;
  batteryStatus?: FitBatteryStatus;
  sensorPosition?: FitBodyLocation;
  descriptor?: string;
  antTransmissionType?: number;
  antDeviceNumber?: number;
  antNetwork?: FitAntNetwork;
  sourceType?: FitSourceType;
  productName?: string;
};
```

#### Files to Create

```
packages/core/src/adapters/fit/
├── device/
│   ├── device.mapper.ts
│   ├── device.mapper.test.ts
│   └── index.ts
└── schemas/fit-device.ts
```

---

## Phase 3: Advanced Features

> **Goal**: Full FIT SDK feature parity
> **Estimated effort**: 5-7 days

### 3.1 Developer Field Creation

**Priority**: 🟡 Enhancement
**Effort**: 2-3 days

#### Current State

Developer fields can be read and preserved, but not created when writing FIT files.

#### Implementation

```typescript
// New file: adapters/fit/developer-fields/developer-field-writer.ts

type DeveloperFieldDefinition = {
  developerDataIndex: number;
  fieldDefinitionNumber: number;
  fitBaseTypeId: FitBaseType;
  fieldName: string;
  units?: string;
  nativeFieldNum?: number;
  nativeMesgNum?: number;
};

type DeveloperFieldValue = {
  developerDataIndex: number;
  fieldDefinitionNumber: number;
  value: number | string | number[];
};

export function createDeveloperField(
  definition: DeveloperFieldDefinition
): FitDeveloperDataIdMessage & FitFieldDescriptionMessage {
  // Implementation
}

export function addDeveloperFieldValue(
  message: FitMessage,
  value: DeveloperFieldValue
): void {
  // Implementation
}
```

#### Use Cases

- Custom metrics from third-party sensors
- App-specific data fields
- Extended workout instructions

---

### 3.2 Performance Metrics

**Priority**: 🟡 Enhancement
**Effort**: 1-2 days

#### Metrics to Implement

```typescript
// adapters/fit/metrics/performance-metrics.ts

export function calculateNormalizedPower(
  records: FitRecordMessage[],
  windowSeconds: number = 30
): number {
  // 30-second rolling average, then 4th power average
}

export function calculateIntensityFactor(
  normalizedPower: number,
  ftp: number
): number {
  return normalizedPower / ftp;
}

export function calculateTrainingStressScore(
  normalizedPower: number,
  durationSeconds: number,
  ftp: number
): number {
  const intensityFactor = calculateIntensityFactor(normalizedPower, ftp);
  return (
    ((durationSeconds * normalizedPower * intensityFactor) / (ftp * 3600)) * 100
  );
}

export function calculateElevationGain(
  records: FitRecordMessage[],
  smoothingWindow: number = 10
): { ascent: number; descent: number } {
  // Smoothed elevation calculation
}
```

---

### 3.3 Geographic Features

**Priority**: 🟡 Enhancement
**Effort**: 1-2 days

#### Implementation

```typescript
// adapters/fit/geo/coordinate-utils.ts

const SEMICIRCLES_TO_DEGREES = 180 / Math.pow(2, 31);
const DEGREES_TO_SEMICIRCLES = Math.pow(2, 31) / 180;

export function semicirclesToDegrees(semicircles: number): number {
  return semicircles * SEMICIRCLES_TO_DEGREES;
}

export function degreesToSemicircles(degrees: number): number {
  return Math.round(degrees * DEGREES_TO_SEMICIRCLES);
}

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  // Haversine formula
}

export function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  // Bearing calculation
}

// adapters/fit/geo/track-utils.ts

export function smoothTrack(
  records: FitRecordMessage[],
  algorithm: "kalman" | "douglas-peucker" | "moving-average"
): FitRecordMessage[] {
  // Track smoothing for noisy GPS data
}

export function calculateGrade(records: FitRecordMessage[]): number[] {
  // Grade/slope calculation from altitude and distance
}
```

---

## Technical Specifications

### Message Number Registry

```typescript
// adapters/fit/shared/message-numbers.ts

export const FIT_MESSAGE_NUMBERS = {
  FILE_ID: 0,
  CAPABILITIES: 1,
  DEVICE_SETTINGS: 2,
  USER_PROFILE: 3,
  HRM_PROFILE: 4,
  SDM_PROFILE: 5,
  BIKE_PROFILE: 6,
  ZONES_TARGET: 7,
  HR_ZONE: 8,
  POWER_ZONE: 9,
  MET_ZONE: 10,
  SPORT: 12,
  GOAL: 15,
  SESSION: 18,
  LAP: 19,
  RECORD: 20,
  EVENT: 21,
  DEVICE_INFO: 23,
  WORKOUT: 26,
  WORKOUT_STEP: 27,
  SCHEDULE: 28,
  WEIGHT_SCALE: 30,
  COURSE: 31,
  COURSE_POINT: 32,
  TOTALS: 33,
  ACTIVITY: 34,
  SOFTWARE: 35,
  FILE_CAPABILITIES: 37,
  MESG_CAPABILITIES: 38,
  FIELD_CAPABILITIES: 39,
  FILE_CREATOR: 49,
  BLOOD_PRESSURE: 51,
  SPEED_ZONE: 53,
  MONITORING: 55,
  TRAINING_FILE: 72,
  HRV: 78,
  ANT_RX: 80,
  ANT_TX: 81,
  ANT_CHANNEL_ID: 82,
  LENGTH: 101,
  MONITORING_INFO: 103,
  PAD: 105,
  SLAVE_DEVICE: 106,
  CONNECTIVITY: 127,
  WEATHER_CONDITIONS: 128,
  WEATHER_ALERT: 129,
  CADENCE_ZONE: 131,
  HR: 132,
  SEGMENT_LAP: 142,
  MEMO_GLOB: 145,
  SEGMENT_ID: 148,
  SEGMENT_LEADERBOARD_ENTRY: 149,
  SEGMENT_POINT: 150,
  SEGMENT_FILE: 151,
  WORKOUT_SESSION: 158,
  WATCHFACE_SETTINGS: 159,
  GPS_METADATA: 160,
  CAMERA_EVENT: 161,
  TIMESTAMP_CORRELATION: 162,
  GYROSCOPE_DATA: 164,
  ACCELEROMETER_DATA: 165,
  THREE_D_SENSOR_CALIBRATION: 167,
  VIDEO_FRAME: 169,
  OBDII_DATA: 174,
  NMEA_SENTENCE: 177,
  AVIATION_ATTITUDE: 178,
  VIDEO: 184,
  VIDEO_TITLE: 185,
  VIDEO_DESCRIPTION: 186,
  VIDEO_CLIP: 187,
  OHR_SETTINGS: 188,
  EXD_SCREEN_CONFIGURATION: 200,
  EXD_DATA_FIELD_CONFIGURATION: 201,
  EXD_DATA_CONCEPT_CONFIGURATION: 202,
  FIELD_DESCRIPTION: 206,
  DEVELOPER_DATA_ID: 207,
  MAGNETOMETER_DATA: 208,
  BAROMETER_DATA: 209,
  ONE_D_SENSOR_CALIBRATION: 210,
  MONITORING_HR_DATA: 211,
  TIME_IN_ZONE: 216,
  SET: 225,
  STRESS_LEVEL: 227,
  MAX_MET_DATA: 229,
  DIVE_SETTINGS: 258,
  DIVE_GAS: 259,
  DIVE_ALARM: 262,
  EXERCISE_TITLE: 264,
  DIVE_SUMMARY: 268,
  SPO2_DATA: 269,
  SLEEP_LEVEL: 275,
  JUMP: 285,
  BEAT_INTERVALS: 290,
  RESPIRATION_RATE: 297,
  SPLIT: 312,
  SPLIT_SUMMARY: 313,
  CLIMB_PRO: 317,
  TANK_UPDATE: 319,
  TANK_SUMMARY: 323,
  SLEEP_ASSESSMENT: 346,
  HRV_STATUS_SUMMARY: 370,
  HRV_VALUE: 371,
  RAW_BBI: 372,
  DEVICE_AUX_BATTERY_INFO: 375,
  DIVE_APNEA_ALARM: 393,
} as const;
```

### Round-Trip Tolerances

```typescript
// test-utils/tolerances.ts

export const FIT_TOLERANCES = {
  // Timing
  timestamp: 1, // ±1 second
  duration: 1, // ±1 second

  // Power
  power: 1, // ±1 watt
  powerPercent: 1, // ±1% FTP
  normalizedPower: 1, // ±1 watt

  // Heart Rate
  heartRate: 1, // ±1 bpm
  heartRatePercent: 1, // ±1% max HR

  // Cadence
  cadence: 1, // ±1 rpm/spm

  // Speed/Pace
  speed: 0.01, // ±0.01 m/s

  // Distance
  distance: 1, // ±1 meter

  // Coordinates
  latitude: 0.000001, // ~0.1m precision
  longitude: 0.000001, // ~0.1m precision

  // Elevation
  altitude: 0.2, // ±0.2 meters

  // Calories
  calories: 1, // ±1 kcal

  // Temperature
  temperature: 0.5, // ±0.5°C
};
```

---

## File Structure

### Final Directory Structure

```
packages/core/src/
├── domain/
│   └── schemas/
│       ├── session.ts          # NEW
│       ├── record.ts           # NEW
│       ├── event.ts            # NEW
│       ├── lap.ts              # NEW
│       └── ... (existing)
│
├── adapters/
│   └── fit/
│       ├── session/            # NEW
│       │   ├── session.mapper.ts
│       │   ├── session.mapper.test.ts
│       │   ├── fit-to-krd-session.converter.ts
│       │   ├── krd-to-fit-session.converter.ts
│       │   └── index.ts
│       │
│       ├── record/             # NEW
│       │   ├── record.mapper.ts
│       │   ├── record.mapper.test.ts
│       │   ├── fit-to-krd-record.converter.ts
│       │   ├── krd-to-fit-record.converter.ts
│       │   ├── coordinate.converter.ts
│       │   └── index.ts
│       │
│       ├── event/              # NEW
│       │   ├── event.mapper.ts
│       │   ├── event.mapper.test.ts
│       │   ├── fit-to-krd-event.converter.ts
│       │   ├── krd-to-fit-event.converter.ts
│       │   └── index.ts
│       │
│       ├── lap/                # NEW
│       │   ├── lap.mapper.ts
│       │   ├── lap.mapper.test.ts
│       │   ├── fit-to-krd-lap.converter.ts
│       │   ├── krd-to-fit-lap.converter.ts
│       │   └── index.ts
│       │
│       ├── device/             # NEW
│       │   ├── device.mapper.ts
│       │   └── index.ts
│       │
│       ├── geo/                # NEW (Phase 3)
│       │   ├── coordinate-utils.ts
│       │   ├── track-utils.ts
│       │   └── index.ts
│       │
│       ├── metrics/            # NEW (Phase 3)
│       │   ├── performance-metrics.ts
│       │   └── index.ts
│       │
│       ├── developer-fields/   # NEW (Phase 3)
│       │   ├── developer-field-writer.ts
│       │   └── index.ts
│       │
│       ├── schemas/
│       │   ├── fit-session.ts  # NEW
│       │   ├── fit-record.ts   # NEW
│       │   ├── fit-event.ts    # NEW
│       │   ├── fit-lap.ts      # NEW
│       │   ├── fit-device.ts   # NEW
│       │   ├── fit-course.ts   # NEW
│       │   └── ... (existing)
│       │
│       └── ... (existing directories)
```

---

## Testing Strategy

### Test Categories

```typescript
// Each new message type needs:

// 1. Unit tests for mapper
describe("SessionMapper", () => {
  describe("fitToKrd", () => {
    /* ... */
  });
  describe("krdToFit", () => {
    /* ... */
  });
});

// 2. Integration tests for converter
describe("SessionConverter", () => {
  describe("full conversion pipeline", () => {
    /* ... */
  });
});

// 3. Round-trip tests
describe("Session round-trip", () => {
  it("should preserve all fields within tolerances", () => {
    /* ... */
  });
});

// 4. Edge case tests
describe("Session edge cases", () => {
  it("should handle missing optional fields", () => {
    /* ... */
  });
  it("should handle maximum values", () => {
    /* ... */
  });
  it("should handle minimum values", () => {
    /* ... */
  });
});

// 5. Real-world file tests
describe("Session with real FIT files", () => {
  it("should parse Garmin Connect export", async () => {
    /* ... */
  });
  it("should parse Wahoo export", async () => {
    /* ... */
  });
  it("should parse Zwift export", async () => {
    /* ... */
  });
});
```

### Test Fixtures Needed

```
packages/core/test-fixtures/
├── fit/
│   ├── activities/
│   │   ├── garmin-edge-ride.fit
│   │   ├── garmin-forerunner-run.fit
│   │   ├── wahoo-elemnt-ride.fit
│   │   ├── zwift-activity.fit
│   │   └── coros-run.fit
│   │
│   ├── courses/
│   │   ├── garmin-course.fit
│   │   └── strava-route.fit
│   │
│   └── workouts/
│       └── ... (existing)
```

---

## Migration Notes

### KRD Schema Version

When implementing new features, the KRD schema version should be bumped:

```typescript
// domain/schemas/krd.ts

export const KRD_SCHEMA_VERSION = "2.0.0"; // Bump from 1.x

// Add migration utilities
export function migrateKrdV1ToV2(krdV1: KrdV1): KrdV2 {
  return {
    ...krdV1,
    version: "2.0.0",
    sessions: [], // New field
    records: [], // New field
    events: [], // New field
    laps: [], // New field
  };
}
```

### Backward Compatibility

```typescript
// Maintain compatibility with existing workout-only KRD files
export function isWorkoutOnlyKrd(krd: KRD): boolean {
  return !krd.sessions?.length && !krd.records?.length && !krd.laps?.length;
}

// Existing toKRD/fromKRD functions remain unchanged
// New functions added for full activity support:
export async function activityToKRD(/* ... */): Promise<KRD> {
  /* ... */
}
export async function krdToActivity(/* ... */): Promise<Uint8Array> {
  /* ... */
}
```

---

## Summary

| Phase       | Features                                | Effort         | Impact                 |
| ----------- | --------------------------------------- | -------------- | ---------------------- |
| **Phase 1** | SESSION, RECORD, EVENT, stroke_type fix | 10-12 days     | Enables activity files |
| **Phase 2** | LAP, file types, DEVICE                 | 5-7 days       | Complete FIT support   |
| **Phase 3** | Developer fields, metrics, geo          | 5-7 days       | Advanced features      |
| **Total**   | Full FIT SDK parity                     | **20-26 days** | Production-ready       |

### Quick Wins (Can be done independently)

1. **Fix stroke_type target** (1 day) - Immediate bug fix
2. **Add missing message numbers** (0.5 day) - Infrastructure
3. **Add test fixtures** (1 day) - Testing foundation

### Dependencies

```
Phase 1.1 (SESSION) ──┐
Phase 1.2 (RECORD) ───┼──► Phase 2.2 (File Types)
Phase 1.3 (EVENT) ────┘
                           │
Phase 1.4 (stroke fix) ────┴──► Independent

Phase 2.1 (LAP) ──────────────► Phase 3.2 (Metrics)

Phase 2.3 (DEVICE) ───────────► Independent

Phase 3.1 (Dev Fields) ───────► Independent
Phase 3.3 (Geo) ──────────────► Requires RECORD
```
