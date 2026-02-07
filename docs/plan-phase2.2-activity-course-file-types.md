# Plan: Phase 2.2 Activity & Course File Type Support

## Summary

Implement support for FIT ACTIVITY (ID 4) and COURSE (ID 6) file types. Currently only WORKOUT (ID 5) files are supported. This enables reading/writing recorded activities with GPS data and route/course files.

**Reference**: `docs/roadmap-fit-implementation.md` (Phase 2.2)

---

## Phase Overview

| Task                          | Priority | Effort   | Files      |
| ----------------------------- | -------- | -------- | ---------- |
| 2.2.1 FIT File Type Schema    | High     | 0.5 days | 1 new      |
| 2.2.2 FILE_ID Extension       | High     | 0.5 days | 2 modified |
| 2.2.3 Activity File Structure | High     | 0.5 days | 2 new      |
| 2.2.4 Course Support          | High     | 0.5 days | 4 new      |
| 2.2.5 Message Router          | High     | 0.5 days | 1 modified |

---

## 2.2.1 FIT File Type Schema

**File**: `packages/core/src/adapters/fit/schemas/fit-file-type.ts`

### Schema Definition

```typescript
import { z } from "zod";

/**
 * FIT file type enum
 * Defines the type of data contained in the FIT file
 */
export const fitFileTypeSchema = z.enum([
  "device", // 1
  "settings", // 2
  "sport", // 3
  "activity", // 4 - Recorded workout with GPS/sensor data
  "workout", // 5 - Planned workout (current default)
  "course", // 6 - Route/course for navigation
  "schedules", // 7
  "weight", // 9
  "totals", // 10
  "goals", // 11
  "bloodPressure", // 14
  "monitoringA", // 15
  "activitySummary", // 20
  "monitoringDaily", // 28
  "monitoringB", // 32
  "segment", // 34
  "segmentList", // 35
  "exdConfiguration", // 40
]);

export type FitFileType = z.infer<typeof fitFileTypeSchema>;

/**
 * Bidirectional mapping for FIT file type enum
 */
export const FIT_FILE_TYPE_TO_NUMBER: Record<FitFileType, number> = {
  device: 1,
  settings: 2,
  sport: 3,
  activity: 4,
  workout: 5,
  course: 6,
  schedules: 7,
  weight: 9,
  totals: 10,
  goals: 11,
  bloodPressure: 14,
  monitoringA: 15,
  activitySummary: 20,
  monitoringDaily: 28,
  monitoringB: 32,
  segment: 34,
  segmentList: 35,
  exdConfiguration: 40,
};

export const NUMBER_TO_FIT_FILE_TYPE: Record<number, FitFileType> = {
  1: "device",
  2: "settings",
  3: "sport",
  4: "activity",
  5: "workout",
  6: "course",
  7: "schedules",
  9: "weight",
  10: "totals",
  11: "goals",
  14: "bloodPressure",
  15: "monitoringA",
  20: "activitySummary",
  28: "monitoringDaily",
  32: "monitoringB",
  34: "segment",
  35: "segmentList",
  40: "exdConfiguration",
};
```

---

## 2.2.2 FILE_ID Extension

**Files to Modify**:

- `packages/core/src/domain/schemas/metadata.ts`
- `packages/core/src/adapters/fit/metadata/file-id.mapper.ts`

### Extend KRD Metadata Schema

```typescript
// domain/schemas/metadata.ts
export const metadataSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  sport: sportSchema.optional(),
  sub_sport: subSportSchema.optional(),
  file_type: z.enum(["workout", "activity", "course"]).optional(), // ADD THIS
  created_at: z.string().datetime().optional(),
  manufacturer: z.string().optional(),
  product: z.string().optional(),
});
```

### Update FILE_ID Mapper

