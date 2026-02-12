# @kaiord/core

## 4.2.1

### Patch Changes

- 529c891: perf(core): reduce published dist from 1.8M to 268K
  - Split tsup config to disable sourcemaps for test-utils entry
  - Externalize devDependencies (@faker-js/faker, rosie) from test-utils build

## 4.2.0

### Minor Changes

- 799cbee: Add LLM agent support for structured workouts
  - `createWorkoutKRD(unknown)`: validates unknown input and wraps in KRD envelope
  - `extractWorkout(KRD)`: extracts and validates structured workout from KRD
  - `workoutToGarmin(unknown)`: direct Workout to Garmin Connect JSON conversion
  - `structured-workout-full.json`: self-contained JSON Schema for LLM agents
  - `mapZodErrors`: shared Zod-to-ValidationError mapping utility

## 4.1.3

### Patch Changes

- 74edc44: Update package description to reflect health & fitness data framework branding

## 4.1.2

### Patch Changes

- 9a79fd7: test: verify complete release workflow with ESM fix

## 4.1.1

### Patch Changes

- 0992e52: test: verify npm Trusted Publishing works with OIDC

## 4.1.0

### Minor Changes

- 19a12ba: Add Garmin Connect API (GCN) format support with bidirectional KRD conversion, CLI integration, and web editor integration

## 4.0.0

### Major Changes

- d3fa555: BREAKING: Rename KRD types for explicit separation (workout -> structured_workout, activity -> recorded_activity)

  This is a breaking change to the KRD format schema:
  - **Type field values changed**: `"workout"` -> `"structured_workout"`, `"activity"` -> `"recorded_activity"`
  - **Extension key renamed**: `extensions.workout` -> `extensions.structured_workout`
  - **Metadata field removed**: `metadata.fileType` removed (redundant with root `type`)
  - **Event types prefixed**: All event types now use `event_` prefix (e.g., `"start"` -> `"event_start"`, `"workout_step"` -> `"event_workout_step_change"`)
  - **Activity data relocated**: Recorded activity data (sessions, laps, records, events) moved from `extensions.recorded_activity` to top-level KRD fields

  Old KRD files will need to be re-exported. No backward compatibility migration is provided.

## 3.0.0

### Major Changes

- 9cfdf44: Extract format adapters from @kaiord/core into separate packages for modular installation.

  Breaking changes:
  - `createDefaultProviders()` now accepts an optional `AdapterProviders` parameter
  - Provider properties for adapters are now optional (undefined when adapter not installed)
  - Format adapter code moved from `@kaiord/core` to `@kaiord/fit`, `@kaiord/tcx`, `@kaiord/zwo`

  New packages:
  - `@kaiord/fit` - FIT format adapter with Garmin FIT SDK
  - `@kaiord/tcx` - TCX format adapter with fast-xml-parser
  - `@kaiord/zwo` - ZWO format adapter with fast-xml-parser and XSD validation
  - `@kaiord/all` - Meta-package for backward compatibility (includes all adapters)

  Migration: Replace `@kaiord/core` with `@kaiord/all` for identical behavior, or install adapters selectively for smaller bundles.

### Patch Changes

- 9cfdf44: Consolidate test fixtures to shared monorepo location
  - Moved all test fixtures to `/test-fixtures/` directory
  - Updated fixture loaders in @kaiord/core/test-utils
  - Removed fixture duplication across adapter packages
  - Fixed @kaiord/core to not publish fixtures to npm
  - Reduced package sizes by ~120KB

## 2.0.1

### Patch Changes

- 0a756dd: feat: add Node.js 24 Active LTS support

  Add comprehensive Node.js 24.x (Active LTS) support to all packages and CI workflows while maintaining backward compatibility with Node.js 20.x and 22.x.

  **Changes:**
  - Add Node.js 24.x to CI test matrices (lint, test, test-frontend)
  - Upgrade @types/node from ^20.11.0 to ^24.0.0 across all packages
  - Update deployment workflows to use Node.js 24.x (release, deploy-spa-editor, security)
  - Update documentation to recommend Node.js 24.x as the preferred version
  - Maintain Node.js >=20.0.0 engine requirement for backward compatibility

  **Breaking Changes:** None

## 2.0.0

### Major Changes

- dcc0cac: Extract format adapters from @kaiord/core into separate packages for modular installation.

  Breaking changes:
  - `createDefaultProviders()` now accepts an optional `AdapterProviders` parameter
  - Provider properties for adapters are now optional (undefined when adapter not installed)
  - Format adapter code moved from `@kaiord/core` to `@kaiord/fit`, `@kaiord/tcx`, `@kaiord/zwo`

  New packages:
  - `@kaiord/fit` - FIT format adapter with Garmin FIT SDK
  - `@kaiord/tcx` - TCX format adapter with fast-xml-parser
  - `@kaiord/zwo` - ZWO format adapter with fast-xml-parser and XSD validation
  - `@kaiord/all` - Meta-package for backward compatibility (includes all adapters)

  Migration: Replace `@kaiord/core` with `@kaiord/all` for identical behavior, or install adapters selectively for smaller bundles.

