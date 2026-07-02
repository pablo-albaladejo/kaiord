import { describe, expect, it, vi } from "vitest";

import type { PersistencePort } from "../../ports/persistence-port";
import type { WorkoutRecord } from "../../types/calendar-record";

vi.mock("../../utils/export-workout-formats", () => ({
  exportGcnWorkout: vi.fn().mockResolvedValue({ gcn: "payload" }),
}));

import { doPushToGarmin } from "./do-push-to-garmin";

const makeRecord = (overrides: Partial<WorkoutRecord> = {}): WorkoutRecord =>
  ({
    id: "workout-1",
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
});
