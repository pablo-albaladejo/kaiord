/**
 * Co-located test for `useHealthSleepWeekLive`.
 *
 * Canonical health-hook coverage: loading state, empty range, and
 * re-fire on a write through PersistencePort.healthSleep.
 */
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { db } from "../../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../adapters/dexie/dexie-persistence-adapter";
import type { HealthSleepRecord } from "../../types/health/health-records";
import { useHealthSleepWeekLive } from "./use-health-sleep-week-live";

const PROFILE_ID = "p-1";
const WEEK = { start: "2026-05-18", end: "2026-05-24" };

const makeRecord = (id: string, date: string): HealthSleepRecord => ({
  id,
  profileId: PROFILE_ID,
  date,
  krd: {
    kind: "sleep",
    version: "2.0",
    startTime: `${date}T22:00:00.000Z`,
    endTime: `${date}T23:00:00.000Z`,
    stages: [],
  } as unknown as HealthSleepRecord["krd"],
});

const clear = () => db.table("healthSleep").clear();

describe("useHealthSleepWeekLive", () => {
  beforeEach(clear);
  afterEach(clear);

  it("should return an empty array when the week has no records", async () => {
    // Arrange
    const { result } = renderHook(() =>
      useHealthSleepWeekLive(PROFILE_ID, WEEK)
    );

    // Act
    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    // Assert
    expect(result.current).toEqual([]);
  });

  it("should resolve to the records persisted inside the week range", async () => {
    // Arrange
    const persistence = createDexiePersistence(db);
    await persistence.healthSleep.put(makeRecord("r-1", "2026-05-20"));

    // Act
    const { result } = renderHook(() =>
      useHealthSleepWeekLive(PROFILE_ID, WEEK)
    );

    // Assert
    await waitFor(() => {
      expect(result.current).toHaveLength(1);
    });
    expect(result.current?.[0].id).toBe("r-1");
  });

  it("should re-fire when a record is added through PersistencePort", async () => {
    // Arrange
    const persistence = createDexiePersistence(db);
    const { result } = renderHook(() =>
      useHealthSleepWeekLive(PROFILE_ID, WEEK)
    );
    await waitFor(() => {
      expect(result.current).toEqual([]);
    });

    // Act
    await persistence.healthSleep.put(makeRecord("r-2", "2026-05-22"));

    // Assert
    await waitFor(() => {
      expect(result.current).toHaveLength(1);
    });
  });
});
