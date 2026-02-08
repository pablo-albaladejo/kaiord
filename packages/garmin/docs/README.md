# @kaiord/garmin - Documentation

**Status:** Implemented - Package complete with full test coverage
**Date:** 2026-02-08
**Package Tests:** 36/36 passing (80%+ coverage)
**API Coverage:** 100% (6/6 workout types validated)

---

## Documentation Index

### Essential References

1. **[API Findings](./API-FINDINGS.md)** - PRIMARY REFERENCE
   - Complete Garmin Connect API documentation
   - All 6 test results with analysis
   - Multisport support
   - Input vs Output schemas
   - Implementation guidelines

2. **[Input vs Output Schemas](./INPUT-VS-OUTPUT.md)** - CRITICAL
   - Schema comparison and differences
   - Type handling (union types to strict numbers)
   - Field expansions and transformations

3. **[Schema Validation Report](./SCHEMA-VALIDATION.md)**
   - Validation of 21 schemas against 6 fixtures
   - All issues resolved in implementation

4. **[Test Results](./TEST-RESULTS.md)** - REAL API TESTS
   - 6 workouts created successfully on Garmin Connect
   - Schema issues confirmed with live API
   - Input vs Output comparison

5. **[Testing Guide](./TESTING-GUIDE.md)** - HOW TO TEST
   - How to run live API tests
   - Credential setup
   - Troubleshooting

6. **[Master Index](./MASTER-INDEX.md)** - NAVIGATION HUB
   - Links to all research phase documents in root docs/

---

## Package Structure

```
packages/garmin/
  src/
    adapters/
      converters/          # GCN <-> KRD converters
        garmin-to-krd.converter.ts
        krd-to-garmin.converter.ts
      mappers/             # Entity mappers (no tests needed)
        condition.mapper.ts
        equipment.mapper.ts
        intensity.mapper.ts
        sport.mapper.ts
        stroke.mapper.ts
        target.mapper.ts
      schemas/             # Zod schemas
        common/            # Shared enums and types
        input/             # Flexible input schemas
        output/            # Strict output schemas
      round-trip/          # Round-trip tests
      garmin-reader.ts     # GarminReader port implementation
      garmin-writer.ts     # GarminWriter port implementation
    providers.ts           # createGarminProviders factory
    index.ts               # Package exports
```

---

## Test Fixtures

**Location:** `test-fixtures/gcn/` (12 files: 6 input + 6 output)

**Input Files** (`*Input.gcn`) - Minimal payloads for API:

- `WorkoutRunningNestedRepeatsInput.gcn` - All step types, HR zones/ranges, nested repeats
- `WorkoutCyclingPowerCadenceInput.gcn` - Power zones/ranges, cadence, speed
- `WorkoutSwimmingAllStrokesInput.gcn` - All 6 strokes, all 6 equipment types
- `WorkoutStrengthRepsInput.gcn` - Reps condition type
- `WorkoutEdgeCasesInput.gcn` - Edge cases (long names, single iteration)
- `WorkoutMultisportTriathlonInput.gcn` - Multisport triathlon

**Output Files** (`*Output.gcn`) - Complete API responses:

- `WorkoutRunningNestedRepeatsOutput.gcn` - With workoutId, stepId, author, timestamps
- `WorkoutCyclingPowerCadenceOutput.gcn` - With expanded type objects (displayOrder, etc.)
- `WorkoutSwimmingAllStrokesOutput.gcn` - With full stroke/equipment data
- `WorkoutStrengthRepsOutput.gcn` - With server-assigned IDs
- `WorkoutEdgeCasesOutput.gcn` - With truncated long name (255 chars max)
- `WorkoutMultisportTriathlonOutput.gcn` - With global stepOrder

---

## Key Design Decisions

### Input vs Output Schema Asymmetry

The Garmin Connect API has fundamentally different input and output schemas:

**Input (Flexible):**

- Accepts strings OR numbers for target values
- Minimal type objects (just ID + key)
- Optional displayOrder fields

**Output (Strict):**

- Always returns numbers (floats)
- Expanded type objects (+ displayOrder, unitId, factor)
- Server-assigned fields (workoutId, stepId, childStepId, timestamps)

### Multisport Support

- sportTypeId: 10, sportTypeKey: "multi_sport"
- Multiple workoutSegments with different sports
- stepOrder must be globally sequential across ALL segments
- Each segment has its own metrics (avgTrainingSpeed, estimatedDuration, etc.)

### Not Supported

SubSports are not supported in the Garmin structured workout API (all subsport tests failed).

---

## Implementation Status

- [x] Research complete
- [x] API validated (100%)
- [x] Schemas implemented and tested
- [x] Converters implemented (GCN to KRD and KRD to GCN)
- [x] Round-trip tests passing (6/6 fixtures)
- [x] Package integrated into CLI
- [x] Package integrated into web editor
- [x] CI/CD pipeline updated
- [ ] API client (OAuth + REST) - future phase

---

**Last Updated:** 2026-02-08
**Version:** 1.0.0
