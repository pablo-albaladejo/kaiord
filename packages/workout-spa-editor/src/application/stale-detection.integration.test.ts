/**
 * Stale Detection Integration Tests
 *
 * End-to-end tests for rawHash computation + stale detection.
 */

import { describe, expect, it } from "vitest";

import { computeRawHash } from "../lib/raw-hash";
import type { WorkoutRaw } from "../types/calendar-fragments";
import type { WorkoutRecord } from "../types/calendar-record";
import { detectStale } from "./stale-detection";
import { makeWorkoutRecord } from "./test-helpers";

function makeRaw(overrides?: Partial<WorkoutRaw>): WorkoutRaw {
  return {
    title: "Long Run",
    description: "2K z1 + 3K z3 + 2K z1",
    comments: [
      {
        author: "coach",
        text: "lleva geles",
        timestamp: "2026-04-10T08:00:00Z",
      },
    ],
    distance: { value: 15, unit: "km" },
    duration: null,
    prescribedRpe: 7,
    rawHash: "",
    ...overrides,
  };
}

describe("stale detection integration", () => {
  it("should detect stale when description changes", async () => {
    // Arrange
    const originalRaw = makeRaw();
    originalRaw.rawHash = await computeRawHash(originalRaw);
    const record = makeWorkoutRecord({
      state: "structured",
      raw: originalRaw,
    }) as WorkoutRecord;
    const updatedRaw = makeRaw({ description: "2K z1 + 5K z3 + 2K z1" });

    // Act
    const result = await detectStale(record, updatedRaw);

    // Assert
    expect(result.state).toBe("stale");
    expect(result.previousState).toBe("structured");
  });

  it("should not detect stale when content is identical", async () => {
    // Arrange
    const raw = makeRaw();
    raw.rawHash = await computeRawHash(raw);
    const record = makeWorkoutRecord({
      state: "ready",
      raw,
    }) as WorkoutRecord;
    const sameRaw = makeRaw();

    // Act
    const result = await detectStale(record, sameRaw);

    // Assert
    expect(result.state).toBe("ready");
  });

  it("should update raw in-place for RAW state workouts", async () => {
    // Arrange
    const raw = makeRaw();
    raw.rawHash = await computeRawHash(raw);
    const record = makeWorkoutRecord({
      state: "raw",
      raw,
    }) as WorkoutRecord;
    const updatedRaw = makeRaw({ title: "Updated Long Run" });

    // Act
    const result = await detectStale(record, updatedRaw);

    // Assert
    expect(result.state).toBe("raw");
    expect(result.raw?.title).toBe("Updated Long Run");
  });
});
