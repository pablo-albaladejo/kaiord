/**
 * Train2Go's weight is governed by its Data Hub route (weight · import ·
 * train2go-bridge), like every other source's weight. A route switched off
 * withholds the weight; a route that does not exist yet — an extension that
 * does not announce `read:body`, or a link made before it did — keeps the
 * weight flowing exactly as it did before the route existed.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import type { ConflictDecision, FieldKey } from "../../types/coaching-zones";
import type { HealthWeightRecord } from "../../types/health/health-records";
import type { Profile } from "../../types/profile";
import type { CoachingTransport } from "./coaching-transport-port";
import { commitConflictResolution } from "./commit-conflict-resolution";
import { syncZones } from "./sync-zones";
import { SYNC_ZONES_IDS as IDS } from "./sync-zones.test-fixtures";

const PROFILE_ID = IDS.profileId;
const T2G_KG = 83;
const PROFILE_KG = 80;
const WEIGHT_FIELD = "bodyWeight" as FieldKey;
const TRAIN2GO_BRIDGE = "train2go-bridge";
const SYNC_AT = "2026-10-14T09:00:00.000Z";
const PAYLOAD = { physiological: { weight: T2G_KG } };
const ACCEPT = { [WEIGHT_FIELD]: "accept" } as Record<
  FieldKey,
  ConflictDecision
>;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(SYNC_AT));
});

afterEach(() => {
  vi.useRealTimers();
});

const transport: CoachingTransport = {
  source: IDS.source,
  ping: vi.fn(async () => ({ sessionActive: true })),
  openExternal: vi.fn(async () => undefined),
  readWeek: vi.fn(async () => []),
  readDay: vi.fn(async () => ({ activities: [] })),
  readZones: vi.fn(async () => PAYLOAD),
};

const profile = (bodyWeight?: number): Profile => ({
  id: PROFILE_ID,
  name: IDS.externalUserName,
  bodyWeight,
  sportZones: {},
  linkedAccounts: [
    {
      source: IDS.source,
      externalUserId: IDS.externalUserId,
      externalUserName: IDS.externalUserName,
      linkedAt: IDS.now,
    },
  ],
  createdAt: IDS.now,
  updatedAt: IDS.now,
});

type Route = "absent" | "on" | "off";

const seed = async (route: Route, bodyWeight?: number) => {
  const persistence = createInMemoryPersistence();
  await persistence.profiles.put(profile(bodyWeight));
  if (route !== "absent") {
    await persistence.integrationPolicy.put({
      id: "00000000-0000-4000-8000-0000000000aa",
      profileId: PROFILE_ID,
      dataType: "weight",
      bridgeId: TRAIN2GO_BRIDGE,
      direction: "import",
      mode: "auto",
      enabled: route === "on",
      updatedAt: IDS.now,
    });
  }
  return persistence;
};

const train2goWeighIns = async (
  persistence: ReturnType<typeof createInMemoryPersistence>
): Promise<HealthWeightRecord[]> =>
  (
    await persistence.healthWeight.getByProfileAndDateRange(
      PROFILE_ID,
      "0000-01-01",
      "9999-12-31"
    )
  ).filter((r) => r.sourceBridgeId === TRAIN2GO_BRIDGE);

describe("syncZones — the Train2Go weight route", () => {
  it.each<{ route: Route; recorded: number[] }>([
    { route: "on", recorded: [T2G_KG] },
    { route: "absent", recorded: [T2G_KG] },
    { route: "off", recorded: [] },
  ])(
    "should record $recorded when the route is $route",
    async ({ route, recorded }) => {
      // Arrange
      const persistence = await seed(route);

      // Act
      const result = await syncZones(PROFILE_ID, transport, persistence);

      // Assert
      if (!result.ok) throw new Error("expected ok");
      const weighIns = await train2goWeighIns(persistence);
      expect(weighIns.map((r) => r.krd.weightKilograms)).toEqual(recorded);
    }
  );

  it("should neither apply nor ask about the weight when the route is off", async () => {
    // Arrange
    // The profile weight differs: with the route on this is a conflict.
    const persistence = await seed("off", PROFILE_KG);

    // Act
    const result = await syncZones(PROFILE_ID, transport, persistence);

    // Assert
    if (!result.ok) throw new Error("expected ok");
    expect(result.applied).toEqual([]);
    expect(result.conflicts).toEqual([]);
  });

  it("should still raise the weight conflict when the route is on", async () => {
    // Arrange
    const persistence = await seed("on", PROFILE_KG);

    // Act
    const result = await syncZones(PROFILE_ID, transport, persistence);

    // Assert
    if (!result.ok) throw new Error("expected ok");
    expect(result.conflicts).toEqual([
      { field: WEIGHT_FIELD, current: PROFILE_KG, incoming: T2G_KG },
    ]);
  });
});

describe("commitConflictResolution — the Train2Go weight route", () => {
  it.each<{ route: Route; recorded: number[] }>([
    { route: "on", recorded: [T2G_KG] },
    { route: "absent", recorded: [T2G_KG] },
    { route: "off", recorded: [] },
  ])(
    "should record $recorded for an accepted weight when the route is $route",
    async ({ route, recorded }) => {
      // Arrange
      // The route may be switched off between the dialog and the commit.
      const persistence = await seed(route, PROFILE_KG);

      // Act
      await commitConflictResolution(PROFILE_ID, ACCEPT, persistence, PAYLOAD);

      // Assert
      const weighIns = await train2goWeighIns(persistence);
      expect(weighIns.map((r) => r.krd.weightKilograms)).toEqual(recorded);
    }
  );
});
