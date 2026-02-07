# Test Fixtures

Shared test fixtures for all packages in the Kaiord monorepo.

## Structure

```
test-fixtures/
├── fit/          # FIT binary files for testing
├── tcx/          # TCX XML files for testing
├── zwo/          # ZWO (Zwift) XML files for testing
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

### KRD Files (~20KB)

- Corresponding .krd files for all formats above
