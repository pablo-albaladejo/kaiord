import { describe, expect, it, vi } from "vitest";

import { createInMemoryImportedRecordRepository } from "../../test-utils/in-memory-imported-record-repository";
import type { HealthHeartRateSeriesRecord } from "../../types/health/health-records";
import { syncHeartRateDay } from "./sync-whoop-heart-rate-day";
import type { WhoopFetchResult } from "./whoop-fetch-result";

const PROFILE_ID = "11111111-1111-4111-8111-111111111111";
const USER_ID = 42;
const STEP_SECONDS = 6;
const SAMPLE_BPM = 58;
const SAMPLE_HOUR = 6;
const MS_PER_HOUR = 3_600_000;
const DAY = {
  date: "2026-07-10",
  dayStartISO: "2026-07-10T00:00:00.000Z",
  dayEndISO: "2026-07-11T00:00:00.000Z",
};

const emptyStores = () => ({
  weight: new Map(),
  sleep: new Map(),
  hrv: new Map(),
  "daily-wellness": new Map(),
  "body-composition": new Map(),
  stress: new Map(),
  "heart-rate-series": new Map<string, HealthHeartRateSeriesRecord>(),
});

const makeDeps = (result: WhoopFetchResult) => {
  const stores = emptyStores();
  const fetchMetrics = vi.fn(async (): Promise<WhoopFetchResult> => result);
  return {
    stores,
    fetchMetrics,
    importedRecords: createInMemoryImportedRecordRepository(stores),
  };
};

const RESPONSE_WITH_SAMPLES: WhoopFetchResult = {
  ok: true,
  status: 200,
  data: {
    values: [
      {
        data: SAMPLE_BPM,
        time: Date.parse(DAY.dayStartISO) + SAMPLE_HOUR * MS_PER_HOUR,
      },
    ],
  },
};

describe("syncHeartRateDay", () => {
  it("should import a series and upsert it stamped with the whoop bridge id", async () => {
    // Arrange
    const { importedRecords, fetchMetrics, stores } = makeDeps(
      RESPONSE_WITH_SAMPLES
    );

    // Act
    const outcome = await syncHeartRateDay(
      { importedRecords, fetchMetrics },
      { profileId: PROFILE_ID, userId: USER_ID },
      DAY,
      STEP_SECONDS
    );

    // Assert
    expect(outcome).toEqual({ status: "imported" });
    const row = [...stores["heart-rate-series"].values()][0];
    expect(row?.sourceBridgeId).toBe("whoop-bridge");
    expect(row?.externalId).toBe(`hr:${USER_ID}:${DAY.date}`);
    expect(fetchMetrics).toHaveBeenCalledWith(
      expect.stringContaining("/metrics-service/v1/metrics/user/42")
    );
  });

  it("should skip when the response has no samples for the day", async () => {
    // Arrange
    const { importedRecords, fetchMetrics } = makeDeps({
      ok: true,
      status: 200,
      data: { values: [] },
    });

    // Act
    const outcome = await syncHeartRateDay(
      { importedRecords, fetchMetrics },
      { profileId: PROFILE_ID, userId: USER_ID },
      DAY,
      STEP_SECONDS
    );

    // Assert
    expect(outcome).toEqual({ status: "skipped" });
  });

  it("should skip on re-sync of the same day (dedup)", async () => {
    // Arrange
    const { importedRecords, fetchMetrics } = makeDeps(RESPONSE_WITH_SAMPLES);
    await syncHeartRateDay(
      { importedRecords, fetchMetrics },
      { profileId: PROFILE_ID, userId: USER_ID },
      DAY,
      STEP_SECONDS
    );

    // Act
    const outcome = await syncHeartRateDay(
      { importedRecords, fetchMetrics },
      { profileId: PROFILE_ID, userId: USER_ID },
      DAY,
      STEP_SECONDS
    );

    // Assert
    expect(outcome).toEqual({ status: "skipped" });
  });

  it("should report a transport error when the bridge read throws", async () => {
    // Arrange
    const { importedRecords, fetchMetrics } = makeDeps(RESPONSE_WITH_SAMPLES);
    fetchMetrics.mockRejectedValue(new Error("Extension did not respond"));

    // Act
    const outcome = await syncHeartRateDay(
      { importedRecords, fetchMetrics },
      { profileId: PROFILE_ID, userId: USER_ID },
      DAY,
      STEP_SECONDS
    );

    // Assert
    expect(outcome).toEqual({
      status: "transport-error",
      error: "Extension did not respond",
    });
  });

  it("should report a transport error when the fetch result itself reports failure", async () => {
    // Arrange
    const { importedRecords, fetchMetrics } = makeDeps({
      ok: false,
      status: 401,
      error: "Unauthorized",
    });

    // Act
    const outcome = await syncHeartRateDay(
      { importedRecords, fetchMetrics },
      { profileId: PROFILE_ID, userId: USER_ID },
      DAY,
      STEP_SECONDS
    );

    // Assert
    expect(outcome).toEqual({
      status: "transport-error",
      error: "Unauthorized",
    });
  });

  it("should report a transport error when the response fails schema validation", async () => {
    // Arrange
    const { importedRecords, fetchMetrics } = makeDeps({
      ok: true,
      status: 200,
      data: { unexpected: "shape", values: "not-an-array" },
    });

    // Act
    const outcome = await syncHeartRateDay(
      { importedRecords, fetchMetrics },
      { profileId: PROFILE_ID, userId: USER_ID },
      DAY,
      STEP_SECONDS
    );

    // Assert
    expect(outcome).toEqual({
      status: "transport-error",
      error: "Malformed WHOOP metrics response",
    });
  });

  it("should stringify a non-Error value thrown by the bridge read", async () => {
    // Arrange
    const { importedRecords, fetchMetrics } = makeDeps(RESPONSE_WITH_SAMPLES);
    fetchMetrics.mockRejectedValue("connection reset");

    // Act
    const outcome = await syncHeartRateDay(
      { importedRecords, fetchMetrics },
      { profileId: PROFILE_ID, userId: USER_ID },
      DAY,
      STEP_SECONDS
    );

    // Assert
    expect(outcome).toEqual({
      status: "transport-error",
      error: "connection reset",
    });
  });
});
