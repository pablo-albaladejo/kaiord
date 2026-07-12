import { describe, expect, it, vi } from "vitest";

import { createInMemoryImportedRecordRepository } from "../../test-utils/in-memory-imported-record-repository";
import type { HealthHeartRateSeriesRecord } from "../../types/health/health-records";
import type { IntegrationPolicy } from "../../types/integration-policy";
import type { IntegrationPolicyRepository } from "../integration-policy/integration-policy-repository.port";
import {
  syncWhoopHeartRate,
  type SyncWhoopHeartRateDeps,
} from "./sync-whoop-heart-rate.use-case";
import type { WhoopFetchResult } from "./whoop-fetch-result";

const PROFILE_ID = "11111111-1111-4111-8111-111111111111";
const USER_ID = 42;
const SAMPLE_BPM = 58;
const SAMPLE_HOUR = 6;
const MS_PER_HOUR = 3_600_000;
const DEFAULT_STEP_SECONDS = 6;

const makePolicy = (
  overrides: Partial<IntegrationPolicy> = {}
): IntegrationPolicy => ({
  id: crypto.randomUUID(),
  profileId: PROFILE_ID,
  dataType: "heart-rate-series",
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

const emptyStores = () => ({
  weight: new Map(),
  sleep: new Map(),
  hrv: new Map(),
  "daily-wellness": new Map(),
  "body-composition": new Map(),
  stress: new Map(),
  "heart-rate-series": new Map<string, HealthHeartRateSeriesRecord>(),
});

const sampleAt = (dayStartISO: string, hour: number) => ({
  data: SAMPLE_BPM,
  time: Date.parse(dayStartISO) + hour * MS_PER_HOUR,
});

const makeDeps = (
  policies: IntegrationPolicy[],
  fetchMetrics: SyncWhoopHeartRateDeps["fetchMetrics"]
): { deps: SyncWhoopHeartRateDeps; stores: ReturnType<typeof emptyStores> } => {
  const stores = emptyStores();
  const deps: SyncWhoopHeartRateDeps = {
    policyRepo: makePolicyRepo(policies),
    importedRecords: createInMemoryImportedRecordRepository(stores),
    fetchMetrics,
  };
  return { deps, stores };
};

const input = {
  profileId: PROFILE_ID,
  userId: USER_ID,
  startTime: "2026-07-10T00:00:00.000Z",
  endTime: "2026-07-11T23:59:59.999Z",
};

describe("syncWhoopHeartRate", () => {
  it("should be a no-op when no enabled whoop import policy exists", async () => {
    // Arrange
    const fetchMetrics = vi.fn();
    const { deps, stores } = makeDeps(
      [makePolicy({ enabled: false })],
      fetchMetrics
    );

    // Act
    const result = await syncWhoopHeartRate(deps, input);

    // Assert
    expect(result).toEqual({ ok: false, reason: "no-policy" });
    expect(fetchMetrics).not.toHaveBeenCalled();
    expect(stores["heart-rate-series"].size).toBe(0);
  });

  it("should import one series per day in the window", async () => {
    // Arrange
    const fetchMetrics = vi.fn(
      async (path: string): Promise<WhoopFetchResult> => {
        const dayStart = decodeURIComponent(
          /start=([^&]+)/.exec(path)?.[1] ?? ""
        );
        return {
          ok: true,
          status: 200,
          data: { values: [sampleAt(dayStart, SAMPLE_HOUR)] },
        };
      }
    );
    const { deps, stores } = makeDeps([makePolicy()], fetchMetrics);

    // Act
    const result = await syncWhoopHeartRate(deps, input);

    // Assert
    expect(result).toEqual({ ok: true, seriesImported: 2, skipped: 0 });
    expect(stores["heart-rate-series"].size).toBe(2);
    expect(fetchMetrics).toHaveBeenCalledTimes(2);
  });

  it("should skip days with no samples", async () => {
    // Arrange
    const fetchMetrics = vi.fn(async (): Promise<WhoopFetchResult> => ({
      ok: true,
      status: 200,
      data: { values: [] },
    }));
    const { deps, stores } = makeDeps([makePolicy()], fetchMetrics);

    // Act
    const result = await syncWhoopHeartRate(deps, input);

    // Assert
    expect(result).toEqual({ ok: true, seriesImported: 0, skipped: 2 });
    expect(stores["heart-rate-series"].size).toBe(0);
  });

  it("should dedupe on re-sync by the stable per-day identity", async () => {
    // Arrange
    const fetchMetrics = vi.fn(
      async (path: string): Promise<WhoopFetchResult> => {
        const dayStart = decodeURIComponent(
          /start=([^&]+)/.exec(path)?.[1] ?? ""
        );
        return {
          ok: true,
          status: 200,
          data: { values: [sampleAt(dayStart, SAMPLE_HOUR)] },
        };
      }
    );
    const { deps, stores } = makeDeps([makePolicy()], fetchMetrics);
    await syncWhoopHeartRate(deps, input);

    // Act
    const result = await syncWhoopHeartRate(deps, input);

    // Assert
    expect(result).toEqual({ ok: true, seriesImported: 0, skipped: 2 });
    expect(stores["heart-rate-series"].size).toBe(2);
  });

  it("should return a transport error and stop when a day's fetch throws", async () => {
    // Arrange
    const fetchMetrics = vi
      .fn()
      .mockRejectedValue(new Error("Extension did not respond"));
    const { deps } = makeDeps([makePolicy()], fetchMetrics);

    // Act
    const result = await syncWhoopHeartRate(deps, input);

    // Assert
    expect(result).toEqual({
      ok: false,
      reason: "transport-error",
      error: "Extension did not respond",
      seriesImported: 0,
      skipped: 0,
    });
  });

  it("should preserve counts accumulated before a mid-window transport error", async () => {
    // Arrange
    // `input` spans two days: the first imports a series, the second throws.
    // Day one's upsert is already persisted, so the failure must report that
    // partial progress rather than dropping it to zero.
    const fetchMetrics = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        data: { values: [sampleAt(input.startTime, SAMPLE_HOUR)] },
      })
      .mockRejectedValueOnce(new Error("Extension did not respond"));
    const { deps } = makeDeps([makePolicy()], fetchMetrics);

    // Act
    const result = await syncWhoopHeartRate(deps, input);

    // Assert
    expect(result).toEqual({
      ok: false,
      reason: "transport-error",
      error: "Extension did not respond",
      seriesImported: 1,
      skipped: 0,
    });
  });

  it("should default stepSeconds to 6 when not provided", async () => {
    // Arrange
    const fetchMetrics = vi.fn(async (): Promise<WhoopFetchResult> => ({
      ok: true,
      status: 200,
      data: { values: [] },
    }));
    const { deps } = makeDeps([makePolicy()], fetchMetrics);

    // Act
    await syncWhoopHeartRate(deps, input);

    // Assert
    const firstPath = fetchMetrics.mock.calls[0]?.[0] as string;
    expect(firstPath).toContain(`&step=${DEFAULT_STEP_SECONDS}`);
  });
});
