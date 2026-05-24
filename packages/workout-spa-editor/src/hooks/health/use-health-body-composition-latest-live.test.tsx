/**
 * Co-located test for `useHealthBodyCompositionLatestLive`. Verifies
 * the hook resolves to the most-recent record by `date` (sorted
 * descending).
 */
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { db } from "../../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../adapters/dexie/dexie-persistence-adapter";
import type { HealthBodyCompositionRecord } from "../../types/health/health-records";
import { useHealthBodyCompositionLatestLive } from "./use-health-body-composition-latest-live";

const PROFILE_ID = "p-1";
const SAMPLE_BODY_FAT_PERCENT = 18;

const makeRecord = (id: string, date: string): HealthBodyCompositionRecord => ({
  id,
  profileId: PROFILE_ID,
  date,
  krd: {
    kind: "bodyComposition",
    version: "2.0",
    measuredAt: `${date}T08:00:00.000Z`,
    bodyFatPercent: SAMPLE_BODY_FAT_PERCENT,
  } as unknown as HealthBodyCompositionRecord["krd"],
});

const clear = () => db.table("healthBodyComposition").clear();

describe("useHealthBodyCompositionLatestLive", () => {
  beforeEach(clear);
  afterEach(clear);

  it("should resolve to the most recent record by date", async () => {
    // Arrange
    const persistence = createDexiePersistence(db);
    await persistence.healthBodyComposition.put(
      makeRecord("bc-older", "2026-05-01")
    );
    await persistence.healthBodyComposition.put(
      makeRecord("bc-latest", "2026-05-22")
    );

    // Act
    const { result } = renderHook(() =>
      useHealthBodyCompositionLatestLive(PROFILE_ID)
    );

    // Assert
    await waitFor(() => {
      expect(result.current).toBeDefined();
    });
    expect(result.current?.id).toBe("bc-latest");
  });
});
