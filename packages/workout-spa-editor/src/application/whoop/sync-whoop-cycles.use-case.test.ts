import { describe, expect, it, vi } from "vitest";

import { createInMemoryImportedRecordRepository } from "../../test-utils/in-memory-imported-record-repository";
import type {
  HealthHrvRecord,
  HealthSleepRecord,
  HealthStrainRecord,
  HealthVitalsRecord,
} from "../../types/health/health-records";
import type { IntegrationPolicy } from "../../types/integration-policy";
import type { IntegrationPolicyRepository } from "../integration-policy/integration-policy-repository.port";
import {
  syncWhoopCycles,
  type SyncWhoopCyclesDeps,
} from "./sync-whoop-cycles.use-case";
import type { WhoopFetchResult } from "./whoop-fetch-result";

const PROFILE_ID = "11111111-1111-4111-8111-111111111111";
const SLEEP_ID = "22222222-2222-4222-8222-222222222222";

const makePolicy = (
  dataType: "hrv" | "sleep" | "strain" | "vitals",
  overrides: Partial<IntegrationPolicy> = {}
): IntegrationPolicy => ({
  id: crypto.randomUUID(),
  profileId: PROFILE_ID,
  dataType,
  bridgeId: "whoop-bridge",
  direction: "import",
  mode: "manual",
  enabled: true,
  updatedAt: "2026-07-06T00:00:00.000Z",
  ...overrides,
});

const makePolicyRepo = (
  rows: IntegrationPolicy[]
): IntegrationPolicyRepository => ({
  findByProfileDirection: async ({ profileId, dataType, direction }) =>
    rows.filter(
      (r) =>
        r.profileId === profileId &&
        r.dataType === dataType &&
        r.direction === direction
    ),
  findByNaturalKey: async () => undefined,
  put: async () => undefined,
  deleteById: async () => undefined,
});

// Carries hrv/sleep data (Wave 1) plus the strain/vitals-triggering fields
// (Wave 2): a completed cycle (`scaled_strain` + `days`) and all four vitals
// measurements (`resting_heart_rate`, `spo2`, `skin_temp_celsius`, sleep's
// `respiratory_rate`).
const CYCLE_RECORD = {
  cycle: {
    id: 1629599351,
    days: "['2026-07-10','2026-07-11')",
    scaled_strain: 5.36,
    kilojoule: 8123.4,
  },
  recovery: {
    hrv_rmssd: 0.0571,
    recovery_score: 66,
    created_at: "2026-07-10T06:30:00.000Z",
    resting_heart_rate: 55,
    spo2: 96,
    skin_temp_celsius: 33.4,
  },
  sleeps: [
    {
      during: "['2026-07-09T22:24:47.970Z','2026-07-10T06:26:12.340Z')",
      activity_id: SLEEP_ID,
      time_in_bed: 9_600_000,
      light_sleep_duration: 3_600_000,
      slow_wave_sleep_duration: 3_600_000,
      rem_sleep_duration: 1_800_000,
      wake_duration: 600_000,
      score: 90,
      respiratory_rate: 17.05,
    },
  ],
};

// An in-progress cycle: no `scaled_strain`/`days` (strain converter returns
// null) and none of the four vitals fields (vitals converter returns null).
const IN_PROGRESS_CYCLE_RECORD = {
  cycle: { id: 1629599999 },
  recovery: {
    hrv_rmssd: 0.05,
    recovery_score: 50,
    created_at: "2026-07-10T06:30:00.000Z",
  },
  sleeps: [],
};

const emptyStores = () => ({
  weight: new Map(),
  sleep: new Map<string, HealthSleepRecord>(),
  hrv: new Map<string, HealthHrvRecord>(),
  "daily-wellness": new Map(),
  "body-composition": new Map(),
  stress: new Map(),
  strain: new Map<string, HealthStrainRecord>(),
  vitals: new Map<string, HealthVitalsRecord>(),
});

const makeDeps = (
  policies: IntegrationPolicy[],
  result: WhoopFetchResult = { ok: true, status: 200, data: [CYCLE_RECORD] }
): {
  deps: SyncWhoopCyclesDeps;
  stores: ReturnType<typeof emptyStores>;
  fetchCycles: ReturnType<typeof vi.fn>;
} => {
  const stores = emptyStores();
  const fetchCycles = vi.fn(async (): Promise<WhoopFetchResult> => result);
  const deps: SyncWhoopCyclesDeps = {
    policyRepo: makePolicyRepo(policies),
    importedRecords: createInMemoryImportedRecordRepository(stores),
    fetchCycles,
  };
  return { deps, stores, fetchCycles };
};

const input = {
  profileId: PROFILE_ID,
  userId: 1629599351,
  startTime: "2026-07-01T00:00:00.000Z",
  endTime: "2026-07-10T00:00:00.000Z",
};

const ALL_TYPE_POLICIES = [
  makePolicy("hrv"),
  makePolicy("sleep"),
  makePolicy("strain"),
  makePolicy("vitals"),
];

