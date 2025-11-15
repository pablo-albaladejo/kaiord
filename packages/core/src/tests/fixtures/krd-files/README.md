# KRD Test Fixtures

This directory contains KRD (Kaiord Representation Definition) files generated from the FIT test fixtures.

## Files

- **WorkoutIndividualSteps.krd** - Basic workout with individual steps (warmup, active intervals, cooldown)
- **WorkoutRepeatSteps.krd** - Workout with repetition blocks
- **WorkoutRepeatGreaterThanStep.krd** - Workout with conditional repeat steps
- **WorkoutCustomTargetValues.krd** - Workout with custom target values (watts, FTP percentages)

## Generation

These files are automatically generated from the corresponding FIT files using:

```bash
pnpm run generate:krd-fixtures
```

The generation script is located at `scripts/generate-krd-fixtures.ts`.

## Usage

These KRD files are used for:

1. **Golden tests** - Verifying KRD schema compliance
2. **Round-trip tests** - Testing KRD → FIT → KRD conversions
3. **Integration tests** - Testing the complete conversion pipeline
4. **Documentation** - Examples of valid KRD format

## Format

All KRD files follow the schema defined in `schema/workout.json` and use:

- **MIME type**: `application/vnd.kaiord+json`
- **Version**: `1.0`
- **Type**: `workout`
- **Units**: Standardized (seconds, meters, watts, bpm, etc.)
- **Naming**: camelCase for all field names

## Regeneration

If the FIT fixtures are updated or the conversion logic changes, regenerate these files:

```bash
cd packages/core
pnpm run generate:krd-fixtures
```

This ensures the KRD fixtures stay in sync with the source FIT files.