```typescript
// metadata/file-id.mapper.ts
import {
  FIT_FILE_TYPE_TO_NUMBER,
  NUMBER_TO_FIT_FILE_TYPE,
} from "../schemas/fit-file-type";

export const mapFitFileIdToMetadata = (
  fileId: FitFileIdMessage
): Partial<Metadata> => {
  return {
    // ... existing fields
    file_type:
      fileId.type !== undefined
        ? NUMBER_TO_FIT_FILE_TYPE[fileId.type]
        : "workout",
  };
};

export const mapMetadataToFitFileId = (
  metadata: Metadata
): Partial<FitFileIdMessage> => {
  return {
    // ... existing fields
    type: metadata.file_type
      ? FIT_FILE_TYPE_TO_NUMBER[metadata.file_type]
      : FIT_FILE_TYPE_TO_NUMBER.workout,
  };
};
```

---

## 2.2.3 Activity File Structure

**Files to Create**:

- `packages/core/src/adapters/fit/messages/activity.mapper.ts` (ALREADY EXISTS)
- `packages/core/src/adapters/fit/messages/activity-validator.ts` (NEW)

### Activity Message Validator

```typescript
// messages/activity-validator.ts
export const validateActivityMessages = (
  messages: Record<string, unknown[]>
): void => {
  const required = ["fileIdMesgs", "sessionMesgs"];

  for (const key of required) {
    if (!messages[key] || messages[key].length === 0) {
      throw new Error(`Activity file missing required ${key}`);
    }
  }

  // Warn if missing recommended messages
  if (!messages.recordMesgs || messages.recordMesgs.length === 0) {
    console.warn("Activity file has no record messages (GPS/sensor data)");
  }
};
```

### Update activity.mapper.ts

Current file should already handle parsing activity files from Phase 1.
Need to add reverse direction (KRD → FIT activity messages).

```typescript
// messages/activity.mapper.ts (add createActivityMessages function)
export const createActivityMessages = (krd: KRD): Record<string, unknown[]> => {
  const messages: Record<string, unknown[]> = {
    fileIdMesgs: [createFileIdMessage(krd.metadata, "activity")],
  };

  // Add session messages if present
  if (krd.extensions?.activity?.session) {
    messages.sessionMesgs = [krd.extensions.activity.session];
  }

  // Add record messages if present
  if (krd.extensions?.activity?.records) {
    messages.recordMesgs = krd.extensions.activity.records;
  }

  // Add lap messages if present
  if (krd.extensions?.activity?.laps) {
    messages.lapMesgs = krd.extensions.activity.laps;
  }

  // Add event messages if present
  if (krd.extensions?.activity?.events) {
    messages.eventMesgs = krd.extensions.activity.events;
  }

  return messages;
};
```

---

## 2.2.4 Course Support

**Files to Create**:

- `packages/core/src/adapters/fit/schemas/fit-course.ts`
- `packages/core/src/adapters/fit/schemas/fit-course-point.ts`
- `packages/core/src/adapters/fit/course/course.mapper.ts`
- `packages/core/src/adapters/fit/course/course.mapper.test.ts`

### Course Schemas

```typescript
// schemas/fit-course.ts
export const fitCourseSchema = z.object({
  name: z.string().optional(),
  capabilities: z.number().optional(),
  sport: fitSportSchema.optional(),
  subSport: fitSubSportSchema.optional(),
});

export type FitCourse = z.infer<typeof fitCourseSchema>;
```

```typescript
// schemas/fit-course-point.ts
export const fitCoursePointTypeSchema = z.enum([
  "generic", // 0
  "summit", // 1
  "valley", // 2
  "water", // 3
  "food", // 4
  "danger", // 5
  "left", // 6
  "right", // 7
  "straight", // 8
  "firstAid", // 9
  "fourthCategory", // 10
  "thirdCategory", // 11
  "secondCategory", // 12
  "firstCategory", // 13
  "horsCategory", // 14
  "sprint", // 15
  "leftFork", // 16
  "rightFork", // 17
  "middleFork", // 18
  "slightLeft", // 19
  "sharpLeft", // 20
  "slightRight", // 21
  "sharpRight", // 22
  "uTurn", // 23
  "segmentStart", // 24
  "segmentEnd", // 25
]);

export const fitCoursePointSchema = z.object({
  messageIndex: z.number().optional(),
  timestamp: z.number().optional(),
  positionLat: z.number(), // semicircles
  positionLong: z.number(), // semicircles
  distance: z.number().optional(),
  type: fitCoursePointTypeSchema,
  name: z.string().optional(),
  favorite: z.boolean().optional(),
});

export type FitCoursePoint = z.infer<typeof fitCoursePointSchema>;
```

