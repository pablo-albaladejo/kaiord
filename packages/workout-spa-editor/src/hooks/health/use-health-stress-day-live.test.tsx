/**
 * Co-located test for `useHealthStressDayLive`. Verifies the hook
 * resolves to every stress episode recorded for a single day.
 */
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { db } from "../../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../adapters/dexie/dexie-persistence-adapter";
import type { HealthStressRecord } from "../../types/health/health-records";
import { useHealthStressDayLive } from "./use-health-stress-day-live";

const PROFILE_ID = "p-1";
const DAY = "2026-05-23";
const SAMPLE_AVG_LEVEL = 35;
const SAMPLE_PEAK_LEVEL = 70;

const makeRecord = (id: string, date: string): HealthStressRecord => ({
  id,
  profileId: PROFILE_ID,
  date,
  krd: {
    kind: "stress",
    version: "2.0",
    startTime: `${date}T08:00:00.000Z`,
    endTime: `${date}T10:00:00.000Z`,
    averageLevel: SAMPLE_AVG_LEVEL,
    peakLevel: SAMPLE_PEAK_LEVEL,
  } as unknown as HealthStressRecord["krd"],
});

const clear = () => db.table("healthStress").clear();

describe("useHealthStressDayLive", () => {
  beforeEach(clear);
  afterEach(clear);

  it("should resolve to the episodes recorded for the requested day", async () => {
    // Arrange
    const persistence = createDexiePersistence(db);
    await persistence.healthStress.put(makeRecord("s-1", DAY));

    // Act
    const { result } = renderHook(() =>
      useHealthStressDayLive(PROFILE_ID, DAY)
    );

    // Assert
    await waitFor(() => {
      expect(result.current).toHaveLength(1);
    });
    expect(result.current?.[0].id).toBe("s-1");
  });
});
