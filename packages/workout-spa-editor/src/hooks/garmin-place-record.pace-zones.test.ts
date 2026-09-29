/**
 * A workout with pace ZONE targets through the real GCN export, on the two
 * paths that share `placeRecord`: the bulk "Send week" runner and the chat
 * tool. Its zones resolve from the owning profile's pace zones; without
 * them, the run fails with `missing-pace-zones` and nothing reaches Garmin.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { makeWorkoutRecord } from "../application/test-helpers";
import { createInMemoryPersistence } from "../test-utils/in-memory-persistence";
import {
  MPS_DIGITS,
  paceProfile,
  paceZoneKrd,
  PROFILE_ID,
  RUNNING_PACE_ZONES,
  RUNNING_Z1_MPS,
} from "../test-utils/pace-zone-fixtures";
import { createPlacementHarness, D1 } from "../test-utils/placement-harness";
import type { Profile } from "../types/profile";
import { doPushToGarmin } from "./chat/do-push-to-garmin";
import { placeRecordResult } from "./garmin-place-record";

vi.mock("../adapters/dexie/dexie-database", () => ({ db: {} }));
vi.mock("../adapters/dexie/dexie-integration-policy-repository", () => ({
  createDexieIntegrationPolicyRepository: () => ({}),
}));
vi.mock(
  "../application/integration-policy/resolve-export-policies.use-case",
  () => ({
    resolveExportPolicies: async () => [
      {
        id: "00000000-0000-0000-0000-000000000001",
        profileId: "11111111-1111-4111-8111-111111111111",
        dataType: "workout",
        bridgeId: "garmin-bridge",
        direction: "export",
        mode: "manual",
        enabled: true,
        updatedAt: "2026-05-01T00:00:00.000Z",
      },
    ],
  })
);

const WORKOUT_ID = "w-pace";
const GARMIN_ID = "1707805999";

type GcnStep = {
  targetType?: { workoutTargetTypeKey: string };
  targetValueOne?: number;
  targetValueTwo?: number;
};

const setup = async (profile: Profile) => {
  const persistence = createInMemoryPersistence();
  await persistence.profiles.put(profile);
  await persistence.workouts.put(
    makeWorkoutRecord({
      id: WORKOUT_ID,
      profileId: PROFILE_ID,
      date: D1,
      state: "ready",
      krd: paceZoneKrd(),
    })
  );
  const analytics = { event: vi.fn(), pageView: vi.fn() };
  const { deps } = createPlacementHarness({ analytics });
  const pushWorkout = vi
    .fn()
    .mockResolvedValue({ success: true, garminWorkoutId: GARMIN_ID });
  return { persistence, deps, pushWorkout, analytics };
};

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-01T08:00:00.000Z"));
});
afterEach(() => vi.useRealTimers());

describe("placeRecordResult with pace zone targets", () => {
  it("should push the pace zones of the profile as m/s ranges", async () => {
    // Arrange
    const { persistence, deps, pushWorkout } = await setup(
      paceProfile(RUNNING_PACE_ZONES)
    );

    // Act
    const item = await placeRecordResult(
      persistence,
      pushWorkout,
      WORKOUT_ID,
      deps
    );

    // Assert
    expect(item.result).toEqual({ kind: "scheduled" });
    const gcn = pushWorkout.mock.calls[0][0] as {
      workoutSegments: Array<{ workoutSteps: GcnStep[] }>;
    };
    const warmUp = gcn.workoutSegments[0].workoutSteps[0];
    expect(warmUp.targetType?.workoutTargetTypeKey).toBe("pace.zone");
    expect(warmUp.targetValueOne).toBeCloseTo(
      RUNNING_Z1_MPS.maxMps,
      MPS_DIGITS
    );
    expect(warmUp.targetValueTwo).toBeCloseTo(
      RUNNING_Z1_MPS.minMps,
      MPS_DIGITS
    );
  });

  it("should fail with missing-pace-zones, and push nothing, when the profile has no pace zones", async () => {
    // Arrange
    const { persistence, deps, pushWorkout, analytics } =
      await setup(paceProfile());

    // Act
    const item = await placeRecordResult(
      persistence,
      pushWorkout,
      WORKOUT_ID,
      deps
    );

    // Assert
    expect(item).toEqual({
      result: {
        kind: "failed",
        reason: "missing-pace-zones",
        retryable: false,
      },
      date: D1,
    });
    expect(pushWorkout).not.toHaveBeenCalled();
    expect(analytics.event).toHaveBeenCalledWith("garmin-calendar-placement", {
      result: "failed",
      reason: "missing-pace-zones",
      durationMs: 0,
      abandonedCount: 0,
    });
  });
});

describe("doPushToGarmin with pace zone targets", () => {
  it("should report missing_pace_zones, not push_failed, when the profile has no pace zones", async () => {
    // Arrange
    const { persistence, deps, pushWorkout } = await setup(paceProfile());

    // Act
    const result = await doPushToGarmin(
      persistence,
      pushWorkout,
      WORKOUT_ID,
      deps
    );

    // Assert
    expect(result).toEqual({
      error: "missing_pace_zones",
      message: expect.stringContaining("threshold pace"),
    });
    expect(pushWorkout).not.toHaveBeenCalled();
  });
});