### Course Mapper

```typescript
// course/course.mapper.ts
import {
  semicirclesToDegrees,
  degreesToSemicircles,
} from "../shared/coordinate.converter";

export const mapFitCoursePointToKrd = (point: FitCoursePoint) => ({
  latitude: semicirclesToDegrees(point.positionLat),
  longitude: semicirclesToDegrees(point.positionLong),
  distance: point.distance,
  type: point.type,
  name: point.name,
  favorite: point.favorite,
  timestamp: point.timestamp
    ? new Date(point.timestamp * 1000).toISOString()
    : undefined,
});

export const mapKrdCoursePointToFit = (
  point: KRDCoursePoint
): FitCoursePoint => ({
  messageIndex: point.index,
  positionLat: degreesToSemicircles(point.latitude),
  positionLong: degreesToSemicircles(point.longitude),
  distance: point.distance,
  type: point.type,
  name: point.name,
  favorite: point.favorite,
  timestamp: point.timestamp
    ? Math.floor(new Date(point.timestamp).getTime() / 1000)
    : undefined,
});
```

---

## 2.2.5 Message Router

**File to Modify**: `packages/core/src/adapters/fit/messages/messages.mapper.ts`

### Add File Type Routing

```typescript
// messages/messages.mapper.ts
import { createWorkoutMessages } from "./workout.mapper";
import { createActivityMessages } from "./activity.mapper";
import { createCourseMessages } from "./course.mapper";

export const createFitMessages = (krd: KRD): Record<string, unknown[]> => {
  const fileType = krd.metadata?.file_type ?? "workout";

  switch (fileType) {
    case "workout":
      return createWorkoutMessages(krd);
    case "activity":
      return createActivityMessages(krd);
    case "course":
      return createCourseMessages(krd);
    default:
      throw new Error(`Unsupported FIT file type: ${fileType}`);
  }
};
```

```typescript
// messages/course.mapper.ts (NEW)
export const createCourseMessages = (krd: KRD): Record<string, unknown[]> => {
  const messages: Record<string, unknown[]> = {
    fileIdMesgs: [createFileIdMessage(krd.metadata, "course")],
  };

  if (krd.extensions?.course) {
    messages.courseMesgs = [krd.extensions.course];
  }

  if (krd.extensions?.course_points) {
    messages.coursePointMesgs = krd.extensions.course_points.map(
      mapKrdCoursePointToFit
    );
  }

  if (krd.extensions?.activity?.records) {
    messages.recordMesgs = krd.extensions.activity.records;
  }

  if (krd.extensions?.activity?.laps) {
    messages.lapMesgs = krd.extensions.activity.laps;
  }

  return messages;
};
```

---

## Files Summary

### New Files (7 files)

```text
packages/core/src/adapters/fit/
├── schemas/
│   ├── fit-file-type.ts
│   ├── fit-course.ts
│   └── fit-course-point.ts
├── course/
│   ├── index.ts
│   ├── course.mapper.ts
│   └── course.mapper.test.ts
└── messages/
    ├── activity-validator.ts
    └── course.mapper.ts
```

### Modified Files (3 files)

```text
packages/core/src/
├── domain/schemas/metadata.ts           # Add file_type field
├── adapters/fit/metadata/file-id.mapper.ts  # Read/write file type
└── adapters/fit/messages/
    ├── activity.mapper.ts               # Add createActivityMessages
    └── messages.mapper.ts               # Add file type routing
```

---

