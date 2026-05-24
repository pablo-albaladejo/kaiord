/**
 * Co-located test for `useHealthHrvHistoryLive`. Verifies the hook
 * resolves to the records persisted in the requested date range.
 */
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { db } from "../../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../adapters/dexie/dexie-persistence-adapter";
import type { HealthHrvRecord } from "../../types/health/health-records";
import { useHealthHrvHistoryLive } from "./use-health-hrv-history-live";

const PROFILE_ID = "p-1";
const RANGE = { start: "2026-05-01", end: "2026-05-31" };
const SAMPLE_RMSSD = 45;

const makeRecord = (id: string, date: string): HealthHrvRecord => ({
  id,
  profileId: PROFILE_ID,
  date,
  krd: {
    kind: "hrv",
    version: "2.0",
    measuredAt: `${date}T07:00:00.000Z`,
    rMSSD: SAMPLE_RMSSD,
    measurementWindow: "overnight",
  } as unknown as HealthHrvRecord["krd"],
});

const clear = () => db.table("healthHrv").clear();

describe("useHealthHrvHistoryLive", () => {
  beforeEach(clear);
  afterEach(clear);

  it("should resolve to the persisted records inside the range", async () => {
    // Arrange
    const persistence = createDexiePersistence(db);
    await persistence.healthHrv.put(makeRecord("h-1", "2026-05-15"));

    // Act
    const { result } = renderHook(() =>
      useHealthHrvHistoryLive(PROFILE_ID, RANGE)
    );

    // Assert
    await waitFor(() => {
      expect(result.current).toHaveLength(1);
    });
    expect(result.current?.[0].id).toBe("h-1");
  });
});