describe("syncWhoopCycles", () => {
  it("should persist hrv and sleep records stamped with the whoop bridge id", async () => {
    // Arrange
    const { deps, stores } = makeDeps([makePolicy("hrv"), makePolicy("sleep")]);

    // Act
    const result = await syncWhoopCycles(deps, input);

    // Assert
    expect(result).toEqual({
      ok: true,
      hrvImported: 1,
      sleepImported: 1,
      strainImported: 0,
      vitalsImported: 0,
      skipped: 0,
    });
    const hrv = [...stores.hrv.values()][0];
    const sleep = [...stores.sleep.values()][0];
    expect(hrv?.sourceBridgeId).toBe("whoop-bridge");
    expect(hrv?.externalId).toBe("cycle:1629599351:hrv");
    expect(sleep?.sourceBridgeId).toBe("whoop-bridge");
    expect(sleep?.externalId).toBe(SLEEP_ID);
    expect(stores.strain.size).toBe(0);
    expect(stores.vitals.size).toBe(0);
  });

  it("should persist strain and vitals records stamped with the whoop bridge id", async () => {
    // Arrange
    const { deps, stores } = makeDeps([
      makePolicy("strain"),
      makePolicy("vitals"),
    ]);

    // Act
    const result = await syncWhoopCycles(deps, input);

    // Assert
    expect(result).toEqual({
      ok: true,
      hrvImported: 0,
      sleepImported: 0,
      strainImported: 1,
      vitalsImported: 1,
      skipped: 0,
    });
    const strain = [...stores.strain.values()][0];
    const vitals = [...stores.vitals.values()][0];
    expect(strain?.sourceBridgeId).toBe("whoop-bridge");
    expect(strain?.externalId).toBe("cycle:1629599351:strain");
    expect(vitals?.sourceBridgeId).toBe("whoop-bridge");
    expect(vitals?.externalId).toBe("cycle:1629599351:vitals");
    expect(stores.hrv.size).toBe(0);
    expect(stores.sleep.size).toBe(0);
  });

  it("should skip strain and vitals when the converters return null", async () => {
    // Arrange
    const { deps, stores } = makeDeps(
      [makePolicy("strain"), makePolicy("vitals")],
      { ok: true, status: 200, data: [IN_PROGRESS_CYCLE_RECORD] }
    );

    // Act
    const result = await syncWhoopCycles(deps, input);

    // Assert
    expect(result).toEqual({
      ok: true,
      hrvImported: 0,
      sleepImported: 0,
      strainImported: 0,
      vitalsImported: 0,
      skipped: 0,
    });
    expect(stores.strain.size).toBe(0);
    expect(stores.vitals.size).toBe(0);
  });

  it("should be a no-op when no enabled whoop import policy exists", async () => {
    // Arrange
    const { deps, stores, fetchCycles } = makeDeps([
      makePolicy("hrv", { enabled: false }),
    ]);

    // Act
    const result = await syncWhoopCycles(deps, input);

    // Assert
    expect(result).toEqual({ ok: false, reason: "no-policy" });
    expect(fetchCycles).not.toHaveBeenCalled();
    expect(stores.hrv.size).toBe(0);
    expect(stores.sleep.size).toBe(0);
    expect(stores.strain.size).toBe(0);
    expect(stores.vitals.size).toBe(0);
  });

  it("should dedupe records on re-sync by their stable identity", async () => {
    // Arrange
    const { deps, stores } = makeDeps(ALL_TYPE_POLICIES);
    await syncWhoopCycles(deps, input);

    // Act
    const result = await syncWhoopCycles(deps, input);

    // Assert
    expect(result).toEqual({
      ok: true,
      hrvImported: 0,
      sleepImported: 0,
      strainImported: 0,
      vitalsImported: 0,
      skipped: 4,
    });
    expect(stores.hrv.size).toBe(1);
    expect(stores.sleep.size).toBe(1);
    expect(stores.strain.size).toBe(1);
    expect(stores.vitals.size).toBe(1);
  });

  it("should chunk a window longer than the cap into multiple reads", async () => {
    // Arrange
    const { deps, fetchCycles } = makeDeps([makePolicy("hrv")], {
      ok: true,
      status: 200,
      data: [],
    });

    // Act
    await syncWhoopCycles(deps, {
      ...input,
      startTime: "2026-01-01T00:00:00.000Z",
      endTime: "2027-05-01T00:00:00.000Z",
    });

    // Assert
    expect(fetchCycles.mock.calls.length).toBeGreaterThan(1);
    const firstPath = fetchCycles.mock.calls[0]?.[0];
    const secondPath = fetchCycles.mock.calls[1]?.[0];
    expect(firstPath).not.toBe(secondPath);
  });

  it("should return a transport error when the bridge read throws", async () => {
    // Arrange
    const { deps, fetchCycles } = makeDeps([makePolicy("hrv")]);
    fetchCycles.mockRejectedValue(new Error("Extension did not respond"));

    // Act
    const result = await syncWhoopCycles(deps, input);

    // Assert
    expect(result).toEqual({
      ok: false,
      reason: "transport-error",
      error: "Extension did not respond",
    });
  });

  it("should return a transport error when the cycles response fails schema validation", async () => {
    // Arrange
    const { deps } = makeDeps([makePolicy("hrv")], {
      ok: true,
      status: 200,
      data: { unexpected: "shape" },
    });

    // Act
    const result = await syncWhoopCycles(deps, input);

    // Assert
    expect(result).toEqual({
      ok: false,
      reason: "transport-error",
      error: "Malformed WHOOP cycles response",
    });
  });

  it("should return a transport error when the fetch result itself reports failure", async () => {
    // Arrange
    const { deps, stores } = makeDeps([makePolicy("hrv")], {
      ok: false,
      status: 401,
      error: "Unauthorized",
    });

    // Act
    const result = await syncWhoopCycles(deps, input);

    // Assert
    expect(result).toEqual({
      ok: false,
      reason: "transport-error",
      error: "Unauthorized",
    });
    expect(stores.hrv.size).toBe(0);
  });

  it("should stringify a non-Error value thrown by the bridge read", async () => {
    // Arrange
    const { deps, fetchCycles } = makeDeps([makePolicy("hrv")]);
    fetchCycles.mockRejectedValue("connection reset");

    // Act
    const result = await syncWhoopCycles(deps, input);

    // Assert
    expect(result).toEqual({
      ok: false,
      reason: "transport-error",
      error: "connection reset",
    });
  });
});