## Implementation Order

1. [ ] Create `fit-file-type.ts` schema
2. [ ] Extend metadata schema with `file_type`
3. [ ] Update FILE_ID mapper to read/write file type
4. [ ] Create course schemas (`fit-course.ts`, `fit-course-point.ts`)
5. [ ] Create `course.mapper.ts` with converters
6. [ ] Add tests for course mappers
7. [ ] Create `createActivityMessages` in activity.mapper.ts
8. [ ] Create `createCourseMessages` in course.mapper.ts
9. [ ] Update `messages.mapper.ts` with routing logic
10. [ ] Add integration tests for file type detection
11. [ ] Add tests for activity file structure validation
12. [ ] Add tests for course file structure validation
13. [ ] Create changeset

---

## Testing Strategy

### Unit Tests

```typescript
// Test file type schema
describe("fitFileTypeSchema", () => {
  it("should accept valid file types", () => {
    expect(() => fitFileTypeSchema.parse("workout")).not.toThrow();
    expect(() => fitFileTypeSchema.parse("activity")).not.toThrow();
    expect(() => fitFileTypeSchema.parse("course")).not.toThrow();
  });

  it("should reject invalid file types", () => {
    expect(() => fitFileTypeSchema.parse("invalid")).toThrow();
  });
});

// Test file type bidirectional mapping
describe("FIT_FILE_TYPE_TO_NUMBER", () => {
  it("should map workout to 5", () => {
    expect(FIT_FILE_TYPE_TO_NUMBER.workout).toBe(5);
  });

  it("should map activity to 4", () => {
    expect(FIT_FILE_TYPE_TO_NUMBER.activity).toBe(4);
  });

  it("should map course to 6", () => {
    expect(FIT_FILE_TYPE_TO_NUMBER.course).toBe(6);
  });
});
```

### Integration Tests

```typescript
// Test file type detection
describe("File type detection", () => {
  it("should detect activity file type from FILE_ID", () => {
    const fitData = createActivityFitFile();
    const krd = fitToKrd(fitData);
    expect(krd.metadata?.file_type).toBe("activity");
  });

  it("should detect course file type from FILE_ID", () => {
    const fitData = createCourseFitFile();
    const krd = fitToKrd(fitData);
    expect(krd.metadata?.file_type).toBe("course");
  });

  it("should default to workout when file type not specified", () => {
    const fitData = createFitFileWithoutType();
    const krd = fitToKrd(fitData);
    expect(krd.metadata?.file_type).toBe("workout");
  });
});

// Test message routing
describe("createFitMessages routing", () => {
  it("should route to createWorkoutMessages for workout type", () => {
    const krd = { metadata: { file_type: "workout" } };
    const messages = createFitMessages(krd);
    expect(messages.workoutMesgs).toBeDefined();
  });

  it("should route to createActivityMessages for activity type", () => {
    const krd = { metadata: { file_type: "activity" } };
    const messages = createFitMessages(krd);
    expect(messages.sessionMesgs).toBeDefined();
  });

  it("should route to createCourseMessages for course type", () => {
    const krd = { metadata: { file_type: "course" } };
    const messages = createFitMessages(krd);
    expect(messages.courseMesgs).toBeDefined();
  });
});
```

---

## Acceptance Criteria

- [ ] FIT file type enum schema created with all standard types
- [ ] FILE_ID message includes file_type field (read & write)
- [ ] Activity files parse correctly (session, record, lap, event messages)
- [ ] Activity files write correctly with proper message structure
- [ ] Course files parse correctly (course, course_point, record, lap messages)
- [ ] Course files write correctly with proper message structure
- [ ] File type routing works (workout → createWorkoutMessages, etc.)
- [ ] Validation ensures required messages per file type
- [ ] Default file type is "workout" for backward compatibility
- [ ] Tests cover file type detection and routing
- [ ] Test coverage ≥ 80% for new code
- [ ] No file exceeds 100 lines (except tests)
- [ ] Build passes without warnings
