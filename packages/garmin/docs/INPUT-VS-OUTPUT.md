# Garmin API: Input vs Output Schema Comparison

**Date:** 2026-02-07
**Tests Analyzed:** 19 exhaustive tests (100% success)
**Key Finding:** API accepts union types but normalizes output to numbers

---

## Executive Summary

Through systematic testing, we discovered the Garmin Connect API:
1. **Accepts flexible input types** - Strings or numbers for target values
2. **Normalizes output to numbers** - Always returns numbers (floats)
3. **Adds server fields** - workoutId, ownerId, timestamps, childStepId
4. **Expands minimal input** - Adds unitId, factor, displayOrder fields

---

## Target Value Type Handling

### Input Flexibility

The API accepts **EITHER strings OR numbers** for:
- `zoneNumber`
- `targetValueOne`
- `targetValueTwo`
- `secondaryTargetValueOne`
- `secondaryTargetValueTwo`

### Output Normalization

The API **ALWAYS returns numbers** (floats):

```typescript
// Input (either works)
{
  zoneNumber: "3"     // String
  // OR
  zoneNumber: 3       // Number
}

// Output (always number)
{
  zoneNumber: 3       // Integer if whole number
  // OR
  zoneNumber: 3.0     // Float (same value)
}
```

### Test Evidence

| Test | Input Field | Input Type | Input Value | Output Type | Output Value |
|------|-------------|------------|-------------|-------------|--------------|
| 7 | `zoneNumber` | string | `"3"` | number | `3` |
| 8 | `targetValueOne` | string | `"200"` | number | `200.0` |
| 8 | `targetValueTwo` | string | `"250"` | number | `250.0` |
| 1 | `zoneNumber` | number | `4` | number | `4` |
| 2 | `targetValueOne` | number | `150` | number | `150.0` |
| 2 | `targetValueTwo` | number | `170` | number | `170.0` |

**Conclusion:** Our previous finding about "power uses strings" was incorrect. Power accepts EITHER type, API converts to numbers.

---

## Input-Only Fields

Fields that can be sent in input but are NOT in output:

### None Found

All input fields appear in output (either directly or expanded).

**Note:** `isWheelchair` appears in both input and output unchanged.

---

## Output-Only Fields (Server-Assigned)

Fields that appear ONLY in output, never in input:

### Top-Level Fields

```typescript
{
  workoutId: number              // Server-assigned unique ID
  ownerId: number                // User's profile ID
  createdDate: string            // ISO 8601 timestamp
  updatedDate: string            // ISO 8601 timestamp
  author: {                      // Complete user object
    userProfilePk: number
    displayName: string
    fullName: string
    profileImgNameLarge: string | null
    profileImgNameMedium: string
    profileImgNameSmall: string
    userPro: boolean
    vivokidUser: boolean
  }
  sharedWithUsers: any[] | null
  trainingPlanId: number | null
  workoutProvider: string | null
  workoutSourceId: number | null
  uploadTimestamp: string | null
  atpPlanId: number | null
  consumer: any | null
  consumerName: string | null
  consumerImageURL: string | null
  consumerWebsiteURL: string | null
  workoutNameI18nKey: string | null
  descriptionI18nKey: string | null
  workoutThumbnailUrl: string | null
  isSessionTransitionEnabled: boolean | null
  shared: boolean
  locale: string | null
}
```

### Step-Level Fields

```typescript
{
  stepId: number                 // Server reassigns (input: 1,2,3 → output: 12367817088, etc.)
  childStepId: number | null     // Links nested steps to parent repeat (NEW!)
  description: string | null
  preferredEndConditionUnit: any | null
  endConditionCompare: any | null
  secondaryZoneNumber: number | null
  endConditionZone: any | null
  category: any | null
  exerciseName: string | null
  workoutProvider: any | null
  providerExerciseSourceId: any | null
  weightValue: number | null
  weightUnit: any | null
  stepAudioNote: string | null
}
```

### RepeatGroupDTO-Specific

