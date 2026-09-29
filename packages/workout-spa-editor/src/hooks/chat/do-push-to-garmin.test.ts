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

import { createFakeGarminCalendar } from "../../test-utils/fake-garmin-calendar";
import { createInMemoryExportLedgerRepository } from "../../test-utils/in-memory-export-ledger-repository";
import { createInMemoryLockManager } from "../../test-utils/in-memory-record-lock";
import { ALL_FEATURES } from "../../test-utils/placement-harness";
import { doPushToGarmin } from "./do-push-to-garmin";

const DATE = "2026-10-05";

const makeDeps = () => {
  const ledgerRepo = createInMemoryExportLedgerRepository();
  const calendar = createFakeGarminCalendar();
  const lockManager = createInMemoryLockManager();
  const deps = {
    ledgerRepo,
    calendar: calendar.port,
    scheduleIdsInFind: true,
    now: () => Date.now(),
    sleep: async () => undefined,
    features: ALL_FEATURES,
    locks: lockManager.port(),
    joins: new Map(),
  };
  return { deps, ledgerRepo, calendar, lockManager };
};

/** Another push of the record holds its fresh pending ledger row. */
const seedPendingRow = (
  ledgerRepo: ReturnType<typeof makeDeps>["ledgerRepo"]
) =>
  ledgerRepo.insertPending({
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    kaiordRecordId: "workout-1",
    dataType: "workout",
    destinationBridgeId: "garmin-bridge",
    destinationExternalId: "pending",
    contentHash: "another-hash",
    exportedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

const makeRecord = (overrides: Partial<WorkoutRecord> = {}): WorkoutRecord =>
  ({
    id: "workout-1",
    profileId: "profile-1",
    state: "ready",
    date: DATE,
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

  it("should push, place the workout and persist the confirmed Garmin-assigned id", async () => {
    // Arrange
    const { deps, calendar } = makeDeps();
    const { persistence, put } = makePersistence(makeRecord());
    const pushWorkout = vi
      .fn()
      .mockResolvedValue({ success: true, garminWorkoutId: "1707805999" });

    // Act
    const result = await doPushToGarmin(
      persistence,
      pushWorkout,
      "workout-1",
      deps
    );

    // Assert
    expect(result).toEqual({
      workoutId: "workout-1",
      garminPushId: "1707805999",
      calendar: "scheduled",
    });
    expect(put).toHaveBeenCalledWith(
      expect.objectContaining({ state: "pushed", garminPushId: "1707805999" })
    );
    expect(calendar.items).toMatchObject([
      { workoutId: "1707805999", date: DATE },
    ]);
  });

  it("should report the library push but no date when the bridge predates calendar writes", async () => {
    // Arrange
    const { deps, calendar } = makeDeps();
    const { persistence, put } = makePersistence(makeRecord());
    const pushWorkout = vi
      .fn()
      .mockResolvedValue({ success: true, garminWorkoutId: "1707805999" });

    // Act
    const result = await doPushToGarmin(persistence, pushWorkout, "workout-1", {
      ...deps,
      features: [],
    });

    // Assert
    expect(result).toEqual({
      workoutId: "workout-1",
      garminPushId: "1707805999",
      calendar: "library-only",
    });
    expect(put).toHaveBeenCalledTimes(1);
    expect(calendar.calls).toEqual([]);
  });

  it("should report push_in_progress with 0 calls when another tab holds the record", async () => {
    // Arrange
    const { deps, lockManager } = makeDeps();
    lockManager.held.add("garmin-place:workout-1");
    const { persistence, put } = makePersistence(makeRecord());
    const pushWorkout = vi.fn();

    // Act
    const result = await doPushToGarmin(
      persistence,
      pushWorkout,
      "workout-1",
      deps
    );

    // Assert
    expect(result).toEqual({ error: "push_in_progress" });
    expect(pushWorkout).not.toHaveBeenCalled();
    expect(put).not.toHaveBeenCalled();
  });

  it("should report push_in_progress and persist nothing when the push lost a race to a pending row", async () => {
    // Arrange
    const { deps, ledgerRepo } = makeDeps();
    await seedPendingRow(ledgerRepo);
    const { persistence, put } = makePersistence(makeRecord());
    const pushWorkout = vi.fn();

    // Act
    const result = await doPushToGarmin(
      persistence,
      pushWorkout,
      "workout-1",
      deps
    );

    // Assert
    expect(result).toEqual({ error: "push_in_progress" });
    expect(pushWorkout).not.toHaveBeenCalled();
    expect(put).not.toHaveBeenCalled();
  });

  it('should never persist "pending" as the push id when the bridge echoes it', async () => {
    // Arrange
    const { deps } = makeDeps();
    const { persistence, put } = makePersistence(makeRecord());
    const pushWorkout = vi
      .fn()
      .mockResolvedValue({ success: true, garminWorkoutId: "pending" });

    // Act
    const result = await doPushToGarmin(
      persistence,
      pushWorkout,
      "workout-1",
      deps
    );

    // Assert
    expect(result).toEqual({
      workoutId: "workout-1",
      garminPushId: null,
      calendar: "failed",
      reason: "library-id-unknown",
    });
    expect(put).not.toHaveBeenCalled();
  });

  it("should report workout_not_found when the record is missing", async () => {
    // Arrange
    const { deps } = makeDeps();
    const { persistence, put } = makePersistence(undefined);
    const pushWorkout = vi.fn();

    // Act
    const result = await doPushToGarmin(
      persistence,
      pushWorkout,
      "missing",
      deps
    );

    // Assert
    expect(result).toEqual({ error: "workout_not_found" });
    expect(pushWorkout).not.toHaveBeenCalled();
    expect(put).not.toHaveBeenCalled();
  });

  it("should report push_failed without persisting when the bridge reports failure", async () => {
    // Arrange
    const { deps } = makeDeps();
    mockPolicies = [ENABLED_GARMIN_POLICY];
    const { persistence, put } = makePersistence(makeRecord());
    const pushWorkout = vi
      .fn()
      .mockResolvedValue({ success: false, garminWorkoutId: null });

    // Act
    const result = await doPushToGarmin(
      persistence,
      pushWorkout,
      "workout-1",
      deps
    );

    // Assert
    expect(result).toEqual({ error: "push_failed" });
    expect(put).not.toHaveBeenCalled();
  });

  it("should persist no push id when the response carries no confirmed id", async () => {
    // Arrange
    const { deps } = makeDeps();
    mockPolicies = [ENABLED_GARMIN_POLICY];
    const { persistence, put } = makePersistence(makeRecord());
    const pushWorkout = vi
      .fn()
      .mockResolvedValue({ success: true, garminWorkoutId: null });

    // Act
    const result = await doPushToGarmin(
      persistence,
      pushWorkout,
      "workout-1",
      deps
    );

    // Assert
    expect(result).toEqual({
      workoutId: "workout-1",
      garminPushId: null,
      calendar: "failed",
      reason: "library-id-unknown",
    });
    expect(put).not.toHaveBeenCalled();
  });

  it("should report no_active_export_route with a clear message and never call pushWorkout when no export route is active", async () => {
    // Arrange
    const { deps } = makeDeps();
    mockPolicies = [];
    const { persistence, put } = makePersistence(makeRecord());
    const pushWorkout = vi.fn();

    // Act
    const result = await doPushToGarmin(
      persistence,
      pushWorkout,
      "workout-1",
      deps
    );

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
    const { deps } = makeDeps();
    mockPolicies = [{ ...ENABLED_GARMIN_POLICY, enabled: false }];
    const { persistence, put } = makePersistence(makeRecord());
    const pushWorkout = vi.fn();

    // Act
    const result = await doPushToGarmin(
      persistence,
      pushWorkout,
      "workout-1",
      deps
    );

    // Assert
    expect(result).toEqual(
      expect.objectContaining({ error: "no_active_export_route" })
    );
    expect(pushWorkout).not.toHaveBeenCalled();
    expect(put).not.toHaveBeenCalled();
  });

  it("should return the failed reason with calendar failed when the placement is interrupted", async () => {
    // Arrange
    const { deps, calendar } = makeDeps();
    calendar.port.schedule = async () => {
      throw new Error("C:\\Users\\athlete\\secret");
    };
    const { persistence } = makePersistence(makeRecord());
    const pushWorkout = vi
      .fn()
      .mockResolvedValue({ success: true, garminWorkoutId: "1707805999" });

    // Act
    const result = await doPushToGarmin(
      persistence,
      pushWorkout,
      "workout-1",
      deps
    );

    // Assert
    expect(result).toEqual({
      workoutId: "workout-1",
      garminPushId: "1707805999",
      calendar: "failed",
      reason: "placement-interrupted",
    });
  });

  it("should return an app-authored code, never the exception text, when the chat path throws", async () => {
    // Arrange
    const { deps } = makeDeps();
    const { persistence } = makePersistence(makeRecord());
    vi.mocked(persistence.workouts.getById).mockRejectedValue(
      new Error("athlete-private-detail")
    );
    const pushWorkout = vi.fn();

    // Act
    const result = await doPushToGarmin(
      persistence,
      pushWorkout,
      "workout-1",
      deps
    );

    // Assert
    expect(result).toEqual({ error: "push_failed" });
    expect(JSON.stringify(result)).not.toContain("athlete-private-detail");
  });
});
