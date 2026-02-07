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
