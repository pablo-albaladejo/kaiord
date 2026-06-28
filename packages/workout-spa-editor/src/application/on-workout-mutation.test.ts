import { describe, expect, it } from "vitest";

import type { WorkoutRecord } from "../types/calendar-record";
import { onWorkoutMutation } from "./workout-transitions";

function makeRecord(overrides: Partial<WorkoutRecord> = {}): WorkoutRecord {
  return {
    id: "550e8400-e29b-41d4-a716-446655440000",
    date: "2026-04-20",
    sport: "running",
    source: "train2go",
    sourceId: "ext-1",
    planId: null,
    state: "structured",
    raw: null,
    krd: {
      version: "1.0",
      type: "structured_workout",
      metadata: { created: "2026-04-20T08:00:00Z", sport: "running" },
    },
    lastProcessingError: null,
    feedback: null,
    aiMeta: null,
    garminPushId: null,
    tags: [],
    previousState: null,
    createdAt: "2026-04-20T08:00:00Z",
    modifiedAt: null,
    updatedAt: "2026-04-20T08:00:00Z",
    ...overrides,
  };
}

describe("onWorkoutMutation", () => {
  it("should advance modifiedAt and updatedAt when no timestamp is given", () => {
    // Arrange
    const record = makeRecord({ modifiedAt: null });

    // Act
    const result = onWorkoutMutation(record);

    // Assert
    expect(result.modifiedAt).not.toBeNull();
    expect(result.updatedAt).not.toBe(record.updatedAt);
  });

  it("should use the supplied batch timestamp so two calls in one batch share it", () => {
    // Arrange
    const record = makeRecord({ modifiedAt: null });
    const stamp = "2026-04-20T09:00:00.000Z";
    const first = onWorkoutMutation(record, { timestamp: stamp });

    // Act
    const second = onWorkoutMutation(first, { timestamp: stamp });

    // Assert
    expect(first.modifiedAt).toBe(stamp);
    expect(second.modifiedAt).toBe(stamp);
    expect(first.updatedAt).toBe(stamp);
  });

  it("should pass through an optional nextState when a transition applies", () => {
    // Arrange
    const record = makeRecord({
      state: "pushed",
      garminPushId: "garmin-1",
      krd: {
        version: "1.0",
        type: "structured_workout",
        metadata: { created: "2026-04-20T08:00:00Z", sport: "running" },
      },
    });

    // Act
    const result = onWorkoutMutation(record, { nextState: "modified" });

    // Assert
    expect(result.state).toBe("modified");
    expect(result.modifiedAt).not.toBeNull();
  });

  it("should be a pure function — does not mutate the input", () => {
    // Arrange
    const record = makeRecord({ modifiedAt: null });
    const snapshot = JSON.stringify(record);

    // Act
    onWorkoutMutation(record);

    // Assert
    expect(JSON.stringify(record)).toBe(snapshot);
  });

  it("should carry a replacement KRD when provided (edit-step / reorder / paste)", () => {
    // Arrange
    const record = makeRecord();
    const nextKrd = {
      version: "1.0" as const,
      type: "structured_workout" as const,
      metadata: { created: "2026-04-20T08:00:00Z", sport: "cycling" as const },
    };

    // Act
    const result = onWorkoutMutation(record, { krd: nextKrd });

    // Assert
    expect(result.krd).toBe(nextKrd);
    expect(result.modifiedAt).not.toBeNull();
  });

  it.each([
    { state: "structured" as WorkoutRecord["state"] },
    { state: "ready" as WorkoutRecord["state"] },
  ])(
    "should advance modifiedAt for $state edits without changing state",
    ({ state }) => {
      // Arrange
      const record = makeRecord({ state, modifiedAt: null });

      // Act
      const result = onWorkoutMutation(record);

      // Assert
      expect(result.state).toBe(state);
      expect(result.modifiedAt).not.toBeNull();
    }
  );
});
