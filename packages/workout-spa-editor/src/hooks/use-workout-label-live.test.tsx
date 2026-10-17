import { createWorkoutKRD } from "@kaiord/core";
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { db } from "../adapters/dexie/dexie-database";
import { createStructuredWorkoutRecord } from "../types/calendar-record";
import { useWorkoutLabelLive } from "./use-workout-label-live";

const ACTIVE = "00000000-0000-4000-8000-0000000000a1";
const OTHER = "00000000-0000-4000-8000-0000000000a2";
const FORTY_FIVE_MIN = 2700;

const record = (profileId: string) =>
  createStructuredWorkoutRecord({
    profileId,
    date: "2026-10-16",
    sport: "running",
    source: "manual",
    tags: [],
    raw: null,
    krd: createWorkoutKRD({
      name: "Easy run with strides",
      sport: "running",
      steps: [
        {
          stepIndex: 0,
          durationType: "time",
          duration: { type: "time", seconds: FORTY_FIVE_MIN },
          targetType: "open",
          target: { type: "open" },
          intensity: "active",
        },
      ],
    }),
  });

const clear = () =>
  Promise.all(["workouts", "meta", "profiles"].map((t) => db.table(t).clear()));

describe("useWorkoutLabelLive", () => {
  beforeEach(async () => {
    await clear();
    await db.table("meta").put({ key: "activeProfileId", value: ACTIVE });
  });
  afterEach(clear);

  it("should name the active athlete's workout with its duration and date", async () => {
    // Arrange
    const workout = record(ACTIVE);
    await db.table("workouts").put(workout);

    // Act
    const { result } = renderHook(() =>
      useWorkoutLabelLive(workout.id, "Session")
    );

    // Assert
    await waitFor(() => {
      expect(result.current).toMatchObject({
        title: "Easy run with strides",
        date: "2026-10-16",
      });
    });
    expect(result.current?.duration).toMatch(/45/);
  });

  it("should report null for a workout of another athlete", async () => {
    // Arrange
    const workout = record(OTHER);
    await db.table("workouts").put(workout);

    // Act
    const { result } = renderHook(() =>
      useWorkoutLabelLive(workout.id, "Session")
    );

    // Assert
    await waitFor(() => expect(result.current).toBeNull());
  });

  it("should report null for an id with no saved workout", async () => {
    // Arrange
    const id = "00000000-0000-4000-8000-0000000000ff";

    // Act
    const { result } = renderHook(() => useWorkoutLabelLive(id, "Session"));

    // Assert
    await waitFor(() => expect(result.current).toBeNull());
  });
});