```typescript
{
  childStepId: number            // Parent identifier (NEW!)
  skipLastRestStep: boolean | null
  preferredEndConditionUnit: any | null
  endConditionCompare: any | null
}
```

---

## Field Expansions

Fields where server adds additional data to input:

### 1. Pool Length Unit

**Input:**
```json
{
  "poolLengthUnit": {
    "unitKey": "meter"
  }
}
```

**Output:**
```json
{
  "poolLengthUnit": {
    "unitId": 1,
    "unitKey": "meter",
    "factor": 100.0
  }
}
```

### 2. Sport Type

**Input:**
```json
{
  "sportType": {
    "sportTypeId": 1,
    "sportTypeKey": "running"
  }
}
```

**Output:**
```json
{
  "sportType": {
    "sportTypeId": 1,
    "sportTypeKey": "running",
    "displayOrder": 1
  }
}
```

### 3. Step Type

**Input:**
```json
{
  "stepType": {
    "stepTypeId": 3,
    "stepTypeKey": "interval"
  }
}
```

**Output:**
```json
{
  "stepType": {
    "stepTypeId": 3,
    "stepTypeKey": "interval",
    "displayOrder": 3
  }
}
```

### 4. Stroke Type

**Input:**
```json
{
  "strokeType": {
    "strokeTypeId": 2
  }
}
```

**Output:**
```json
{
  "strokeType": {
    "strokeTypeId": 2,
    "strokeTypeKey": "backstroke",
    "displayOrder": 2
  }
}
```

### 5. Equipment Type

**Input:**
```json
{
  "equipmentType": {
    "equipmentTypeId": 2
  }
}
```

**Output:**
```json
{
  "equipmentType": {
    "equipmentTypeId": 2,
    "equipmentTypeKey": "kickboard",
    "displayOrder": 2
  }
}
```

---

## Value Transformations

### Number to Float Conversion

All numeric values are converted to floats in output:

```typescript
// Input
endConditionValue: 1200         // Integer

// Output
endConditionValue: 1200.0       // Float
```

### StepId Reassignment

Input uses simple sequential IDs, output uses server-generated IDs:

```typescript
// Input
stepId: 1, 2, 3, 4, 5

// Output
stepId: 12367817088, 12367817089, 12367817090, ...
```

---

## Repeat Block Transformations

### Input

```json
{
  "type": "RepeatGroupDTO",
  "stepId": 1,
  "stepOrder": 1,
  "stepType": {...},
  "numberOfIterations": 5,
  "smartRepeat": false,
  "endCondition": {...},
  "endConditionValue": 5,
  "workoutSteps": [...]
}
```

### Output (Additions)

```json
{
  "type": "RepeatGroupDTO",
  "stepId": 12367817279,              // Server-assigned
  "stepOrder": 2,
  "stepType": {...},
  "childStepId": 1,                   // NEW! Links nested steps
  "numberOfIterations": 5,
  "smartRepeat": false,
  "endCondition": {...},
  "endConditionValue": 5.0,           // Float
  "skipLastRestStep": null,           // NEW! Added by server
  "preferredEndConditionUnit": null,  // NEW!
  "endConditionCompare": null,        // NEW!
  "workoutSteps": [...]
}
```

---

## Schema Implementation Guide

### Input Schema (Flexible)

```typescript
// Accept union types for target values
const targetValueSchema = z.union([
  z.number(),
  z.string(),
]).nullable()

// Accept minimal sport/step type objects
const garminSportTypeInputSchema = z.object({
  sportTypeId: z.number(),
  sportTypeKey: z.string(),
  displayOrder: z.number().optional(), // Optional in input
})

// Minimal stroke type
const garminStrokeTypeInputSchema = z.object({
  strokeTypeId: z.number(),
  strokeTypeKey: z.string().optional(), // Can omit, server adds
  displayOrder: z.number().optional(),
})
```

### Output Schema (Strict)

