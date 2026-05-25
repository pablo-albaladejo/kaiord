import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { db } from "../../../../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../../../adapters/dexie/dexie-persistence-adapter";
import type { HealthWeightRecord } from "../../../../types/health/health-records";
import { useTrendSeries } from "./use-trend-series";

const PROFILE_ID = "p-1";
const RANGE = { start: "2026-05-01", end: "2026-05-31" };
const SAMPLE_WEIGHT_KG = 72;

const weight = (id: string, date: string): HealthWeightRecord => ({
  id,
  profileId: PROFILE_ID,
  date,
  krd: {
    kind: "weight",
    version: "2.0",
    measuredAt: `${date}T08:00:00.000Z`,
    weightKilograms: SAMPLE_WEIGHT_KG,
  } as unknown as HealthWeightRecord["krd"],
});

const clear = () =>
  Promise.all([
    db.table("healthSleep").clear(),
    db.table("healthHrv").clear(),
    db.table("healthWeight").clear(),
    db.table("healthDaily").clear(),
  ]);

describe("useTrendSeries", () => {
  beforeEach(clear);
  afterEach(clear);

  it("should map persisted weight records into a weight series", async () => {
    // Arrange
    const persistence = createDexiePersistence(db);
    await persistence.healthWeight.put(weight("w-1", "2026-05-10"));

    // Act
    const { result } = renderHook(() => useTrendSeries(PROFILE_ID, RANGE));

    // Assert
    await waitFor(() => {
      expect(result.current.weight.points).toHaveLength(1);
    });
    expect(result.current.weight.points[0].y).toBe(SAMPLE_WEIGHT_KG);
  });

  it("should report a metric as empty when it has no records", async () => {
    // Arrange
    const persistence = createDexiePersistence(db);
    await persistence.healthWeight.put(weight("w-1", "2026-05-10"));

    // Act
    const { result } = renderHook(() => useTrendSeries(PROFILE_ID, RANGE));

    // Assert
    await waitFor(() => {
      expect(result.current.steps.loading).toBe(false);
    });
    expect(result.current.steps.points).toEqual([]);
  });
});
