/**
 * AC5 integration: a manual wellness save flows end-to-end through the
 * write use case -> Dexie -> the calendar's reactive read-back hook, so
 * the saved metric surfaces as a day badge. Ties the application write
 * path to `useCalendarWellnessWeekLive` (not just the unit pieces).
 */
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { db } from "../../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../adapters/dexie/dexie-persistence-adapter";
import { saveManualHealthMetric } from "../../application/health/save-manual-health-metric.use-case";
import { useCalendarWellnessWeekLive } from "./use-calendar-wellness-week-live";

const PROFILE_ID = "p-1";
const WEEK_START = "2026-05-18";
const WEEK_END = "2026-05-24";
const DAY = "2026-05-20";

const clear = () =>
  Promise.all([
    db.table("healthSleep").clear(),
    db.table("healthHrv").clear(),
    db.table("healthWeight").clear(),
    db.table("healthDaily").clear(),
  ]);

describe("manual save refreshes the calendar wellness badge", () => {
  beforeEach(clear);
  afterEach(clear);

  it("should surface a manually saved weight as that day's badge", async () => {
    // Arrange
    const persistence = createDexiePersistence(db);

    // Act
    await saveManualHealthMetric(
      { persistence, profileId: PROFILE_ID },
      { metric: "weight", day: DAY, value: 71.5 }
    );
    const { result } = renderHook(() =>
      useCalendarWellnessWeekLive(PROFILE_ID, WEEK_START, WEEK_END)
    );

    // Assert
    await waitFor(() => {
      expect(result.current?.[DAY]).toEqual({ weight: "71.5" });
    });
  });

  it("should surface a manually saved steps count as that day's badge", async () => {
    // Arrange
    const persistence = createDexiePersistence(db);

    // Act
    await saveManualHealthMetric(
      { persistence, profileId: PROFILE_ID },
      { metric: "steps", day: DAY, value: 8000 }
    );
    const { result } = renderHook(() =>
      useCalendarWellnessWeekLive(PROFILE_ID, WEEK_START, WEEK_END)
    );

    // Assert
    await waitFor(() => {
      expect(result.current?.[DAY]).toEqual({ steps: "8000" });
    });
  });
});
