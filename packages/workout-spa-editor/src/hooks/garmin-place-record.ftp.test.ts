/**
 * The week runner and the chat tool export through `placeRecord`, with the
 * real GCN writer here: a %FTP workout reaches Garmin in watts from its
 * owner's FTP, and without one it stops before any push.
 */
import { describe, expect, it, vi } from "vitest";

import { makeWorkoutRecord } from "../application/test-helpers";
import type { GarminPushOutcome } from "../contexts/garmin-bridge-types";
import { profileWith } from "../lib/athlete/test-profile";
import { createInMemoryPersistence } from "../test-utils/in-memory-persistence";
import { createPlacementHarness } from "../test-utils/placement-harness";
import type { KRD } from "../types/krd";
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
        profileId: PROFILE,
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

const PROFILE = "00000000-0000-0000-0000-000000000000";
const FTP_W = 250;
const SWEET_SPOT_W = 213;

const percentFtpKrd = (sport: string): KRD => ({
  version: "1.0",
  type: "structured_workout",
  metadata: { created: "2026-01-01T00:00:00.000Z", sport },
  extensions: {
    structured_workout: {
      name: "Sweet spot",
      sport,
      steps: [
        {
          stepIndex: 0,
          durationType: "time",
          duration: { type: "time", seconds: 600 },
          targetType: "power",
          target: { type: "power", value: { unit: "percent_ftp", value: 85 } },
        },
      ],
    },
  },
});

type GcnStep = { targetValueOne: number; targetValueTwo: number };
const firstStep = (gcn: unknown): GcnStep =>
  (gcn as { workoutSegments: [{ workoutSteps: [GcnStep] }] }).workoutSegments[0]
    .workoutSteps[0];

const setup = async (sport: string, ftp?: number) => {
  const persistence = createInMemoryPersistence();
  if (ftp) await persistence.profiles.put(profileWith("cycling", { ftp }));
  await persistence.workouts.put(
    makeWorkoutRecord({
      id: "w-1",
      profileId: PROFILE,
      krd: percentFtpKrd(sport),
    })
  );
  const pushWorkout = vi
    .fn<(gcn: unknown) => Promise<GarminPushOutcome>>()
    .mockResolvedValue({ success: true, garminWorkoutId: "1700000" });
  return { persistence, pushWorkout };
};

describe("placeRecordResult with %FTP power targets", () => {
  it("should push the watts from the owner's FTP", async () => {
    // Arrange
    const { persistence, pushWorkout } = await setup("cycling", FTP_W);

    // Act
    await placeRecordResult(
      persistence,
      pushWorkout,
      "w-1",
      createPlacementHarness().deps
    );

    // Assert
    const step = firstStep(pushWorkout.mock.calls[0]?.[0]);
    expect(step.targetValueOne).toBe(SWEET_SPOT_W);
    expect(step.targetValueTwo).toBe(SWEET_SPOT_W);
  });

  it.each([
    { sport: "cycling", reason: "missing-ftp" },
    { sport: "generic", reason: "sport-without-power-zones" },
  ])(
    "should fail $reason and push nothing for a $sport workout without an FTP",
    async ({ sport, reason }) => {
      // Arrange
      const { persistence, pushWorkout } = await setup(sport);

      // Act
      const item = await placeRecordResult(
        persistence,
        pushWorkout,
        "w-1",
        createPlacementHarness().deps
      );

      // Assert
      expect(item.result).toEqual({ kind: "failed", reason, retryable: false });
      expect(pushWorkout).not.toHaveBeenCalled();
    }
  );
});
