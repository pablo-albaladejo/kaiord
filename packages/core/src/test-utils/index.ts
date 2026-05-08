/**
 * Test Utilities
 *
 * Shared test utilities for use across packages.
 */

export {
  FIXTURE_NAMES,
  getFixturePath,
  loadFitFixture,
  loadFixturePair,
  loadKrdFixture,
  loadKrdFixtureRaw,
  loadTcxFixture,
  loadZwoFixture,
} from "./fixtures";

// Test helpers
export { createMockLogger } from "../tests/helpers/test-utils";

// KRD fixture builders
export { buildKRD } from "../tests/fixtures/krd/krd.fixtures";
export { buildKRDMetadata } from "../tests/fixtures/krd/metadata.fixtures";
export { buildKRDEvent } from "../tests/fixtures/krd/event.fixtures";
export { buildKRDLap } from "../tests/fixtures/krd/lap.fixtures";
export { buildKRDRecord } from "../tests/fixtures/krd/record.fixtures";
export { buildKRDSession } from "../tests/fixtures/krd/session.fixtures";

// Workout fixture builders
export { buildWorkoutStep } from "../tests/fixtures/workout/workout-step.fixtures";
export { buildWorkout } from "../tests/fixtures/workout/workout.fixtures";
export { buildDuration } from "../tests/fixtures/workout/duration.fixtures";
export { buildTarget } from "../tests/fixtures/workout/target.fixtures";

// Profile snapshot fixtures (parity-tested by both SPA Zod and bridge plain-JS validators)
export type { NegativeSnapshotFixture } from "./profile-snapshot-fixtures";
export {
  baselineSnapshot,
  minimalSnapshot,
  negativeSnapshotFixtures,
  partialZoneSnapshot,
  positiveSnapshotFixtures,
  snapshotFixtures,
} from "./profile-snapshot-fixtures";

// Round-trip tolerance constants (mirror CLAUDE.md tolerances)
export {
  TOLERANCE_CADENCE_RPM,
  TOLERANCE_DISTANCE_M,
  TOLERANCE_HR_BPM,
  TOLERANCE_PACE_SEC_PER_M,
  TOLERANCE_POWER_WATTS,
  TOLERANCE_TIME_SEC,
} from "./tolerance-constants";

// Round-trip test fixtures
export {
  CADENCE_ACTUAL,
  CADENCE_EXPECTED,
  createFitBufferSample,
  DEVIATION_CADENCE_5RPM,
  DEVIATION_DISTANCE_10M,
  DEVIATION_DISTANCE_5M,
  DEVIATION_HR_10BPM,
  DEVIATION_HR_5BPM,
  DEVIATION_PACE,
  DEVIATION_POWER_10W,
  DEVIATION_POWER_5W,
  DEVIATION_TIME_2SEC,
  DEVIATION_TIME_5SEC,
  DISTANCE_ACTUAL_M,
  DISTANCE_EXPECTED_M,
  HR_ACTUAL,
  HR_ACTUAL_HIGH,
  HR_EXPECTED,
  LAP_DISTANCE_ACTUAL_M,
  LAP_DISTANCE_EXPECTED_M,
  LAP_TIME_ACTUAL_SEC,
  LAP_TIME_EXPECTED_SEC,
  POWER_ACTUAL,
  POWER_ACTUAL_HIGH,
  POWER_EXPECTED,
  RECORD_DISTANCE_ACTUAL_M,
  RECORD_DISTANCE_EXPECTED_M,
  RECORD_SPEED_ACTUAL_MPS,
  RECORD_SPEED_EXPECTED_MPS,
  TIME_ACTUAL_SEC,
  TIME_EXPECTED_SEC,
  VIOLATION_COUNT_FULL_SESSION,
  VIOLATION_COUNT_LAP,
  VIOLATION_COUNT_RECORD,
} from "./round-trip-fixtures";
