import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PersistencePort } from "../../ports/persistence-port";
import type { WorkoutRecord } from "../../types/calendar-record";
import type { IntegrationPolicy } from "../../types/integration-policy";

vi.mock("../../utils/export-workout-formats", () => ({
  exportGcnWorkout: vi.fn().mockResolvedValue({ gcn: "payload" }),
}));

vi.mock("../../adapters/dexie/dexie-database", () => ({ db: {} }));
vi.mock("../../adapters/dexie/dexie-integration-policy-repository", () => ({
  createDexieIntegrationPolicyRepository: () => ({}),
}));
vi.mock("../../adapters/dexie/dexie-export-ledger-repository", () => ({
  createDexieExportLedgerRepository: () => ({}),
}));

const ENABLED_GARMIN_POLICY: IntegrationPolicy = {
  id: "00000000-0000-0000-0000-000000000001",
  profileId: "profile-1",
  dataType: "workout",
  bridgeId: "garmin-bridge",
  direction: "export",
  mode: "manual",
  enabled: true,
  updatedAt: "2026-05-01T00:00:00.000Z",
};

// Governs the destination policy the executeWorkoutPush gate sees.
let mockPolicies: IntegrationPolicy[] = [ENABLED_GARMIN_POLICY];

vi.mock(
  "../../application/integration-policy/resolve-export-policies.use-case",
  () => ({
    resolveExportPolicies: async () => mockPolicies,
  })
);

vi.mock("../../application/export/record-export.use-case", () => ({
  recordExport: async (
    _deps: unknown,
    input: {
      postFn: (p: unknown) => Promise<{ externalId: string }>;
      payload: unknown;
    }
  ) => {
    const { externalId } = await input.postFn(input.payload);
    return { ledgerId: "ledger-1", outcome: "created", externalId };
  },
}));

import { doPushToGarmin } from "./do-push-to-garmin";

const makeRecord = (overrides: Partial<WorkoutRecord> = {}): WorkoutRecord =>
  ({
    id: "workout-1",
    profileId: "profile-1",
    state: "ready",
    krd: { name: "stub" },
    garminPushId: null,
    modifiedAt: null,
    updatedAt: "2026-05-14T08:00:00.000Z",
    ...overrides,
  }) as unknown as WorkoutRecord;

const makePersistence = (record: WorkoutRecord | undefined) => {
  const put = vi.fn();
  const persistence = {
    workouts: { getById: vi.fn().mockResolvedValue(record), put },
  } as unknown as PersistencePort;
  return { persistence, put };
};

describe("doPushToGarmin", () => {
  beforeEach(() => {
    mockPolicies = [ENABLED_GARMIN_POLICY];
  });

  it("should push the workout and persist the Garmin-assigned id", async () => {
    // Arrange
    const { persistence, put } = makePersistence(makeRecord());
    const pushWorkout = vi
      .fn()
      .mockResolvedValue({ success: true, garminWorkoutId: "gw-9" });

    // Act
    const result = await doPushToGarmin(persistence, pushWorkout, "workout-1");

    // Assert
    expect(result).toEqual({ workoutId: "workout-1", garminPushId: "gw-9" });
    expect(put).toHaveBeenCalledWith(
      expect.objectContaining({ state: "pushed", garminPushId: "gw-9" })
    );
  });

  it("should report workout_not_found when the record is missing", async () => {
    // Arrange
    const { persistence, put } = makePersistence(undefined);
    const pushWorkout = vi.fn();

    // Act
    const result = await doPushToGarmin(persistence, pushWorkout, "missing");

    // Assert
    expect(result).toEqual({ error: "workout_not_found" });
    expect(pushWorkout).not.toHaveBeenCalled();
    expect(put).not.toHaveBeenCalled();
  });

  it("should report push_failed without persisting when the bridge reports failure", async () => {
    // Arrange
    mockPolicies = [ENABLED_GARMIN_POLICY];
    const { persistence, put } = makePersistence(makeRecord());
    const pushWorkout = vi
      .fn()
      .mockResolvedValue({ success: false, garminWorkoutId: null });

    // Act
    const result = await doPushToGarmin(persistence, pushWorkout, "workout-1");

    // Assert
    expect(result).toEqual({ error: "push_failed" });
    expect(put).not.toHaveBeenCalled();
  });

  it("should persist a locally-generated id when the response carries none", async () => {
    // Arrange
    mockPolicies = [ENABLED_GARMIN_POLICY];
    const { persistence, put } = makePersistence(makeRecord());
    const pushWorkout = vi
      .fn()
      .mockResolvedValue({ success: true, garminWorkoutId: null });

    // Act
    await doPushToGarmin(persistence, pushWorkout, "workout-1");

    // Assert
    const persisted = put.mock.calls[0]?.[0] as { garminPushId: string };
    expect(persisted.garminPushId).toMatch(/^garmin-\d+$/);
  });

  it("should report no_active_export_route with a clear message and never call pushWorkout when no export route is active", async () => {
    // Arrange
    mockPolicies = [];
    const { persistence, put } = makePersistence(makeRecord());
    const pushWorkout = vi.fn();

    // Act
    const result = await doPushToGarmin(persistence, pushWorkout, "workout-1");

    // Assert
    expect(result).toEqual(
      expect.objectContaining({
        error: "no_active_export_route",
        message: expect.stringContaining("garmin-bridge"),
      })
    );
    expect(pushWorkout).not.toHaveBeenCalled();
    expect(put).not.toHaveBeenCalled();
  });

  it("should report no_active_export_route when the only export policy is disabled", async () => {
    // Arrange
    mockPolicies = [{ ...ENABLED_GARMIN_POLICY, enabled: false }];
    const { persistence, put } = makePersistence(makeRecord());
    const pushWorkout = vi.fn();

    // Act
    const result = await doPushToGarmin(persistence, pushWorkout, "workout-1");

    // Assert
    expect(result).toEqual(
      expect.objectContaining({ error: "no_active_export_route" })
    );
    expect(pushWorkout).not.toHaveBeenCalled();
    expect(put).not.toHaveBeenCalled();
  });
});
