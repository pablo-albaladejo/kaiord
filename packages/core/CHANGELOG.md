# @kaiord/core

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
