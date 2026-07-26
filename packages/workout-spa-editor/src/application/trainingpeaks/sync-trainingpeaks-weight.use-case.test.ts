import type { KRD } from "@kaiord/core";
import { describe, expect, it, vi } from "vitest";

import { createInMemoryImportedRecordRepository } from "../../test-utils/in-memory-imported-record-repository";
import type { IntegrationPolicy } from "../../types/integration-policy";
import type { IntegrationPolicyRepository } from "../integration-policy/integration-policy-repository.port";
import {
  syncTrainingPeaksWeight,
  type SyncTrainingPeaksWeightDeps,
} from "./sync-trainingpeaks-weight.use-case";

const PROFILE_ID = "11111111-1111-4111-8111-111111111111";
const MEASURED_AT = "2026-07-20T08:00:00.000Z";
const WEIGHT_KG = 75.2;
const START = "2026-06-20";
const END = "2026-07-20";

const weightKrd = (measuredAt: string): KRD => ({
  version: "2.0",
  type: "weight_measurement",
  metadata: { created: measuredAt, manufacturer: "trainingpeaks" },
  extensions: {
    health: {
      weight: {
        kind: "weight",
        version: "2.0",
        measuredAt,
        weightKilograms: WEIGHT_KG,
      },
    },
  },
});

const makePolicy = (
  overrides: Partial<IntegrationPolicy> = {}
): IntegrationPolicy => ({
  id: crypto.randomUUID(),
  profileId: PROFILE_ID,
  dataType: "weight",
  bridgeId: "trainingpeaks-bridge",
  direction: "import",
  mode: "manual",
  enabled: true,
  updatedAt: "2026-07-20T00:00:00.000Z",
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
});

const makeSyncStateRepo = () => ({
  getBySourceAndProfile: vi.fn().mockResolvedValue(undefined),
  put: vi.fn().mockResolvedValue(undefined),
  deleteByProfile: vi.fn().mockResolvedValue(undefined),
});

const makeDeps = (
  policies: IntegrationPolicy[],
  readMetrics: SyncTrainingPeaksWeightDeps["readMetrics"],
  stores = emptyStores(),
  checkSession = vi.fn().mockResolvedValue(true),
  coachingSyncState = makeSyncStateRepo()
): {
  deps: SyncTrainingPeaksWeightDeps;
  stores: ReturnType<typeof emptyStores>;
  checkSession: ReturnType<typeof vi.fn>;
  coachingSyncState: ReturnType<typeof makeSyncStateRepo>;
} => ({
  deps: {
    policyRepo: makePolicyRepo(policies),
    importedRecords: createInMemoryImportedRecordRepository(stores),
    checkSession,
    readMetrics,
    parse: () => [weightKrd(MEASURED_AT)],
    coachingSyncState,
  },
  stores,
  checkSession,
  coachingSyncState,
});

const input = { profileId: PROFILE_ID, start: START, end: END };

describe("syncTrainingPeaksWeight", () => {
  it("should probe neither the session nor the metrics when no enabled route exists", async () => {
    // Arrange
    const readMetrics = vi.fn();
    const { deps, stores, checkSession } = makeDeps(
      [makePolicy({ enabled: false })],
      readMetrics
    );

    // Act
    const result = await syncTrainingPeaksWeight(deps, input);

    // Assert
    expect(result).toEqual({ ok: false, reason: "no-policy" });
    // checkSession is a live token exchange — the policy gate must precede it.
    expect(checkSession).not.toHaveBeenCalled();
    expect(readMetrics).not.toHaveBeenCalled();
    expect(stores.weight.size).toBe(0);
  });

  it("should report no-session without reading metrics when the bridge is unauthenticated", async () => {
    // Arrange
    const readMetrics = vi.fn();
    const { deps, stores } = makeDeps(
      [makePolicy()],
      readMetrics,
      emptyStores(),
      vi.fn().mockResolvedValue(false)
    );

    // Act
    const result = await syncTrainingPeaksWeight(deps, input);

    // Assert
    expect(result).toEqual({ ok: false, reason: "no-session" });
    expect(readMetrics).not.toHaveBeenCalled();
    expect(stores.weight.size).toBe(0);
  });

  it("should ignore an enabled route that belongs to another bridge", async () => {
    // Arrange
    const readMetrics = vi.fn();
    const { deps } = makeDeps(
      [makePolicy({ bridgeId: "whoop-bridge" })],
      readMetrics,
      emptyStores()
    );

    // Act
    const result = await syncTrainingPeaksWeight(deps, input);

    // Assert
    expect(result).toEqual({ ok: false, reason: "no-policy" });
    expect(readMetrics).not.toHaveBeenCalled();
  });

  it("should import a weight reading over the requested window", async () => {
    // Arrange
    const readMetrics = vi.fn().mockResolvedValue([]);
    const { deps, stores } = makeDeps([makePolicy()], readMetrics);

    // Act
    const result = await syncTrainingPeaksWeight(deps, input);

    // Assert
    expect(result).toEqual({ ok: true, imported: 1, skipped: 0 });
    expect(readMetrics).toHaveBeenCalledWith(START, END);
    const [row] = [...stores.weight.values()];
    expect(row).toMatchObject({
      profileId: PROFILE_ID,
      sourceBridgeId: "trainingpeaks-bridge",
      date: "2026-07-20",
      measuredAt: MEASURED_AT,
    });
  });

  it("should skip an already-imported reading on a second run", async () => {
    // Arrange
    const readMetrics = vi.fn().mockResolvedValue([]);
    const stores = emptyStores();
    const { deps } = makeDeps([makePolicy()], readMetrics, stores);
    await syncTrainingPeaksWeight(deps, input);

    // Act
    const result = await syncTrainingPeaksWeight(deps, input);

    // Assert
    expect(result).toEqual({ ok: true, imported: 0, skipped: 1 });
    expect(stores.weight.size).toBe(1);
  });

  it("should report a transport error without persisting anything", async () => {
    // Arrange
    const readMetrics = vi.fn().mockRejectedValue(new Error("Session expired"));
    const { deps, stores } = makeDeps([makePolicy()], readMetrics);

    // Act
    const result = await syncTrainingPeaksWeight(deps, input);

    // Assert
    expect(result).toEqual({
      ok: false,
      reason: "transport-error",
      error: "Session expired",
    });
    expect(stores.weight.size).toBe(0);
  });

  it("should record the import freshness after a successful run", async () => {
    // Arrange
    const { deps, coachingSyncState } = makeDeps(
      [makePolicy()],
      vi.fn().mockResolvedValue([])
    );

    // Act
    await syncTrainingPeaksWeight(deps, input);

    // Assert
    expect(coachingSyncState.put).toHaveBeenCalledWith({
      source: "trainingpeaks-bridge",
      profileId: PROFILE_ID,
      lastSyncedAt: expect.any(String),
    });
  });

  it("should not record freshness when no import route is enabled", async () => {
    // Arrange
    const { deps, coachingSyncState } = makeDeps(
      [makePolicy({ enabled: false })],
      vi.fn()
    );

    // Act
    await syncTrainingPeaksWeight(deps, input);

    // Assert
    expect(coachingSyncState.put).not.toHaveBeenCalled();
  });

  it("should not record freshness when the session is signed out", async () => {
    // Arrange
    const { deps, coachingSyncState } = makeDeps(
      [makePolicy()],
      vi.fn(),
      emptyStores(),
      vi.fn().mockResolvedValue(false)
    );

    // Act
    await syncTrainingPeaksWeight(deps, input);

    // Assert
    expect(coachingSyncState.put).not.toHaveBeenCalled();
  });
});
