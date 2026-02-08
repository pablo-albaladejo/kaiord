# Garmin Connect API - Master Index

**Project:** Kaiord Garmin Connect Integration
**Status:** ✅ API Fully Validated - Ready for Implementation
**Date:** 2026-02-08
**Success Rate:** 100% (6/6 minimal comprehensive tests passed)

---

## 📋 Quick Navigation

### 🎯 Start Here

1. **[Final Comprehensive Findings](./API-FINDINGS.md)** - **PRIMARY REFERENCE**
   - Complete API documentation (500+ lines)
   - All 6 test results with analysis
   - Multisport support (NEW)
   - Input vs Output schemas
   - Implementation guidelines
   - **USE THIS for implementation**

### 📚 Research Phase Documents

2. **[Research Document](./garmin-connect-research.md)** - Initial research
   - Analysis of 7 GitHub repositories
   - API endpoints discovery
   - Authentication methods
   - Key finding: Structured workouts use `/workout-service/workout`

3. **[Schema Proposal](./garmin-schemas-proposal.md)** - Initial schema design
   - 3-tier schema structure
   - 16 files, ~1,150 lines of schemas
   - Input/Output separation concept

4. **[Conversion Mapping](./garmin-conversion-mapping.md)** - KRD ↔ Garmin mapping
   - Initial conversion strategy
   - Type mappings
   - Updated with real API findings

### 🧪 Testing Phase Documents

5. **[Input vs Output Schemas](./garmin-input-vs-output-schemas.md)** - **CRITICAL REFERENCE**
   - Comprehensive schema comparison
   - **KEY FINDING:** API accepts strings OR numbers, returns only numbers
   - Field expansions documented
   - Server-assigned fields
   - Validation checklist

6. **[Complete Findings](./garmin-api-complete-findings.md)** - 32 comprehensive tests
   - Swimming stroke/equipment complete maps
   - All condition types (including 4, 7, 10)
   - SubSport limitation documented
   - 19/32 tests passed (59% - subsports failed)

7. **[API Findings](./garmin-api-findings.md)** - Real API examples analysis
   - 4 actual API requests/responses
   - Type handling discoveries
   - lap.button values by sport
   - Secondary targets

8. **[Test Cases](./garmin-api-test-cases.md)** - Test case templates
   - 31 test cases organized by priority
   - Template for capturing responses

9. **[Test Summary](./garmin-api-test-summary.md)** - Test execution summary
   - Results from systematic testing
   - Analysis of findings

10. **[Testing Guide](./garmin-api-testing-guide.md)** - How to run tests
    - Step-by-step testing instructions

---

## 🗂️ Schema Files

### Production-Ready Schemas (Temporary Location)

**Location:** `docs/garmin-schemas-temp/`

These schemas are ready to be moved to the actual implementation:

#### Common Schemas

- `common/sport-type.schema.ts` - Sport type definitions
- `common/step-type.schema.ts` - Step type definitions
- `common/condition-type.schema.ts` - Condition type definitions
- `common/target-type.schema.ts` - Target type definitions
- `common/stroke-type.schema.ts` - Swimming stroke types
- `common/equipment-type.schema.ts` - Swimming equipment types
- `common/drill-type.schema.ts` - Drill types
- `common/unit.schema.ts` - Unit definitions

#### Input Schemas (Flexible)

- `input/workout-input.schema.ts` - Workout input schema
- `input/segment-input.schema.ts` - Segment input schema (multisport)
- `input/step-input.schema.ts` - Step input schema
- `input/repeat-input.schema.ts` - Repeat block input schema

#### Output Schemas (Strict)

- `output/workout.schema.ts` - Workout output schema
- `output/segment.schema.ts` - Segment output schema
- `output/step.schema.ts` - Step output schema
- `output/repeat.schema.ts` - Repeat block output schema
- `output/author.schema.ts` - Author object schema

**README:** `garmin-schemas-temp/README.md` - Schema organization and usage

---

## 🧪 Test Scripts

### Minimal Comprehensive Test Suite (RECOMMENDED)

- **`garmin-minimal-comprehensive-tests.sh`** ⭐ **BEST TEST SUITE**
  - 6 MEGA workouts
  - 100% pass rate
  - Tests ALL API features in minimal calls
  - Includes multisport support
  - **Use this for validation**

### Complete Test Suites

- **`garmin-comprehensive-tests.sh`** - 32 comprehensive tests
  - Swimming strokes (6), equipment (6), subsports (13), other sports (3)
  - 19/32 passed (subsport tests failed)

- **`garmin-exhaustive-tests.sh`** - 19 exhaustive tests
  - All Run/Bike/Swim combinations
  - All targets, repeats, nested repeats
  - 19/19 passed (100%)

### Testing Tools

- **`garmin-api-systematic-tests.ts`** - Node.js systematic test script
  - 6 initial systematic tests
  - TypeScript-based

- **`garmin-schema-validator.ts`** - Schema validation tool
  - Compares input vs output
  - Identifies type changes

