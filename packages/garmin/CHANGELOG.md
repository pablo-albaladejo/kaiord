# @kaiord/garmin

## 7.0.0

### Major Changes

- 99271a8: Drop Node.js 20 support. Minimum required runtime is now Node.js 22.12.0.

  Node.js 20 reaches end-of-life on 30 April 2026. Upstream dependencies (cspell v10, jsdom 29.0.2, @eslint/js v10) have already dropped support. Bump your Node.js toolchain to 22.x (Maintenance LTS) or 24.x (Active LTS).

### Patch Changes

- Updated dependencies [99271a8]
  - @kaiord/core@7.0.0

## 5.0.0

### Major Changes

- 22f13a0: BREAKING CHANGE: Remove `workoutToGarmin`, `createWorkoutToGarmin`, and `WorkoutToGarminOptions` exports.

  These convenience functions violated the hexagonal architecture by having an adapter orchestrate core use cases (`toText`, `createWorkoutKRD`). Adapters should only implement port interfaces.

  Migration:

  ```typescript
  // Before
  import { workoutToGarmin } from "@kaiord/garmin";
  const json = await workoutToGarmin(workout);

  // After
  import { createWorkoutKRD, toText } from "@kaiord/core";
  import { garminWriter } from "@kaiord/garmin";
  const krd = createWorkoutKRD(workout);
  const json = await toText(krd, garminWriter);

  // With paceZones
  import { createGarminWriter } from "@kaiord/garmin";
  const writer = createGarminWriter({ paceZones });
  const json = await toText(krd, writer);
  ```

## 4.9.1

### Patch Changes

- aa78a2e: Resolve pace zone references to m/s ranges for Garmin Connect

  Garmin Connect does not support native pace zone numbers. Pace zone targets
  are now resolved to min/max m/s values via a configurable PaceZoneTable,
  passed through createGarminWriter and createWorkoutToGarmin options.

## 4.8.1

### Patch Changes

- 2bb0ffd: Internal: lint fixes, vitest config, and type import cleanup across adapter packages

## 4.7.3

### Patch Changes

- c925282: Fix step description/notes round-trip in Garmin workout conversion pipeline

## 4.5.3

### Patch Changes

- 6cc9ccb: Add comprehensive unit tests for target converters, duration converters, workout converters, and CLI utilities to close coverage gaps

## 4.5.1

### Patch Changes

- 9dfe279: Split large converter files for maintainability
  - Extract `executable-step.converter.ts`, `flatten-segments.converter.ts`, `pool-length.mapper.ts` from garmin-to-krd
  - Extract `garmin-workout-step.converter.ts`, `garmin-repetition.converter.ts`, `garmin-pool-info.mapper.ts` from krd-to-garmin
  - Merge stroke conversion helpers into `stroke.mapper.ts`
  - Extract Zod parse schemas into `garmin-workout-parse.schema.ts`
  - All files now under 100 lines per project conventions

## 4.5.0

### Patch Changes

- 2ab2077: Add Zod runtime validation for Garmin JSON parsing and remove all unsafe type casts in converters and mappers
- Updated dependencies [2ab2077]
  - @kaiord/core@4.5.0

## 4.3.0

### Minor Changes

- 3cea716: feat(mcp): add MCP server package exposing Kaiord tools to AI agents
  - New `@kaiord/mcp` package with 6 tools, 3 resources, and 2 prompts for Claude Desktop/Code integration
  - Upgrade Zod from v3 to v4 across all packages (`z.uuid()`, `z.iso.datetime()`, native `z.toJSONSchema()`)
  - Remove `zod-to-json-schema` dependency in favor of native Zod v4 JSON schema generation

### Patch Changes

- Updated dependencies [3cea716]
  - @kaiord/core@4.3.0

## 4.2.0

### Minor Changes

- 799cbee: Add LLM agent support for structured workouts
  - `createWorkoutKRD(unknown)`: validates unknown input and wraps in KRD envelope
  - `extractWorkout(KRD)`: extracts and validates structured workout from KRD
  - `workoutToGarmin(unknown)`: direct Workout to Garmin Connect JSON conversion
  - `structured-workout-full.json`: self-contained JSON Schema for LLM agents
  - `mapZodErrors`: shared Zod-to-ValidationError mapping utility

### Patch Changes

- Updated dependencies [799cbee]
  - @kaiord/core@4.2.0

## 4.1.3

### Patch Changes

- 74edc44: Update package description to reflect health & fitness data framework branding
- Updated dependencies [74edc44]
  - @kaiord/core@4.1.3

## 4.1.0

### Minor Changes

- 19a12ba: Add Garmin Connect API (GCN) format support with bidirectional KRD conversion, CLI integration, and web editor integration

### Patch Changes

- Updated dependencies [19a12ba]
  - @kaiord/core@4.1.0
