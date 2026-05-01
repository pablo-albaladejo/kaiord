# Test Fixtures - Shared Across Packages

This directory contains test fixtures shared across all packages in the monorepo.

## 📁 Structure

```
fixtures/
├── fit-files/          # Binary FIT files for tests
│   ├── WorkoutIndividualSteps.fit
│   ├── WorkoutRepeatSteps.fit
│   ├── WorkoutCustomTargetValues.fit
│   └── WorkoutRepeatGreaterThanStep.fit
├── krd-files/          # KRD (JSON) files for tests
│   ├── WorkoutIndividualSteps.krd
│   ├── WorkoutRepeatSteps.krd
│   ├── WorkoutCustomTargetValues.krd
│   └── WorkoutRepeatGreaterThanStep.krd
└── README.md           # This file
```

## 🎯 Purpose

These fixtures are used by:

1. **@kaiord/core** - FIT ↔ KRD conversion tests
2. **@kaiord/cli** - CLI command tests
3. **@kaiord/workout-spa-editor** - File loading tests

## 📝 Conventions

### File Names

Files follow the `PascalCase` convention to stay consistent with Garmin's test names:

- `WorkoutIndividualSteps` - Workout with individual steps
- `WorkoutRepeatSteps` - Workout with repeat blocks
- `WorkoutCustomTargetValues` - Workout with custom targets
- `WorkoutRepeatGreaterThanStep` - Workout with repeat conditions

### FIT/KRD Pairs

Every `.fit` file has a matching `.krd` with the same base name. This enables:

- Round-trip tests (FIT → KRD → FIT)
- Conversion validation
- Golden tests

## 🔧 Use in Tests

### From @kaiord/core

```typescript
import { readFileSync } from "fs";
import { join } from "path";

const fitBuffer = readFileSync(
  join(__dirname, "fixtures/fit-files/WorkoutIndividualSteps.fit")
);

const krdJson = readFileSync(
  join(__dirname, "fixtures/krd-files/WorkoutIndividualSteps.krd"),
  "utf-8"
);
```

### From @kaiord/workout-spa-editor (Unit Tests)

```typescript
// ✅ Recommended: Use test-utils helpers from @kaiord/core
import { loadKrdFixture, loadFitFixture } from "@kaiord/core/test-utils";

const krd = loadKrdFixture("WorkoutIndividualSteps.krd");
const fitBuffer = loadFitFixture("WorkoutIndividualSteps.fit");

// ❌ Avoid: Manual path resolution
import { readFileSync } from "fs";
import { join } from "path";

const krdPath = join(
  __dirname,
  "../../../core/src/tests/fixtures/krd-files/WorkoutIndividualSteps.krd"
);
```

### From @kaiord/cli (Integration Tests)

```typescript
// ✅ Recommended: Use fixture path helpers
import { getFixturePath, getFixturesDir } from "../helpers/fixture-paths";

// For single file
const inputPath = getFixturePath("fit-files", "WorkoutIndividualSteps.fit");

// For glob patterns
const fixturesDir = getFixturesDir("fit-files");
const globPattern = `${fixturesDir}/*.fit`;

// ❌ Avoid: Manual path resolution
import { resolve } from "path";

const fixturePath = resolve(
  __dirname,
  "../../core/src/tests/fixtures/fit-files/WorkoutIndividualSteps.fit"
);
```

## 📦 Adding New Fixtures

### 1. Add the FIT file

```bash
cp new-workout.fit packages/core/src/tests/fixtures/fit-files/
```

### 2. Generate the matching KRD

```bash
pnpm kaiord convert \
  --input packages/core/src/tests/fixtures/fit-files/new-workout.fit \
  --output packages/core/src/tests/fixtures/krd-files/new-workout.krd
```

### 3. Validate the pair

```bash
# Round-trip test
pnpm kaiord convert \
  --input packages/core/src/tests/fixtures/krd-files/new-workout.krd \
  --output /tmp/test.fit

# Compare against the original
diff packages/core/src/tests/fixtures/fit-files/new-workout.fit /tmp/test.fit
```

## 🎨 Fixture Characteristics

### WorkoutIndividualSteps.fit/krd

- Individual steps without repeats
- Different duration types (time, distance)
- Different target types (power, heart_rate)
- Varied intensities (warmup, active, cooldown)

### WorkoutRepeatSteps.fit/krd

- Simple repeat blocks
- Multiple steps inside each block
- Repetition counts

### WorkoutCustomTargetValues.fit/krd

- Targets with custom values
- Power zones
- Heart-rate ranges
- FTP percentages

### WorkoutRepeatGreaterThanStep.fit/krd

- Advanced repeat conditions
- Repeat until power greater than
- Repeat until heart rate less than
- Conditional durations

## 🔍 Validation

Every fixture must:

1. ✅ Validate against the KRD schema
2. ✅ Pass round-trip tests (FIT → KRD → FIT)
3. ✅ Be a real Garmin file (not synthetic)
4. ✅ Stay under 20KB (for fast tests)
5. ✅ Be anonymized (no personal data)

## 📊 File Sizes

| File                             | Size | Use            |
| -------------------------------- | ---- | -------------- |
| WorkoutIndividualSteps.fit       | ~2KB | Basic tests    |
| WorkoutRepeatSteps.fit           | ~3KB | Repeat tests   |
| WorkoutCustomTargetValues.fit    | ~4KB | Target tests   |
| WorkoutRepeatGreaterThanStep.fit | ~5KB | Advanced tests |

## 🚀 Shared Test Utilities

The `@kaiord/core/test-utils` package provides helper functions for loading fixtures:

```typescript
// Available from @kaiord/core/test-utils
import {
  loadFitFixture,
  loadKrdFixture,
  loadKrdFixtureRaw,
  loadFixturePair,
  getFixturePath,
  FIXTURE_NAMES,
} from "@kaiord/core/test-utils";

// Load FIT file as Uint8Array
const fitBuffer = loadFitFixture("WorkoutIndividualSteps.fit");

// Load KRD file as parsed object
const krd = loadKrdFixture("WorkoutIndividualSteps.krd");

// Load KRD file as raw JSON string
const jsonString = loadKrdFixtureRaw("WorkoutIndividualSteps.krd");

// Load both FIT and KRD for round-trip testing
const { fit, krd } = loadFixturePair("WorkoutIndividualSteps");

// Get full path to fixture file
const path = getFixturePath("fit", "WorkoutIndividualSteps.fit");

// Use predefined fixture names
const { fit, krd } = loadFixturePair(FIXTURE_NAMES.INDIVIDUAL_STEPS);
```

## 📝 Maintenance

- **Review fixtures** when the KRD schema changes
- **Regenerate KRD** when the conversion format improves
- **Validate round-trip** after changes to converters
- **Keep sizes small** for fast tests

## 🔗 References

- [KRD Format Spec](../../../../../docs/krd-format.md)
- [Testing Guidelines](../../../../../docs/testing.md)
- [Garmin FIT SDK](https://github.com/garmin/fit-javascript-sdk)
