import "fake-indexeddb/auto";

import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { db } from "../adapters/dexie/dexie-database";
import {
  structuredKrd,
  THRESHOLD_STEPS,
} from "../test-utils/zone-profile-fixtures";
import type { WorkoutRecord } from "../types/calendar-record";
import { getCurrentWeekId, parseWeekId } from "../utils/week-utils";
import { useWeekDominantZone } from "./use-week-dominant-zone";

const PROFILE_ID = "p1";
const ZONE_4 = 4;

const clear = () => db.table("workouts").clear();

const thisWeekSession = (): WorkoutRecord =>
  ({
    id: "w-1",
    profileId: PROFILE_ID,
    date: parseWeekId(getCurrentWeekId())?.start,
    sport: "cycling",
    krd: structuredKrd(THRESHOLD_STEPS),
  }) as WorkoutRecord;

describe("useWeekDominantZone", () => {
  beforeEach(clear);
  afterEach(clear);

  it("should answer the zone of a session already in the current week", async () => {
    // Arrange
    await db.table<WorkoutRecord>("workouts").put(thisWeekSession());

    // Act
    const { result } = renderHook(() => useWeekDominantZone(PROFILE_ID, null));

    // Assert
    await waitFor(() => expect(result.current).toBe(ZONE_4));
  });

  it("should follow a session added to the current week", async () => {
    // Arrange
    const { result } = renderHook(() => useWeekDominantZone(PROFILE_ID, null));
    await waitFor(() => expect(result.current).toBeNull());

    // Act
    await db.table<WorkoutRecord>("workouts").put(thisWeekSession());

    // Assert
    await waitFor(() => expect(result.current).toBe(ZONE_4));
  });
});
