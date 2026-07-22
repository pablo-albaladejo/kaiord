import { describe, expect, it, vi } from "vitest";

import { createInMemoryImportedRecordRepository } from "../../test-utils/in-memory-imported-record-repository";
import type { HealthStressRecord } from "../../types/health/health-records";
import type { IntegrationPolicy } from "../../types/integration-policy";
import type { IntegrationPolicyRepository } from "../integration-policy/integration-policy-repository.port";
import {
  syncWhoopStress,
  type SyncWhoopStressDeps,
} from "./sync-whoop-stress.use-case";
import type { WhoopFetchResult } from "./whoop-fetch-result";

const PROFILE_ID = "11111111-1111-4111-8111-111111111111";
const USER_ID = 42;
const GAUGE_FILL_PERCENTAGE = 0.47;
const DATE_ONLY_LENGTH = 10;

const makePolicy = (
  overrides: Partial<IntegrationPolicy> = {}
): IntegrationPolicy => ({
  id: crypto.randomUUID(),
  profileId: PROFILE_ID,
  dataType: "stress",
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
  stress: new Map<string, HealthStressRecord>(),
});

const makeDeps = (
  policies: IntegrationPolicy[],
  fetchStress: SyncWhoopStressDeps["fetchStress"]
): { deps: SyncWhoopStressDeps; stores: ReturnType<typeof emptyStores> } => {
  const stores = emptyStores();
  const deps: SyncWhoopStressDeps = {
    policyRepo: makePolicyRepo(policies),
    importedRecords: createInMemoryImportedRecordRepository(stores),
    fetchStress,
  };
  return { deps, stores };
};

const input = {
  profileId: PROFILE_ID,
  userId: USER_ID,
  startTime: "2026-07-10T00:00:00.000Z",
  endTime: "2026-07-11T23:59:59.999Z",
};

describe("syncWhoopStress", () => {
  it("should be a no-op when no enabled whoop import policy exists", async () => {
    // Arrange
    const fetchStress = vi.fn();
    const { deps, stores } = makeDeps(
      [makePolicy({ enabled: false })],
      fetchStress
    );

    // Act
    const result = await syncWhoopStress(deps, input);

    // Assert
    expect(result).toEqual({ ok: false, reason: "no-policy" });
    expect(fetchStress).not.toHaveBeenCalled();
    expect(stores.stress.size).toBe(0);
  });

  it("should import one episode per day in the window", async () => {
    // Arrange
    const fetchStress = vi.fn(async (): Promise<WhoopFetchResult> => ({
      ok: true,
      status: 200,
      data: { gauge: { gauge_fill_percentage: GAUGE_FILL_PERCENTAGE } },
    }));
    const { deps, stores } = makeDeps([makePolicy()], fetchStress);

    // Act
    const result = await syncWhoopStress(deps, input);

    // Assert
    expect(result).toEqual({ ok: true, episodesImported: 2, skipped: 0 });
    expect(stores.stress.size).toBe(2);
    expect(fetchStress).toHaveBeenCalledTimes(2);
  });

  it("should skip days with no gauge", async () => {
    // Arrange
    const fetchStress = vi.fn(async (): Promise<WhoopFetchResult> => ({
      ok: true,
      status: 200,
      data: {},
    }));
    const { deps, stores } = makeDeps([makePolicy()], fetchStress);

    // Act
    const result = await syncWhoopStress(deps, input);

    // Assert
    expect(result).toEqual({ ok: true, episodesImported: 0, skipped: 2 });
    expect(stores.stress.size).toBe(0);
  });

  it("should dedupe on re-sync by the stable per-day identity", async () => {
    // Arrange
    const fetchStress = vi.fn(async (): Promise<WhoopFetchResult> => ({
      ok: true,
      status: 200,
      data: { gauge: { gauge_fill_percentage: GAUGE_FILL_PERCENTAGE } },
    }));
    const { deps, stores } = makeDeps([makePolicy()], fetchStress);
    await syncWhoopStress(deps, input);

    // Act
    const result = await syncWhoopStress(deps, input);

    // Assert
    expect(result).toEqual({ ok: true, episodesImported: 0, skipped: 2 });
    expect(stores.stress.size).toBe(2);
  });

  it("should return a transport error and stop when a day's fetch throws", async () => {
    // Arrange
    const fetchStress = vi
      .fn()
      .mockRejectedValue(new Error("Extension did not respond"));
    const { deps } = makeDeps([makePolicy()], fetchStress);

    // Act
    const result = await syncWhoopStress(deps, input);

    // Assert
    expect(result).toEqual({
      ok: false,
      reason: "transport-error",
      error: "Extension did not respond",
      episodesImported: 0,
      skipped: 0,
    });
  });

  it("should preserve counts accumulated before a mid-window transport error", async () => {
    // Arrange
    // `input` spans two days: the first imports an episode, the second
    // throws. Day one's upsert is already persisted, so the failure must
    // report that partial progress rather than dropping it to zero.
    const fetchStress = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        data: { gauge: { gauge_fill_percentage: GAUGE_FILL_PERCENTAGE } },
      })
      .mockRejectedValueOnce(new Error("Extension did not respond"));
    const { deps } = makeDeps([makePolicy()], fetchStress);

    // Act
    const result = await syncWhoopStress(deps, input);

    // Assert
    expect(result).toEqual({
      ok: false,
      reason: "transport-error",
      error: "Extension did not respond",
      episodesImported: 1,
      skipped: 0,
    });
  });

  it("should build the stress-bff path from the day's date", async () => {
    // Arrange
    const fetchStress = vi.fn(async (): Promise<WhoopFetchResult> => ({
      ok: true,
      status: 200,
      data: {},
    }));
    const { deps } = makeDeps([makePolicy()], fetchStress);

    // Act
    await syncWhoopStress(deps, input);

    // Assert
    const firstPath = fetchStress.mock.calls[0]?.[0] as string;
    expect(firstPath).toBe(
      `/health-service/v2/stress-bff/${input.startTime.slice(0, DATE_ONLY_LENGTH)}`
    );
  });
});