- **`garmin-api-curl-commands.sh`** - Raw curl commands
  - Direct API testing

---

## 📊 Test Result Files

### Minimal Comprehensive Tests (6 files) ⭐

- `garmin-minimal-test-1--mega-running.json` - Running with nested repeats
- `garmin-minimal-test-2--mega-cycling.json` - Cycling with power/cadence
- `garmin-minimal-test-3--mega-swimming.json` - Swimming all strokes/equipment
- `garmin-minimal-test-4--strength---cardio.json` - Strength with reps
- `garmin-minimal-test-5--edge-cases.json` - Edge cases
- `garmin-minimal-test-6--mega-multisport.json` - Multisport triathlon

### Exhaustive Tests (19 files)

Running tests (6):

- `garmin-exhaustive-1-run:-hr-zone-4.json`
- `garmin-exhaustive-2-run:-hr-range-150-170.json`
- `garmin-exhaustive-3-run:-pace-3:30-4:00-km.json`
- `garmin-exhaustive-4-run:-pace-+-hr-secondary.json`
- `garmin-exhaustive-5-run:-repeat-5x-hr-zones.json`
- `garmin-exhaustive-6-run:-nested-repeat-pace.json`

Cycling tests (6):

- `garmin-exhaustive-7-bike:-power-zone-3.json`
- `garmin-exhaustive-8-bike:-power-200-250w.json`
- `garmin-exhaustive-9-bike:-cadence-80-95.json`
- `garmin-exhaustive-10-bike:-speed-25-30-km-h.json`
- `garmin-exhaustive-11-bike:-power-+-cadence.json`
- `garmin-exhaustive-12-bike:-repeat-4x-power.json`

Swimming tests (7):

- `garmin-exhaustive-13-swim:-backstroke-200m.json`
- `garmin-exhaustive-14-swim:-breaststroke-200m.json`
- `garmin-exhaustive-15-swim:-butterfly-100m.json`
- `garmin-exhaustive-16-swim:-drill-+-kickboard.json`
- `garmin-exhaustive-17-swim:-any-+-pull-buoy.json`
- `garmin-exhaustive-18-swim:-mixed-strokes-im.json`
- `garmin-exhaustive-19-swim:-repeat-mixed.json`

### Systematic Tests (6 files)

- `garmin-test-1-hr-range.json`
- `garmin-test-2-repeat.json`
- `garmin-test-3-cadence.json`
- `garmin-test-4-swimming-freestyle.json`
- `garmin-test-5-subsport-indoor-cycling.json`
- `garmin-test-6-step-types.json`

### Comprehensive Tests (50+ files)

- Swimming stroke tests: `garmin-test-*-swimming-stroke-id-*.json` (6 files)
- Swimming equipment tests: `garmin-test-*-swimming-equipment-id-*.json` (6 files)
- SubSport tests: `garmin-test-*-subsport-*.json` (13 files - ALL FAILED)
- Other sport tests: Various sports tested

---

## 🎯 Implementation Roadmap

### Phase 1: Schema Implementation ✅ READY

All information gathered. Schemas are in `garmin-schemas-temp/` ready to be moved to:

- `packages/garmin/src/domain/schemas/`

**Action Items:**

1. Create `packages/garmin/` package structure
2. Move schemas from `docs/garmin-schemas-temp/` to `packages/garmin/src/domain/schemas/`
3. Update imports and exports
4. Add tests for schema validation

### Phase 2: Converter Implementation

**KRD → Garmin:**

- All target types (power, HR, pace, speed, cadence)
- All step types
- Nested repeats
- Swimming strokes/equipment
- Multisport support

**Garmin → KRD:**

- Parse output (always numbers)
- Handle server-assigned fields
- Multisport → multiple KRDs

**Action Items:**

1. Create `packages/garmin/src/adapters/converters/`
2. Implement `krd-to-garmin.converter.ts`
3. Implement `garmin-to-krd.converter.ts`
4. Implement `multisport-to-krd.converter.ts`
5. Add comprehensive tests

### Phase 3: API Client

**Authentication:**

- OAuth1/OAuth2 via `garth` library
- Cookie-based session management

**Endpoints:**

- POST `/workout-service/workout` - Create workout
- GET `/workout-service/workout/{id}` - Get workout
- DELETE `/workout-service/workout/{id}` - Delete workout

**Action Items:**

1. Create `packages/garmin/src/infrastructure/api/`
2. Implement `garmin-api-client.ts`
3. Implement authentication flow
4. Add error handling
5. Add integration tests

### Phase 4: CLI Integration

**Commands:**

- `kaiord convert --in workout.krd --out workout.gcn` - Convert to Garmin format
- `kaiord convert --in workout.gcn --out workout.krd` - Convert from Garmin format
- `kaiord upload --file workout.gcn --format garmin` - Upload to Garmin Connect

**Action Items:**

1. Update `packages/cli/src/commands/convert.ts`
2. Add Garmin format support
3. Add upload command
4. Update documentation