## 1.4.0

### Minor Changes

- 24d25dc: Add Claude Code plugins for enhanced development workflow

  Install 5 official Anthropic plugins:
  - commit-commands: Git workflow automation with auto-generated commit messages
  - security-guidance: Security vulnerability detection (9 patterns monitored)
  - explanatory-output-style: Educational insights about implementation choices
  - pr-review-toolkit: 6 specialized code review agents
  - frontend-design: Distinctive UI/UX design guidance for React components

  Include comprehensive documentation:
  - Complete plugin reference guide (PLUGINS.md)
  - Quick reference with commands and workflows (PLUGINS-QUICK-REFERENCE.md)
  - Installation summary and verification steps (PLUGINS-INSTALLATION-SUMMARY.md)
  - Real-world workflow example from start to finish (PLUGINS-COMPLETE-WORKFLOW-EXAMPLE.md)

  These plugins complement existing Kaiord custom agents and streamline development by 40%.

## 1.3.0

### Minor Changes

- 001748c: Add support for FIT ACTIVITY and COURSE file types

  Implement Phase 2.2 to support FIT ACTIVITY (ID 4) and COURSE (ID 6) file types in addition to WORKOUT (ID 5). This enables:
  - Reading/writing recorded activities with GPS and sensor data
  - Reading/writing route/course files for navigation
  - File type detection and routing for bidirectional conversion
  - Extended KRD metadata schema with fileType field

  **Breaking changes**: None - backward compatible with existing workout files

  **New features**:
  - FIT file type enum with 18 standard file types
  - Activity message validation and creation
  - Course schemas and coordinate conversion utilities
  - Automatic file type detection from FIT messages

## 1.2.0

### Minor Changes

- ccd4793: feat(core): implement FIT LAP message support (Phase 2.1)
  - Added bidirectional FIT LAP message conversion (FIT ↔ KRD)
  - Extended KRD lap schema with new fields: totalTimerTime, maxCadence, maxPower, normalizedPower, avgSpeed, maxSpeed, totalAscent, totalDescent, totalCalories, trigger, sport, subSport, workoutStepIndex, numLengths, swimStroke
  - Added lap trigger mapping (manual, time, distance, position, session_end, fitness_equipment)
  - Integrated lap extraction in activity.mapper.ts
  - Added round-trip tests with tolerances (±1s time, ±1W power, ±1bpm HR)

## 1.1.0

### Minor Changes

- 4eae83b: feat(fit): implement Phase 1 FIT message support
  - Add SESSION message (ID 18) converters for activity file support
  - Add RECORD message (ID 20) converters with coordinate conversion (semicircles ↔ degrees)
  - Add EVENT message (ID 21) converters with FIT ↔ KRD event type mapping
  - Fix stroke_type target conversion (KRD → FIT) for swimming workouts
  - Add coordinate converter utility for reusable geo coordinate transformations
  - Extend KRD domain schemas with additional activity fields:
    - Session: maxCadence, maxPower, normalizedPower, trainingStressScore, etc.
    - Record: temperature, verticalOscillation, stanceTime, stepLength
    - Event: workout_step, session, activity event types
  - Refactor messages.mapper.ts to detect and route workout vs activity files

  This enables full activity file (SESSION, RECORD, EVENT) conversion support.

## 1.0.3

### Patch Changes

- Automated release from commit 791d3b25d9be021e29fa74048b19baf4f9388a13
- 791d3b2: Improve code quality and developer experience in @kaiord/core:
  - Add proper Zod validation for workout data extraction in FIT converter (replaces unsafe type assertions)
  - Make messages validator stricter: throws by default on missing critical FIT messages (configurable via options)
  - Add truncation behavior option for notes field (configurable via notesTruncation parameter)
  - Document cadence SPM/RPM conversion rationale in TCX and Zwift converters
  - Remove unused isWorkoutStep type guard
  - Add warning when manufacturer falls back to default value
  - Add comprehensive edge case tests for duration converters (negative values, large numbers, NaN, Infinity)
  - Add tests for messages validator strict mode

## 1.0.2

### Patch Changes

- Automated release from commit 1dcb02097af637da6b253d0238fb46f872f5f801

## 1.0.1

### Patch Changes

- Automated release from commit b9d70b4232c66c73581f860f0714d51763cc8aca

## 0.1.3

### Patch Changes

- Automated release from commit d18d6fdd24b9ab5907f3f724fce46e6576145a8f

## 0.1.2

### Patch Changes

- Automated release from commit 158576ea7ddd7ed09b26ad9d66eca0ebb629827c

## 0.1.1

### Patch Changes

- Test changeset for release workflow validation

  This changeset is created to test the release workflow components:
  - Changesets PR creation
  - Version bumping
  - Changelog generation
  - GitHub release creation
  - npm publishing (dry-run)
