import { describe, expect, it, vi } from "vitest";

import type { ActivityRecord } from "../../types/activity-record";
import type { IntegrationPolicy } from "../../types/integration-policy";
import type { IntegrationPolicyRepository } from "../integration-policy/integration-policy-repository.port";
import {
  syncWhoopActivities,
  type SyncWhoopActivitiesDeps,
} from "./sync-whoop-activities.use-case";
import type { WhoopFetchResult } from "./whoop-fetch-result";

const PROFILE_ID = "11111111-1111-4111-8111-111111111111";
const WORKOUT_ID = "3f2a9c1e-6b4d-4a1a-9e2f-7c8d1a5b9e60";
const SWIMMING_SPORT_ID = 33;

const makePolicy = (
  overrides: Partial<IntegrationPolicy> = {}
): IntegrationPolicy => ({
  id: crypto.randomUUID(),
  profileId: PROFILE_ID,
  dataType: "activity",
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

const SPORTS_RESULT: WhoopFetchResult = {
  ok: true,
  status: 200,
  data: [{ id: SWIMMING_SPORT_ID, name: "Swimming" }],
};

const WORKOUT_FIXTURE = {
  during: "['2026-07-10T08:15:00.000Z','2026-07-10T09:05:30.000Z')",
  sport_id: SWIMMING_SPORT_ID,
  activity_id: WORKOUT_ID,
  kilojoules: 1250.5,
  average_heart_rate: 142,
  max_heart_rate: 168,
};

const CYCLE_RECORD = {
  cycle: { id: 1629599351 },
  recovery: {
    hrv_rmssd: 0.0571,
    recovery_score: 66,
    created_at: "2026-07-10T06:30:00.000Z",
  },
  sleeps: [],
  workouts: [WORKOUT_FIXTURE],
};

const cyclesResult = (data: unknown): WhoopFetchResult => ({
  ok: true,
  status: 200,
  data,
});

const makeDeps = (
  over: Partial<SyncWhoopActivitiesDeps> = {}
): {
  deps: SyncWhoopActivitiesDeps;
  stored: ActivityRecord[];
  syncPut: ReturnType<typeof vi.fn>;
  fetchCycles: ReturnType<typeof vi.fn>;
  fetchSports: ReturnType<typeof vi.fn>;
} => {
  const stored: ActivityRecord[] = [];
  const syncPut = vi.fn(async () => undefined);
  const fetchCycles = vi.fn(async () => cyclesResult([CYCLE_RECORD]));
  const fetchSports = vi.fn(async () => SPORTS_RESULT);
  const deps: SyncWhoopActivitiesDeps = {
    policyRepo: makePolicyRepo([makePolicy()]),
    activities: {
      upsertByExternalId: async (record) => {
        const exists = stored.some(
          (s) =>
            s.sourceBridgeId === record.sourceBridgeId &&
            s.externalId === record.externalId
        );
        if (exists) return { created: false };
        stored.push(record);
        return { created: true };
      },
      getByProfileAndDateRange: async () => [],
    },
    coachingSyncState: {
      getBySourceAndProfile: async () => undefined,
      put: syncPut,
      deleteByProfile: async () => undefined,
    },
    fetchCycles,
    fetchSports,
    now: () => "2026-07-11T00:00:00.000Z",
    ...over,
  };
  return {
    deps,
    stored,
    syncPut,
    fetchCycles: deps.fetchCycles as ReturnType<typeof vi.fn>,
    fetchSports: deps.fetchSports as ReturnType<typeof vi.fn>,
  };
};

const input = {
  profileId: PROFILE_ID,
  userId: 1629599351,
  startTime: "2026-07-01T00:00:00.000Z",
  endTime: "2026-07-10T00:00:00.000Z",
};

describe("syncWhoopActivities", () => {
  it("should not fetch when no enabled whoop activity route exists", async () => {
    // Arrange
    const { deps, fetchCycles, fetchSports } = makeDeps({
      policyRepo: makePolicyRepo([makePolicy({ enabled: false })]),
    });

    // Act
    const result = await syncWhoopActivities(deps, input);

    // Assert
    expect(result).toEqual({ ok: false, reason: "route-inactive" });
    expect(fetchCycles).not.toHaveBeenCalled();
    expect(fetchSports).not.toHaveBeenCalled();
  });

  it("should import workouts resolved through the sports catalog and record sync freshness", async () => {
    // Arrange
    const { deps, stored, syncPut } = makeDeps();

    // Act
    const result = await syncWhoopActivities(deps, input);

    // Assert
    expect(result).toEqual({ ok: true, imported: 1, skipped: 0 });
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({
      sport: "Swimming",
      sourceBridgeId: "whoop-bridge",
      externalId: WORKOUT_ID,
      avgHeartRate: 142,
    });
    expect(syncPut).toHaveBeenCalledWith({
      source: "whoop-bridge",
      profileId: PROFILE_ID,
      lastSyncedAt: "2026-07-11T00:00:00.000Z",
    });
  });

  it("should dedupe workouts on re-sync by their stable identity", async () => {
    // Arrange
    const { deps, stored } = makeDeps();
    await syncWhoopActivities(deps, input);

    // Act
    const result = await syncWhoopActivities(deps, input);

    // Assert
    expect(result).toEqual({ ok: true, imported: 0, skipped: 1 });
    expect(stored).toHaveLength(1);
  });

  it("should fall back to 'Activity' for an unknown sport_id", async () => {
    // Arrange
    const { deps, stored } = makeDeps({
      fetchCycles: vi.fn(async () =>
        cyclesResult([
          {
            ...CYCLE_RECORD,
            workouts: [{ ...WORKOUT_FIXTURE, sport_id: 9999 }],
          },
        ])
      ),
    });

    // Act
    await syncWhoopActivities(deps, input);

    // Assert
    expect(stored[0]?.sport).toBe("Activity");
  });

  it("should skip workouts with no activity id or during window", async () => {
    // Arrange
    const { deps, stored } = makeDeps({
      fetchCycles: vi.fn(async () =>
        cyclesResult([
          {
            ...CYCLE_RECORD,
            workouts: [{ ...WORKOUT_FIXTURE, activity_id: null }],
          },
        ])
      ),
    });

    // Act
    const result = await syncWhoopActivities(deps, input);

    // Assert
    expect(result).toEqual({ ok: true, imported: 0, skipped: 1 });
    expect(stored).toHaveLength(0);
  });

  it("should return a transport error when the sports fetch throws", async () => {
    // Arrange
    const { deps, fetchCycles } = makeDeps({
      fetchSports: vi.fn(async () => {
        throw new Error("Extension did not respond");
      }),
    });

    // Act
    const result = await syncWhoopActivities(deps, input);

    // Assert
    expect(result).toEqual({
      ok: false,
      reason: "transport-error",
      error: "Extension did not respond",
    });
    expect(fetchCycles).not.toHaveBeenCalled();
  });

  it("should return a transport error when the sports response fails schema validation", async () => {
    // Arrange
    const { deps } = makeDeps({
      fetchSports: vi.fn(async () => ({
        ok: true,
        status: 200,
        data: { unexpected: "shape" },
      })),
    });

    // Act
    const result = await syncWhoopActivities(deps, input);

    // Assert
    expect(result).toMatchObject({ ok: false, reason: "transport-error" });
  });

  it("should return a transport error when the cycles fetch reports failure", async () => {
    // Arrange
    const { deps, stored } = makeDeps({
      fetchCycles: vi.fn(async () => ({
        ok: false,
        status: 401,
        error: "Unauthorized",
      })),
    });

    // Act
    const result = await syncWhoopActivities(deps, input);

    // Assert
    expect(result).toEqual({
      ok: false,
      reason: "transport-error",
      error: "Unauthorized",
    });
    expect(stored).toHaveLength(0);
  });

  it("should chunk a window longer than the cap into multiple cycle reads", async () => {
    // Arrange
    const { deps, fetchCycles } = makeDeps({
      fetchCycles: vi.fn(async () => cyclesResult([])),
    });

    // Act
    await syncWhoopActivities(deps, {
      ...input,
      startTime: "2026-01-01T00:00:00.000Z",
      endTime: "2027-05-01T00:00:00.000Z",
    });

    // Assert
    expect(fetchCycles.mock.calls.length).toBeGreaterThan(1);
  });
});
