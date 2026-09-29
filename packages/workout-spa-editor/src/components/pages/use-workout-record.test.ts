import "fake-indexeddb/auto";

import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { db } from "../../adapters/dexie/dexie-database";
import type { WorkoutRecord } from "../../types/calendar-record";
import { useWorkoutRecord } from "./use-workout-record";

const ID = "550e8400-e29b-41d4-a716-446655440077";
const PLACEMENT = { kind: "uncertain", workoutId: "9", date: "2026-10-05" };

describe("useWorkoutRecord", () => {
  beforeEach(async () => {
    await db.table("workouts").clear();
    await db.table("exportLedger").clear();
  });

  it("should read the record's Garmin ledger row in the same live query", async () => {
    // Arrange
    await db
      .table("workouts")
      .put({ id: ID, state: "pushed", date: "2026-10-05" } as WorkoutRecord);
    await db.table("exportLedger").put({
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      kaiordRecordId: ID,
      dataType: "workout",
      destinationBridgeId: "garmin-bridge",
      destinationExternalId: "9",
      contentHash: "hash",
      exportedAt: "2026-10-01T08:00:00.000Z",
      updatedAt: "2026-10-01T08:00:00.000Z",
      placement: PLACEMENT,
    });

    // Act
    const { result } = renderHook(() => useWorkoutRecord(ID));

    // Assert
    await waitFor(() =>
      expect(result.current.placementRow?.placement).toEqual(PLACEMENT)
    );
    expect(result.current.record?.id).toBe(ID);
  });
});
