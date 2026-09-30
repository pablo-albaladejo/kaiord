/**
 * A workout with pace ZONE targets through the real GCN export, on the two
 * paths that share `placeRecord`: the bulk "Send week" runner and the chat
 * tool. Its zones resolve from the owning profile as the Athlete page shows
 * them; when they cannot, the run fails with the reason and nothing
 * reaches Garmin.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { makeWorkoutRecord } from "../application/test-helpers";
import { createInMemoryPersistence } from "../test-utils/in-memory-persistence";
import {
  freshProfile,
  MPS_DIGITS,
  paceZoneKrd,
  RUN_THRESHOLD,
  withThreshold,
} from "../test-utils/pace-zone-fixtures";
import { createPlacementHarness, D1 } from "../test-utils/placement-harness";
import type { Profile } from "../types/profile";
import { garminPaceZonesFor } from "../utils/garmin-pace-zones";
import { doPushToGarmin } from "./chat/do-push-to-garmin";
import { placeRecordResult } from "./garmin-place-record";

const GARMIN_POLICY = {
  id: "00000000-0000-0000-0000-000000000001",
  dataType: "workout",
  bridgeId: "garmin-bridge",
  direction: "export",
  mode: "manual",
  enabled: true,
  updatedAt: "2026-05-01T00:00:00.000Z",
};
const policies = vi.hoisted(() => ({ list: [] as unknown[] }));

vi.mock("../adapters/dexie/dexie-database", () => ({ db: {} }));
vi.mock("../adapters/dexie/dexie-integration-policy-repository", () => ({
  createDexieIntegrationPolicyRepository: () => ({}),
}));
vi.mock(
  "../application/integration-policy/resolve-export-policies.use-case",
  () => ({ resolveExportPolicies: async () => policies.list })
);

const WORKOUT_ID = "w-pace";
const GARMIN_ID = "1707805999";

type GcnStep = {
  targetType?: { workoutTargetTypeKey: string };
  targetValueOne?: number;
  targetValueTwo?: number;
};

const setup = async (profile: Profile) => {
  policies.list = [{ ...GARMIN_POLICY, profileId: profile.id }];
  const persistence = createInMemoryPersistence();
  await persistence.profiles.put(profile);
  await persistence.workouts.put(
    makeWorkoutRecord({
      id: WORKOUT_ID,
      profileId: profile.id,
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
  it("should push the zones of a fresh profile's threshold pace as m/s ranges", async () => {
    // Arrange
    const profile = await withThreshold(
      freshProfile(),
      "running",
      RUN_THRESHOLD
    );
    const [z1] = garminPaceZonesFor(paceZoneKrd(), profile) ?? [];
    const { persistence, deps, pushWorkout } = await setup(profile);

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
    expect(warmUp.targetValueOne).toBeCloseTo(z1!.maxMps, MPS_DIGITS);
    expect(warmUp.targetValueTwo).toBeCloseTo(z1!.minMps, MPS_DIGITS);
  });

  it("should fail with missing-pace-zones, and push nothing, when the profile has no pace zones", async () => {
    // Arrange
    const { persistence, deps, pushWorkout, analytics } =
      await setup(freshProfile());

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
    const { persistence, deps, pushWorkout } = await setup(freshProfile());

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
