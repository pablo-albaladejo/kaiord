import "fake-indexeddb/auto";

import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { db } from "../../../adapters/dexie/dexie-database";
import type { WorkoutRecord } from "../../../types/calendar-record";
import { useWorkoutDetailRecord } from "./use-workout-detail-record";

const ID = "550e8400-e29b-41d4-a716-446655440078";

describe("useWorkoutDetailRecord", () => {
  beforeEach(async () => {
    await db.table("workouts").clear();
  });

  it("should report an unknown id as not found instead of loading", async () => {
    // Arrange
    const unknown = "550e8400-e29b-41d4-a716-446655440098";

    // Act
    const { result } = renderHook(() => useWorkoutDetailRecord(unknown));

    // Assert
    await waitFor(() => expect(result.current.notFound).toBe(true));
    expect(result.current.loading).toBe(false);
  });

  it("should load an existing record without reporting it missing", async () => {
    // Arrange
    await db
      .table("workouts")
      .put({ id: ID, state: "ready", date: "2026-10-05" } as WorkoutRecord);

    // Act
    const { result } = renderHook(() => useWorkoutDetailRecord(ID));

    // Assert
    await waitFor(() => expect(result.current.record?.id).toBe(ID));
    expect(result.current.notFound).toBe(false);
  });
});