---

## 📖 Key Findings Summary

### ✅ What Works

1. **All Sports:** Running, Cycling, Swimming, Strength Training, Multisport
2. **All Target Types:** Power zones/ranges, HR zones/ranges, Pace, Speed, Cadence
3. **All Step Types:** Warmup, Interval, Recovery, Rest, Cooldown, Repeat
4. **All Condition Types:** Lap button, Time, Distance, Calories, Iterations, Reps
5. **Swimming:** All 6 strokes, all 6 equipment types
6. **Multiple Targets:** Primary + Secondary (e.g., Power + Cadence)
7. **Nested Repeats:** Tested 2-3 levels deep ✅
8. **Multisport:** Triathlon-style workouts with multiple segments ✅

### ❌ What Doesn't Work

1. **SubSports:** Not supported in structured workout API (all 13 subsport tests failed)
   - indoor_cycling, lap_swimming, virtual_run, etc.
   - Workaround: Use main sport (cycling, swimming, running)

### 🔍 Critical Discoveries

1. **Type System:**
   - Input: Accepts strings OR numbers for target values
   - Output: Always returns numbers (floats)
   - Recommendation: Send numbers for consistency

2. **Multisport Structure:**
   - sportTypeId: 10, sportTypeKey: "multi_sport"
   - stepOrder must be globally unique across ALL segments
   - Each segment has its own metrics and sportType

3. **Swimming:**
   - strokeTypeId: 6 ("free") discovered
   - Requires poolLength + poolLengthUnit

4. **Server Transformations:**
   - stepId reassigned (1,2,3 → 12368119896, etc.)
   - displayOrder added to all type objects
   - Unit objects expanded (unitId, factor)
   - childStepId added for nested steps

---

## 📞 API Reference

**Endpoint:** `POST https://connect.garmin.com/gc-api/workout-service/workout`

**Authentication:**

- Cookie-based: GARMIN-SSO-GUID, GARMIN-SSO-CUST-GUID, session token
- CSRF token: connect-csrf-token header
- Use `garth` library for OAuth flow

**Rate Limits:**

- Not officially documented
- Conservative approach: 2-second delay between requests (used in tests)

**Payload Limits:**

- Max ~50 steps per workout (assumed, not tested)
- Max 255 characters for workout name (tested)
- No limit on segments for multisport (tested up to 3)

---

## 🎓 Learning Resources

### External References

1. [Garmin Connect API GitHub Projects](https://github.com/topics/garmin-connect-api) - Community projects
2. [garth Library](https://github.com/matin/garth) - Python OAuth for Garmin
3. [garmin-workouts-mcp](https://github.com/st3v/garmin-workouts-mcp/) - MCP server implementation

### Internal Documents

- **CLAUDE.md** - Project conventions and architecture
- **AGENTS.md** - AI development guidelines
- **docs/krd-format.md** - KRD format specification

---

## 📝 Notes for Implementation

### File Extension

- Proposed: `.gcn` (Garmin CoNnect - 3 letters required)
- Format: JSON (Garmin Connect API payload)

### Package Structure

```
packages/garmin/
├── src/
│   ├── domain/
│   │   ├── schemas/           # Zod schemas (from garmin-schemas-temp/)
│   │   │   ├── common/
│   │   │   ├── input/
│   │   │   └── output/
│   │   └── types/             # TypeScript types
│   ├── adapters/
│   │   ├── converters/        # KRD ↔ Garmin converters
│   │   └── validators/        # Schema validators
│   ├── infrastructure/
│   │   └── api/               # API client (garth-based)
│   └── index.ts
├── package.json
└── README.md
```text

### Testing Strategy

1. Unit tests for converters
2. Schema validation tests
3. Round-trip tests (KRD → Garmin → KRD)
4. API integration tests (with authentication)
5. Multisport-specific tests

---

## ✅ Validation Checklist

Before implementing, verify you have:

- [x] Read final comprehensive findings document
- [x] Understood input vs output schema differences
- [x] Reviewed all type maps (sports, targets, conditions, strokes, equipment)
- [x] Examined multisport structure and requirements
- [x] Checked test results (6 minimal comprehensive tests)
- [x] Reviewed schema files in garmin-schemas-temp/
- [x] Understood server transformations and field expansions
- [ ] Decided on authentication approach (OAuth1 vs OAuth2)
- [ ] Set up garth library or equivalent
- [ ] Created package structure
- [ ] Moved schemas to production location
- [ ] Implemented converters with tests
- [ ] Implemented API client with authentication
- [ ] Added CLI integration
- [ ] Written documentation

---

## 📧 Contact & Support

For questions about this API integration:

1. Check the final comprehensive findings document first
2. Review test results in JSON files
3. Consult input vs output schemas document
4. Refer to this master index for navigation

---

**Document Status:** Living document - Update as implementation progresses
**Last Updated:** 2026-02-08
**Version:** 1.0.0
**Author:** Pablo + Claude Code (Sonnet 4.5)
