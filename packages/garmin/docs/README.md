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

### ✅ Phase 1: Format Converters (COMPLETE)

- [x] Research complete (100% API coverage)
- [x] API validated with 6 comprehensive tests
- [x] Schemas implemented (input/output/common)
- [x] Schema issues fixed (union types, missing fields)
- [x] **Converters implemented**:
  - [x] `garmin-to-krd.converter.ts` - GCN → KRD conversion
  - [x] `krd-to-garmin.converter.ts` - KRD → GCN conversion
  - [x] All mappers (sport, target, condition, stroke, equipment, intensity)
- [x] **Ports implemented**:
  - [x] `GarminReader` port in @kaiord/core
  - [x] `GarminWriter` port in @kaiord/core
  - [x] Port implementations in @kaiord/garmin
- [x] **Providers implemented**:
  - [x] `createGarminProviders()` factory
  - [x] Wired into @kaiord/core application layer
- [x] **Testing complete**:
  - [x] Unit tests for all converters (36/36 passing)
  - [x] Round-trip tests (6/6 fixtures passing)
  - [x] Coverage: 80%+ achieved
- [x] **Integration complete**:
  - [x] CLI integration (`kaiord convert` supports .gcn files)
  - [x] Web editor integration (import/export GCN files)
  - [x] CI/CD pipeline updated

### 🔮 Phase 2: API Client (FUTURE)

- [ ] OAuth implementation (using `garth` library)
- [ ] API endpoints (create, read, delete workouts)
- [ ] Authentication flow
- [ ] Rate limiting and error handling

**Note:** Phase 2 is not required for format conversion and is planned for a future release.

---

## Architecture

This package follows the **hexagonal (ports & adapters)** architecture pattern:

```
@kaiord/core (Domain)
    ↓ depends on
Ports (interfaces)
    ↑ implemented by
Adapters (@kaiord/garmin)
```

**Key Principle:** Domain and application logic don't depend on external libraries. All external dependencies (Zod schemas, JSON parsing) are isolated in adapter layer.

See [IMPLEMENTATION.md](./IMPLEMENTATION.md) for detailed architecture diagrams and patterns.

---

## Related Documentation

### Kaiord Project Documentation

- **[/CLAUDE.md](/CLAUDE.md)** - Project conventions, code style, and architecture rules
- **[/AGENTS.md](/AGENTS.md)** - AI development guidelines and non-negotiable rules
- **[/docs/architecture.md](/docs/architecture.md)** - Hexagonal architecture explained
- **[/docs/krd-format.md](/docs/krd-format.md)** - KRD format specification

### Package-Specific Documentation

- **[IMPLEMENTATION.md](./IMPLEMENTATION.md)** - **START HERE** - Complete implementation guide with code examples
- **[API-FINDINGS.md](./API-FINDINGS.md)** - Garmin Connect API research and findings
- **[INPUT-VS-OUTPUT.md](./INPUT-VS-OUTPUT.md)** - Critical schema asymmetry documentation
- **[TESTING-GUIDE.md](./TESTING-GUIDE.md)** - How to run live API tests
- **[TEST-RESULTS.md](./TEST-RESULTS.md)** - Real API test results
- **[SCHEMA-VALIDATION.md](./SCHEMA-VALIDATION.md)** - Schema validation report
- **[MASTER-INDEX.md](./MASTER-INDEX.md)** - Navigation hub for research documents

---

## Quick Start

```typescript
import { createGarminProviders } from "@kaiord/garmin";

// Create providers
const { garminReader, garminWriter } = createGarminProviders();

// Convert GCN to KRD
const krd = await garminReader.readGcn(gcnString);

// Convert KRD to GCN
const gcnOutput = await garminWriter.writeGcn(krd);
```

See [IMPLEMENTATION.md](./IMPLEMENTATION.md) for complete usage examples and patterns.

---

**Last Updated:** 2026-02-08
**Version:** 1.0.0
**Package Status:** ✅ Production Ready
