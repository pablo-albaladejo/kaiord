# KRD Fixtures Generation

This document describes the automated generation of KRD test fixtures from FIT files.

## Overview

The `generate:krd-fixtures` script converts all FIT test files to KRD format, creating a parallel set of JSON fixtures that can be used for testing, documentation, and validation.

## Generated Files

The script generates the following KRD files in `src/tests/fixtures/krd-files/`:

| KRD File                           | Source FIT File                    | Description                           |
| ---------------------------------- | ---------------------------------- | ------------------------------------- |
| `WorkoutIndividualSteps.krd`       | `WorkoutIndividualSteps.fit`       | Basic workout with individual steps   |
| `WorkoutRepeatSteps.krd`           | `WorkoutRepeatSteps.fit`           | Workout with repetition blocks        |
| `WorkoutRepeatGreaterThanStep.krd` | `WorkoutRepeatGreaterThanStep.fit` | Workout with conditional repeat steps |
| `WorkoutCustomTargetValues.krd`    | `WorkoutCustomTargetValues.fit`    | Workout with custom target values     |

## Usage

### Generate KRD Fixtures

```bash
cd packages/core
pnpm run generate:krd-fixtures
```

### Validate Generated Files

```bash
cd packages/core
pnpm vitest --run krd-fixtures
```

## Script Details

### Location

`packages/core/scripts/generate-krd-fixtures.ts`

### How It Works

1. **Reads FIT files** from `src/tests/fixtures/fit-files/`
2. **Converts to KRD** using `createGarminFitSdkReader`
3. **Writes JSON files** to `src/tests/fixtures/krd-files/`
4. **Pretty-prints JSON** with 2-space indentation

### Dependencies

- `@kaiord/core` - Core library with FIT reader
- `@garmin/fitsdk` - Garmin FIT SDK (via adapter)
- `zod` - Schema validation

## Validation Tests

The generated KRD files are automatically validated by `krd-fixtures.test.ts`:

### Test Coverage

- ✅ Valid JSON syntax
- ✅ KRD schema compliance (Zod validation)
- ✅ Required top-level fields (version, type, metadata)
- ✅ Valid metadata structure (created timestamp, sport)

### Test Results

```
✓ KRD Fixtures (17 tests)
  ✓ should have at least one KRD fixture
  ✓ WorkoutCustomTargetValues.krd (4 tests)
  ✓ WorkoutIndividualSteps.krd (4 tests)
  ✓ WorkoutRepeatGreaterThanStep.krd (4 tests)
  ✓ WorkoutRepeatSteps.krd (4 tests)
```

## Use Cases

### 1. Golden Tests

Use KRD files as expected outputs for conversion tests:

```typescript
import { readFileSync } from "fs";
import { krdSchema } from "../domain/schemas/krd";

const expectedKrd = JSON.parse(
  readFileSync(
    "src/tests/fixtures/krd-files/WorkoutIndividualSteps.krd",
    "utf-8"
  )
);

expect(actualKrd).toStrictEqual(expectedKrd);
```

### 2. Round-Trip Tests

Test KRD → FIT → KRD conversions:

```typescript
const originalKrd = JSON.parse(
  readFileSync("src/tests/fixtures/krd-files/WorkoutRepeatSteps.krd", "utf-8")
);

const fitBuffer = await fitWriter(originalKrd);
const roundTripKrd = await fitReader(fitBuffer);

expect(roundTripKrd).toStrictEqual(originalKrd);
```

### 3. Schema Validation

Validate that generated KRD files comply with the schema:

```typescript
import { krdSchema } from "../domain/schemas/krd";

const krd = JSON.parse(readFileSync("WorkoutCustomTargetValues.krd", "utf-8"));
const result = krdSchema.safeParse(krd);

expect(result.success).toBe(true);
```

### 4. Documentation Examples

Use KRD files as real-world examples in documentation:

```markdown
## Example: Workout with Repetition Blocks

\`\`\`json
{
"version": "1.0",
"type": "workout",
"metadata": { ... },
"extensions": {
"workout": {
"steps": [
{ "stepIndex": 0, ... },
{
"repeatCount": 3,
"steps": [ ... ]
}
]
}
}
}
\`\`\`
```

## Maintenance

### When to Regenerate

Regenerate KRD fixtures when:

- ✅ FIT test files are added or updated
- ✅ FIT → KRD conversion logic changes
- ✅ KRD schema is updated
- ✅ New FIT message types are supported

### Verification Checklist

After regeneration:

1. ✅ Run validation tests: `pnpm vitest --run krd-fixtures`
2. ✅ Run all tests: `pnpm test`
3. ✅ Check git diff for unexpected changes
4. ✅ Verify JSON formatting (2-space indentation)
5. ✅ Commit both FIT and KRD files together

## Benefits

### 1. Consistency

- Single source of truth (FIT files)
- Automated generation prevents manual errors
- Always in sync with conversion logic

### 2. Testability

- Comprehensive validation tests
- Easy to add new test cases
- Clear test failure messages

### 3. Documentation

- Real-world examples
- Human-readable JSON format
- Self-documenting structure

### 4. Development Workflow

- Fast iteration on conversion logic
- Immediate feedback on schema changes
- Easy to spot regressions

## Architecture Compliance

This script follows Kaiord's architectural principles:

- ✅ **Hexagonal Architecture** - Uses ports/adapters pattern
- ✅ **Dependency Injection** - Logger injected into FIT reader
- ✅ **Schema-First** - Validates against Zod schemas
- ✅ **Round-Trip Safety** - Ensures lossless conversions
- ✅ **Testing Standards** - Comprehensive validation tests

## References

- [KRD Format Specification](../../../docs/krd-format.md)
- [Testing Guidelines](../../../docs/testing.md)
- [Architecture Patterns](../../../docs/architecture.md)
