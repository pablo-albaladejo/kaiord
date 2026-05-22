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

Health / monitoring fixtures (used by the `health-data` capability — see `openspec/specs/health-data/`):

**Real-device fixtures** (harvested from a Garmin Connect data export of an active user; PII-stripped — the FIT binary does not carry user-identifying fields):

- `HealthSleepOvernight.fit` (4.7 KB) — `file_type: sleep (49)` with 34 `sleep_level` messages. Canonical mid-size sleep session covering REM / deep / light / awake transitions across one night.
- `HealthSleepFullNight.fit` (14 KB) — `file_type: sleep (49)` with 311 `sleep_level` messages. Bigger fixture for stage-density edge cases.
- `HealthMonitoringStressDay.fit` (6.5 KB) — `file_type: monitoringB` with 246 `monitoring` + 1 `monitoring_info` + 238 `stress_level` messages. Canonical day of daily-wellness + stress (Garmin emits both in the same `monitoringB` file_type, not separate files).
- `HealthMonitoringStressFullDay.fit` (29 KB) — `file_type: monitoringB` with 1127 `monitoring` + 900 `stress_level` messages. Large fixture for scale / performance tests.

**SDK example fixtures** (vendored from the Garmin FIT SDK examples directory):

- `MonitoringFile.fit` (2 KB) — `file_type: monitoringB` synthetic example with 337 monitoring messages. Kept for SDK-parity testing alongside the real-device fixtures above.
- `WeightScaleSingleUser.fit` (170 B) — `file_type: weight` with 2 weight_scale messages (weight + percentFat). Covers `weight_measurement` and minimal `body_composition`.
- `WeightScaleMultiUser.fit` (170 B) — `file_type: weight` with 2 weight_scale messages and `userProfileIndex` (multi-user scale support).

Settings file:

- `Settings.fit` (82 B) — minimal `settings` file with user profile + HRM profile.

**Pending health fixtures** (still required by `openspec/changes/add-health-metrics-to-krd/tasks.md`):

- HRV — `hrv` / `hrv_status_summary` / `hrv_value` messages. None present in the supplied Garmin Connect export; HRV Status data only ships on newer watch models with the HRV Status feature enabled, and is sometimes excluded from the standard Account export. Track a follow-up to harvest from a compatible device.

Sources: the four `Health*.fit` files come from a Garmin Connect "Export Your Data" ZIP under `DI_CONNECT/DI-Connect-Wellness/`. The SDK examples (`Activity.fit`, `MonitoringFile.fit`, `WeightScale*.fit`, etc.) are vendored from <https://developer.garmin.com/fit/example-projects/>.

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
