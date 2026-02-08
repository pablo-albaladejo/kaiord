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

### FIT Files (~140KB)

- WorkoutIndividualSteps.fit
- WorkoutRepeatSteps.fit
- WorkoutCustomTargetValues.fit
- WorkoutRepeatGreaterThanStep.fit
- [Activity and Course files for integration tests]

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

**Input Files (*Input.gcn)** - Minimal payloads sent to API:
- WorkoutRunningNestedRepeatsInput.gcn - Running with all step types, HR zones/ranges, nested repeats
- WorkoutCyclingPowerCadenceInput.gcn - Cycling with power zones/ranges, cadence, speed
- WorkoutSwimmingAllStrokesInput.gcn - Swimming with all 6 strokes and equipment types
- WorkoutStrengthRepsInput.gcn - Strength training with reps condition type
- WorkoutEdgeCasesInput.gcn - Edge cases (long names, single iteration repeats)
- WorkoutMultisportTriathlonInput.gcn - Multisport triathlon (swim + bike + run)

**Output Files (*Output.gcn)** - Complete API responses with server-generated fields:
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
