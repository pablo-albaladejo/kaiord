import { describe, expect, it, vi } from "vitest";

import { createInMemoryImportedRecordRepository } from "../../test-utils/in-memory-imported-record-repository";
import type { HealthStressRecord } from "../../types/health/health-records";
import { syncStressDay } from "./sync-whoop-stress-day";
import type { WhoopFetchResult } from "./whoop-fetch-result";

const PROFILE_ID = "11111111-1111-4111-8111-111111111111";
const USER_ID = 42;
const GAUGE_FILL_PERCENTAGE = 0.47;
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
  stress: new Map<string, HealthStressRecord>(),
});

const makeDeps = (result: WhoopFetchResult) => {
  const stores = emptyStores();
  const fetchStress = vi.fn(async (): Promise<WhoopFetchResult> => result);
  return {
    stores,
    fetchStress,
    importedRecords: createInMemoryImportedRecordRepository(stores),
  };
};

const RESPONSE_WITH_GAUGE: WhoopFetchResult = {
  ok: true,
  status: 200,
  data: { gauge: { gauge_fill_percentage: GAUGE_FILL_PERCENTAGE } },
};

describe("syncStressDay", () => {
  it("should import an episode and upsert it stamped with the whoop bridge id", async () => {
    // Arrange
    const { importedRecords, fetchStress, stores } =
      makeDeps(RESPONSE_WITH_GAUGE);

    // Act
    const outcome = await syncStressDay(
      { importedRecords, fetchStress },
      { profileId: PROFILE_ID, userId: USER_ID },
      DAY
    );

    // Assert
    expect(outcome).toEqual({ status: "imported" });
    const row = [...stores.stress.values()][0];
    expect(row?.sourceBridgeId).toBe("whoop-bridge");
    expect(row?.externalId).toBe(`stress:${USER_ID}:${DAY.date}`);
    expect(fetchStress).toHaveBeenCalledWith(
      `/health-service/v2/stress-bff/${DAY.date}`
    );
  });

  it("should skip when the response has no gauge for the day", async () => {
    // Arrange
    const { importedRecords, fetchStress } = makeDeps({
      ok: true,
      status: 200,
      data: {},
    });

    // Act
    const outcome = await syncStressDay(
      { importedRecords, fetchStress },
      { profileId: PROFILE_ID, userId: USER_ID },
      DAY
    );

    // Assert
    expect(outcome).toEqual({ status: "skipped" });
  });

  it("should skip on re-sync of the same day (dedup)", async () => {
    // Arrange
    const { importedRecords, fetchStress } = makeDeps(RESPONSE_WITH_GAUGE);
    await syncStressDay(
      { importedRecords, fetchStress },
      { profileId: PROFILE_ID, userId: USER_ID },
      DAY
    );

    // Act
    const outcome = await syncStressDay(
      { importedRecords, fetchStress },
      { profileId: PROFILE_ID, userId: USER_ID },
      DAY
    );

    // Assert
    expect(outcome).toEqual({ status: "skipped" });
  });

  it("should report a transport error when the bridge read throws", async () => {
    // Arrange
    const { importedRecords, fetchStress } = makeDeps(RESPONSE_WITH_GAUGE);
    fetchStress.mockRejectedValue(new Error("Extension did not respond"));

    // Act
    const outcome = await syncStressDay(
      { importedRecords, fetchStress },
      { profileId: PROFILE_ID, userId: USER_ID },
      DAY
    );

    // Assert
    expect(outcome).toEqual({
      status: "transport-error",
      error: "Extension did not respond",
    });
  });

  it("should report a transport error when the fetch result itself reports failure", async () => {
    // Arrange
    const { importedRecords, fetchStress } = makeDeps({
      ok: false,
      status: 401,
      error: "Unauthorized",
    });

    // Act
    const outcome = await syncStressDay(
      { importedRecords, fetchStress },
      { profileId: PROFILE_ID, userId: USER_ID },
      DAY
    );

    // Assert
    expect(outcome).toEqual({
      status: "transport-error",
      error: "Unauthorized",
    });
  });

  it("should report a transport error when the response fails schema validation", async () => {
    // Arrange
    const { importedRecords, fetchStress } = makeDeps({
      ok: true,
      status: 200,
      data: { gauge: "not-an-object" },
    });

    // Act
    const outcome = await syncStressDay(
      { importedRecords, fetchStress },
      { profileId: PROFILE_ID, userId: USER_ID },
      DAY
    );

    // Assert
    expect(outcome).toEqual({
      status: "transport-error",
      error: "Malformed WHOOP stress response",
    });
  });

  it("should stringify a non-Error value thrown by the bridge read", async () => {
    // Arrange
    const { importedRecords, fetchStress } = makeDeps(RESPONSE_WITH_GAUGE);
    fetchStress.mockRejectedValue("connection reset");

    // Act
    const outcome = await syncStressDay(
      { importedRecords, fetchStress },
      { profileId: PROFILE_ID, userId: USER_ID },
      DAY
    );

    // Assert
    expect(outcome).toEqual({
      status: "transport-error",
      error: "connection reset",
    });
  });
});
