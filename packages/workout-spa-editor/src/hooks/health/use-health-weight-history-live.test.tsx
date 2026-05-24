/**
 * Co-located test for `useHealthWeightHistoryLive`. Verifies the hook
 * resolves to the records persisted in the requested date range.
 */
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { db } from "../../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../adapters/dexie/dexie-persistence-adapter";
import type { HealthWeightRecord } from "../../types/health/health-records";
import { useHealthWeightHistoryLive } from "./use-health-weight-history-live";

const PROFILE_ID = "p-1";
const RANGE = { start: "2026-05-01", end: "2026-05-31" };
const SAMPLE_WEIGHT_KG = 75.5;

const makeRecord = (id: string, date: string): HealthWeightRecord => ({
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

const clear = () => db.table("healthWeight").clear();

describe("useHealthWeightHistoryLive", () => {
  beforeEach(clear);
  afterEach(clear);

  it("should resolve to the persisted records inside the range", async () => {
    // Arrange
    const persistence = createDexiePersistence(db);
    await persistence.healthWeight.put(makeRecord("w-1", "2026-05-15"));

    // Act
    const { result } = renderHook(() =>
      useHealthWeightHistoryLive(PROFILE_ID, RANGE)
    );

    // Assert
    await waitFor(() => {
      expect(result.current).toHaveLength(1);
    });
    expect(result.current?.[0].id).toBe("w-1");
  });
});
