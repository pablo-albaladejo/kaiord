import { describe, expect, it, vi } from "vitest";

import type { ActivityRecord } from "../../types/activity-record";
import type { IntegrationPolicy } from "../../types/integration-policy";
import type { IntegrationPolicyRepository } from "../integration-policy/integration-policy-repository.port";
import type { GarminActivitiesResponse } from "./garmin-activity-schema";
import {
  pullGarminActivities,
  type PullGarminActivitiesDeps,
} from "./pull-garmin-activities.use-case";

const PROFILE_ID = "11111111-1111-4111-8111-111111111111";

const makePolicy = (
  overrides: Partial<IntegrationPolicy> = {}
): IntegrationPolicy => ({
  id: crypto.randomUUID(),
  profileId: PROFILE_ID,
  dataType: "activity",
  bridgeId: "garmin-bridge",
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

const response = (
  activities: GarminActivitiesResponse["activities"],
  over: Partial<GarminActivitiesResponse> = {}
): GarminActivitiesResponse => ({
  activities,
  disabled: false,
  throttled: false,
  ...over,
});

const makeDeps = (
  over: Partial<PullGarminActivitiesDeps> = {}
): {
  deps: PullGarminActivitiesDeps;
  stored: ActivityRecord[];
  syncPut: ReturnType<typeof vi.fn>;
  readActivities: ReturnType<typeof vi.fn>;
} => {
  const stored: ActivityRecord[] = [];
  const syncPut = vi.fn(async () => undefined);
  const readActivities = vi.fn(async () => response([]));
  const deps: PullGarminActivitiesDeps = {
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
    },
    coachingSyncState: {
      getBySourceAndProfile: async () => undefined,
      put: syncPut,
      deleteByProfile: async () => undefined,
    },
    readActivities,
    now: () => "2026-07-07T00:00:00.000Z",
    ...over,
  };
  return { deps, stored, syncPut, readActivities };
};

describe("pullGarminActivities", () => {
  it("should not fetch when no enabled garmin activity route exists", async () => {
    // Arrange
    const { deps, readActivities } = makeDeps({
      policyRepo: makePolicyRepo([makePolicy({ enabled: false })]),
    });

    // Act
    const result = await pullGarminActivities(deps, PROFILE_ID);

    // Assert
    expect(result).toEqual({ ok: false, reason: "route-inactive" });
    expect(readActivities).not.toHaveBeenCalled();
  });

  it("should import and dedup activities and record sync freshness", async () => {
    // Arrange
    const raw = {
      activityId: 555,
      startTimeLocal: "2026-07-05 07:30:00",
      activityType: { typeKey: "running" },
      duration: 3600,
      distance: 10000,
    };
    const { deps, stored, syncPut, readActivities } = makeDeps();
    readActivities.mockResolvedValue(response([raw, raw]));

    // Act
    const result = await pullGarminActivities(deps, PROFILE_ID);

    // Assert
    expect(result).toEqual({
      ok: true,
      imported: 1,
      skipped: 1,
      disabled: false,
      throttled: false,
    });
    expect(stored).toHaveLength(1);
    expect(syncPut).toHaveBeenCalledWith({
      source: "garmin-bridge",
      profileId: PROFILE_ID,
      lastSyncedAt: "2026-07-07T00:00:00.000Z",
    });
  });

  it("should not persist when the bridge reports the kill-switch is engaged", async () => {
    // Arrange
    const { deps, stored, syncPut, readActivities } = makeDeps();
    readActivities.mockResolvedValue(response([], { disabled: true }));

    // Act
    const result = await pullGarminActivities(deps, PROFILE_ID);

    // Assert
    expect(result).toMatchObject({ ok: true, imported: 0, disabled: true });
    expect(stored).toHaveLength(0);
    expect(syncPut).not.toHaveBeenCalled();
  });

  it("should return a transport error when the bridge read throws", async () => {
    // Arrange
    const { deps, readActivities } = makeDeps();
    readActivities.mockRejectedValue(new Error("Extension did not respond"));

    // Act
    const result = await pullGarminActivities(deps, PROFILE_ID);

    // Assert
    expect(result).toEqual({
      ok: false,
      reason: "transport-error",
      error: "Extension did not respond",
    });
  });
});
