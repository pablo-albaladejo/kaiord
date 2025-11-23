# Test Fixtures

This directory is intentionally minimal. **DO NOT add fixture files here.**

## Fixture Location

All test fixtures are centralized in `@kaiord/core/src/tests/fixtures/` to avoid duplication across packages.

## Usage in CLI Tests

### For Unit Tests (Vitest)

Use the test utilities from `@kaiord/core/test-utils`:

```typescript
import {
  loadFitFixture,
  loadKrdFixture,
  loadFixturePair,
  FIXTURE_NAMES,
} from "@kaiord/core/test-utils";

// Load FIT file as Uint8Array
const fitBuffer = loadFitFixture("WorkoutIndividualSteps.fit");

// Load KRD file as parsed object
const krd = loadKrdFixture("WorkoutIndividualSteps.krd");

// Load both for round-trip testing
const { fit, krd } = loadFixturePair(FIXTURE_NAMES.INDIVIDUAL_STEPS);
```

### For Integration Tests (CLI execution)

Use the fixture path helpers from `tests/helpers/fixture-paths.ts`:

```typescript
import {
  getFixturePath,
  getFixturesDir,
  FIXTURE_NAMES,
} from "../helpers/fixture-paths";

// Get path to specific fixture file
const inputPath = getFixturePath("fit-files", "WorkoutIndividualSteps.fit");

// Get path to fixtures directory (for glob patterns)
const fixturesDir = getFixturesDir("fit-files");
const globPattern = `${fixturesDir}/*.fit`;

// Use predefined fixture names
const krdPath = getFixturePath(
  "krd-files",
  `${FIXTURE_NAMES.INDIVIDUAL_STEPS}.krd`
);
```

## Rationale

**Single source of truth**: All test fixtures are maintained in `@kaiord/core/src/tests/fixtures/` to avoid duplication across packages.

**Benefits**:

- No duplication of binary files
- Consistent test data across all packages (`core`, `cli`, `workout-spa-editor`)
- Easier maintenance (update once, use everywhere)
- Works on all platforms (no symlink issues on Windows)
- Type-safe fixture loading with TypeScript

## Adding New Fixtures

Add fixtures to `packages/core/src/tests/fixtures/` and they will automatically be available to all packages.

See `packages/core/src/tests/fixtures/README.md` for detailed instructions.