```typescript
// Always numbers in output
const targetValueSchema = z.number().nullable()

// Always includes displayOrder
const garminSportTypeOutputSchema = z.object({
  sportTypeId: z.number(),
  sportTypeKey: z.string(),
  displayOrder: z.number(), // Required in output
})

// Always includes key and displayOrder
const garminStrokeTypeOutputSchema = z.object({
  strokeTypeId: z.number(),
  strokeTypeKey: z.string().nullable(),
  displayOrder: z.number(),
})

// Server-assigned fields
const garminWorkoutOutputSchema = garminWorkoutInputSchema.extend({
  workoutId: z.number(),
  ownerId: z.number(),
  author: garminAuthorSchema,
  createdDate: z.string(),
  updatedDate: z.string(),
  shared: z.boolean(),
  // ... all other output-only fields
})
```

---

## Key Takeaways for Implementation

### 1. Input Flexibility

**DO:**
- Accept union types for target values: `z.union([z.number(), z.string()])`
- Make optional fields truly optional (displayOrder, strokeTypeKey, etc.)
- Allow minimal objects (just IDs without keys)

**DON'T:**
- Require specific types (string vs number) for target values
- Require displayOrder in input
- Require expanded objects

### 2. Output Parsing

**DO:**
- Expect numbers (floats) for ALL target values
- Expect displayOrder on all type objects
- Expect server-assigned IDs (workoutId, stepId, etc.)
- Handle childStepId for repeat blocks

**DON'T:**
- Expect input stepId values to match output
- Expect string target values in output
- Try to parse output-only fields from input

### 3. Conversion Logic

```typescript
// KRD → Garmin Input
function toGarminInput(krd: KRD): GarminWorkoutInput {
  // Can send either numbers or strings
  // Recommend sending numbers for consistency
  return {
    targetValueOne: krd.target.min,  // Send as number
    targetValueTwo: krd.target.max,
    // Minimal objects (server will expand)
    sportType: {
      sportTypeId: 1,
      sportTypeKey: "running"
      // displayOrder optional
    }
  }
}

// Garmin Output → KRD
function fromGarminOutput(garmin: GarminWorkoutOutput): KRD {
  // Parse as numbers (they always are)
  return {
    target: {
      min: garmin.targetValueOne,  // Always number
      max: garmin.targetValueTwo,
    },
    id: garmin.workoutId,  // Use server ID
  }
}
```

---

## Test Coverage Summary

| Category | Tests | Coverage |
|----------|-------|----------|
| Running targets | 6 | HR zones, HR ranges, pace ranges, multiple targets, repeats, nested repeats |
| Cycling targets | 6 | Power zones, power ranges, cadence, speed, multiple targets, repeats |
| Swimming | 7 | All strokes (5), equipment (2), mixed workouts, repeats |
| **Total** | **19** | **100% success rate** |

---

## Validation Checklist

When implementing schemas:

- [ ] Input accepts union types for target values
- [ ] Output expects only numbers
- [ ] Input allows optional displayOrder fields
- [ ] Output requires displayOrder fields
- [ ] Input uses simple stepId (1,2,3...)
- [ ] Output handles server stepId (12367817088...)
- [ ] Output schema includes all server-assigned fields
- [ ] RepeatGroupDTO output includes childStepId
- [ ] Pool length unit gets expanded (unitId, factor)
- [ ] All type objects get displayOrder added
- [ ] Float conversion handled (1200 → 1200.0)

---

## Conclusion

The Garmin API provides excellent input flexibility (accepts strings or numbers) while maintaining strict output consistency (always numbers). Our schemas must reflect this asymmetry:

- **Input schemas:** Flexible, minimal, union types
- **Output schemas:** Strict, complete, number types

This design allows easy integration while ensuring reliable parsing.

---

**Files Analyzed:**
- `garmin-exhaustive-1` through `garmin-exhaustive-19.json`

**Next Steps:**
1. ✅ Update input schemas with union types
2. ✅ Update output schemas with number types
3. ✅ Add all server-assigned fields to output schemas
4. ✅ Implement converters with type handling
