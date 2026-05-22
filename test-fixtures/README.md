# Test Fixtures

Shared test fixtures for all packages in the Kaiord monorepo.

## Structure

```
test-fixtures/
├── fit/          # FIT binary files for testing
├── tcx/          # TCX XML files for testing
├── zwo/          # ZWO (Zwift) XML files for testing
├── gcn/          # GCN (Garmin Connect) JSON files for testing
└── krd/          # KRD JSON files for testing
```

## Usage

Import fixtures in your tests:

```typescript
import { readFileSync } from "fs";
import { join } from "path";

const fixturePath = join(
  process.cwd(),
  "../../test-fixtures/fit/WorkoutIndividualSteps.fit"
);
const fixture = readFileSync(fixturePath);
```

## Important

- **These files are NEVER published to npm**
- All packages share these fixtures (no duplication)
- Add new fixtures here, not in individual packages
- Keep fixtures minimal (only what's needed for tests)

## Fixtures Inventory

### FIT Files

**Workout fixtures** (~1KB total) — structured workouts for FIT writer/reader round-trip:

- `WorkoutIndividualSteps.fit`
- `WorkoutRepeatSteps.fit`
- `WorkoutCustomTargetValues.fit`
- `WorkoutRepeatGreaterThanStep.fit`

**Garmin SDK examples** (~250KB) — canonical reference files vendored from the Garmin FIT SDK examples. Use these to exercise non-workout file types and edge cases.

Activity / recorded files:

- `Activity.fit` (94KB) — standard `activity` file with developer fields, lap, 3601 records, 1 session
- `activity_developerdata.fit` (65KB) — `activity` with developer-defined fields
- `activity_multisport.fit` (3KB) — `activity` with 2 sessions / 7 laps for multisport
- `activity_poolswim.fit` (3KB) — `activity` with pool-swim length messages
- `activity_poolswim_with_hr.fit` (79KB) — `activity` with pool swim + HR data
- `activity_truncated.fit` (277B) — truncated `activity` for parser-resilience tests
- `DeveloperData.fit` (178B) — minimal file containing developer field definitions

Health / monitoring files (used by the `health-data` capability — see `openspec/specs/health-data/`):

- `MonitoringFile.fit` (2KB) — `monitoringB` file with 337 monitoring messages + monitoringInfo; covers daily_wellness round-trip (steps, active calories, activity-type intensity). Lacks explicit `intensity_minutes` / `floors_climbed`; those scenarios are exercised via fixtures harvested separately.
- `WeightScaleSingleUser.fit` (170B) — `weight` file with 2 weight_scale messages (weight + percentFat). Covers weight_measurement and minimal body_composition.
- `WeightScaleMultiUser.fit` (170B) — `weight` file with 2 weight_scale messages and `userProfileIndex` (multi-user scale support).

Settings file:

- `Settings.fit` (82B) — minimal `settings` file with user profile + HRM profile.

**Pending health fixtures** (not yet supplied; tracked in `openspec/changes/add-health-metrics-to-krd/tasks.md`):

- Sleep — `sleep_level` messages
- HRV — `hrv` messages
- Stress — `stress_level` messages

Source: vendored from <https://developer.garmin.com/fit/example-projects/> (`fit-sdk-c-examples`); regenerate via the SDK examples directory if any fixture corrupts.

### TCX Files (~16KB)

- WorkoutHeartRateTargets.tcx
- WorkoutMixedDurations.tcx
- WorkoutRepeatBlocks.tcx
- WorkoutSpeedTargets.tcx

### ZWO Files (~16KB)

- WorkoutIndividualSteps.zwo
- WorkoutRepeatSteps.zwo
- WorkoutCustomTargetValues.zwo
- WorkoutRepeatGreaterThanStep.zwo

### GCN Files (Garmin Connect API) (~158KB)

**Input Files (\*Input.gcn)** - Minimal payloads sent to API:

- WorkoutRunningNestedRepeatsInput.gcn - Running with all step types, HR zones/ranges, nested repeats
- WorkoutCyclingPowerCadenceInput.gcn - Cycling with power zones/ranges, cadence, speed
- WorkoutSwimmingAllStrokesInput.gcn - Swimming with all 6 strokes and equipment types
- WorkoutStrengthRepsInput.gcn - Strength training with reps condition type
- WorkoutEdgeCasesInput.gcn - Edge cases (long names, single iteration repeats)
- WorkoutMultisportTriathlonInput.gcn - Multisport triathlon (swim + bike + run)

**Output Files (\*Output.gcn)** - Complete API responses with server-generated fields:

- WorkoutRunningNestedRepeatsOutput.gcn - API response with workoutId, stepId, timestamps, etc.
- WorkoutCyclingPowerCadenceOutput.gcn - API response with expanded type objects
- WorkoutSwimmingAllStrokesOutput.gcn - API response with all stroke/equipment data
- WorkoutStrengthRepsOutput.gcn - API response with reps condition
- WorkoutEdgeCasesOutput.gcn - API response with truncated long name
- WorkoutMultisportTriathlonOutput.gcn - API response with global stepOrder across segments

**Note:** GCN format is the Garmin Connect API JSON format (3-letter extension: Garmin CoNnect)

- `*Input.gcn` = Input schema (flexible, minimal, accepts string|number for targets)
- `*Output.gcn` = Output schema (strict, complete, always numbers)

### KRD Files (~20KB)

- Corresponding .krd files for all formats above
