import { createMissingFtpError } from "@kaiord/core";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { profileWith } from "../../lib/athlete/test-profile";
import type { PersistencePort } from "../../ports/persistence-port";
import type { WorkoutRecord } from "../../types/calendar-record";
import type { IntegrationPolicy } from "../../types/integration-policy";
import type { Profile } from "../../types/profile";
import { exportGcnWorkout } from "../../utils/export-workout-formats";

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

// When set, the ledger resolves this outcome without pushing (a race).
let mockLedgerOutcome: Record<string, unknown> | undefined;

vi.mock("../../application/export/record-export.use-case", () => ({
  recordExport: async (
    _deps: unknown,
    input: {
      postFn: (p: unknown) => Promise<Record<string, unknown>>;
      payload: unknown;
    }
  ) => {
    if (mockLedgerOutcome) return mockLedgerOutcome;
    const pushed = await input.postFn(input.payload);
    return { ledgerId: "ledger-1", outcome: "created", ...pushed };
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

const makePersistence = (
  record: WorkoutRecord | undefined,
  profile?: Profile
) => {
  const put = vi.fn();
  const persistence = {
    workouts: { getById: vi.fn().mockResolvedValue(record), put },
    profiles: { getById: vi.fn().mockResolvedValue(profile) },
  } as unknown as PersistencePort;
  return { persistence, put };
};

const FTP_W = 250;
const CYCLING_KRD = {
  metadata: { sport: "cycling" },
  extensions: { structured_workout: { sport: "cycling", steps: [] } },
} as unknown as WorkoutRecord["krd"];

describe("doPushToGarmin", () => {
  beforeEach(() => {
    mockPolicies = [ENABLED_GARMIN_POLICY];
    mockLedgerOutcome = undefined;
  });

  it("should push the workout and persist the confirmed Garmin-assigned id", async () => {
    // Arrange
    const { persistence, put } = makePersistence(makeRecord());
    const pushWorkout = vi
      .fn()
      .mockResolvedValue({ success: true, garminWorkoutId: "1707805999" });

    // Act
    const result = await doPushToGarmin(persistence, pushWorkout, "workout-1");

    // Assert
    expect(result).toEqual({
      workoutId: "workout-1",
      garminPushId: "1707805999",
    });
    expect(put).toHaveBeenCalledWith(
      expect.objectContaining({ state: "pushed", garminPushId: "1707805999" })
    );
  });

  it("should report push_in_progress and persist nothing when the push lost a race to a pending row", async () => {
    // Arrange
    mockLedgerOutcome = { ledgerId: "ledger-1", outcome: "lost-race" };
    const { persistence, put } = makePersistence(makeRecord());
    const pushWorkout = vi.fn();

    // Act
    const result = await doPushToGarmin(persistence, pushWorkout, "workout-1");

    // Assert
    expect(result).toEqual({ error: "push_in_progress" });
    expect(put).not.toHaveBeenCalled();
  });

  it('should never persist "pending" as the push id when the bridge echoes it', async () => {
    // Arrange
    const { persistence, put } = makePersistence(makeRecord());
    const pushWorkout = vi
      .fn()
      .mockResolvedValue({ success: true, garminWorkoutId: "pending" });

    // Act
    const result = await doPushToGarmin(persistence, pushWorkout, "workout-1");

    // Assert
    expect(result).toEqual({ workoutId: "workout-1", garminPushId: null });
    expect(put).not.toHaveBeenCalled();
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

  it("should persist no push id when the response carries no confirmed id", async () => {
    // Arrange
    mockPolicies = [ENABLED_GARMIN_POLICY];
    const { persistence, put } = makePersistence(makeRecord());
    const pushWorkout = vi
      .fn()
      .mockResolvedValue({ success: true, garminWorkoutId: null });

    // Act
    const result = await doPushToGarmin(persistence, pushWorkout, "workout-1");

    // Assert
    expect(result).toEqual({ workoutId: "workout-1", garminPushId: null });
    expect(put).not.toHaveBeenCalled();
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

  it("should export with the workout owner's FTP for its sport", async () => {
    // Arrange
    const profile = profileWith("cycling", { ftp: FTP_W });
    const record = makeRecord({ krd: CYCLING_KRD });
    const { persistence } = makePersistence(record, profile);
    const pushWorkout = vi
      .fn()
      .mockResolvedValue({ success: true, garminWorkoutId: "gw-9" });

    // Act
    await doPushToGarmin(persistence, pushWorkout, "workout-1");

    // Assert
    expect(persistence.profiles.getById).toHaveBeenCalledWith("profile-1");
    expect(exportGcnWorkout).toHaveBeenCalledWith(CYCLING_KRD, FTP_W);
  });

  it("should report missing_ftp and never push when the export needs an FTP", async () => {
    // Arrange
    vi.mocked(exportGcnWorkout).mockRejectedValueOnce(
      createMissingFtpError("garmin")
    );
    const { persistence, put } = makePersistence(makeRecord());
    const pushWorkout = vi.fn();

    // Act
    const result = await doPushToGarmin(persistence, pushWorkout, "workout-1");

    // Assert
    expect(result).toEqual(
      expect.objectContaining({
        error: "missing_ftp",
        message: expect.stringContaining("FTP"),
      })
    );
    expect(pushWorkout).not.toHaveBeenCalled();
    expect(put).not.toHaveBeenCalled();
  });
});
