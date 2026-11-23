/**
 * Train2Go's weight is a Train2Go weigh-in (#1666): the sync records what
 * Train2Go reports as its own row for today, never as `profile.bodyWeight`,
 * and never offers it as a difference from the athlete's numbers. Which
 * weigh-in a day reads is the Authority rule's to decide.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import type { LinkedCoachingAccount } from "../../types/coaching-account";
import type { FieldKey } from "../../types/coaching-zones";
import type { HealthWeightRecord } from "../../types/health/health-records";
import type { Profile } from "../../types/profile";
import { todayIsoDate } from "../../utils/today-iso-date";
import {
  getCurrentWeightKg,
  loadLatestWeighIn,
} from "../health/current-weight";
import type { CoachingTransport } from "./coaching-transport-port";
import { syncZones } from "./sync-zones";
import { SYNC_ZONES_IDS as IDS } from "./sync-zones.test-fixtures";

const PROFILE_ID = IDS.profileId;
const T2G_KG = 83;
const PROFILE_KG = 80;
const WEIGH_IN_KG = 75;
const EARLIEST = "0000-01-01";
const LATEST = "9999-12-31";
const PAST_DAY = "2026-01-05";
const WEIGHT_FIELD = "bodyWeight" as FieldKey;
const MANUAL = "manual";
const TRAIN2GO_BRIDGE = "train2go-bridge";
// A fixed clock: the weigh-in's day and time never depend on when CI runs.
const SYNC_AT = "2026-10-14T09:00:00.000Z";

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(SYNC_AT));
});

afterEach(() => {
  vi.useRealTimers();
});

const makeProfile = (bodyWeight?: number): Profile => ({
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
    } satisfies LinkedCoachingAccount,
  ],
  createdAt: IDS.now,
  updatedAt: IDS.now,
});

const weighIn = (
  date: string,
  kg: number,
  sourceBridgeId = MANUAL
): HealthWeightRecord => ({
  id: `w-${sourceBridgeId}-${date}`,
  profileId: PROFILE_ID,
  date,
  sourceBridgeId,
  externalId: `${sourceBridgeId}:${date}`,
  krd: {
    kind: "weight",
    version: "2.0",
    measuredAt: `${date}T07:00:00.000Z`,
    weightKilograms: kg,
  },
});

const transport: CoachingTransport = {
  source: IDS.source,
  ping: vi.fn(async () => ({ sessionActive: true })),
  openExternal: vi.fn(async () => undefined),
  readWeek: vi.fn(async () => []),
  readDay: vi.fn(async () => ({ activities: [] })),
  readZones: vi.fn(async () => ({ physiological: { weight: T2G_KG } })),
};

const seed = async (
  bodyWeight?: number,
  weighIns: HealthWeightRecord[] = []
) => {
  const persistence = createInMemoryPersistence();
  await persistence.profiles.put(makeProfile(bodyWeight));
  for (const record of weighIns) await persistence.healthWeight.put(record);
  return persistence;
};

const currentWeight = async (
  persistence: ReturnType<typeof createInMemoryPersistence>
) =>
  getCurrentWeightKg(
    await persistence.profiles.getById(PROFILE_ID),
    await loadLatestWeighIn(persistence, PROFILE_ID, todayIsoDate())
  );

const allWeighIns = async (
  persistence: ReturnType<typeof createInMemoryPersistence>
) =>
  persistence.healthWeight.getByProfileAndDateRange(
    PROFILE_ID,
    EARLIEST,
    LATEST
  );

const bySource = async (
  persistence: ReturnType<typeof createInMemoryPersistence>
) =>
  (await allWeighIns(persistence))
    .map((r) => [r.sourceBridgeId, r.date, r.krd.weightKilograms])
    .sort();

describe("syncZones — Train2Go's weight is a Train2Go weigh-in", () => {
  it.each([
    { case: "an earlier weigh-in", bodyWeight: undefined, past: WEIGH_IN_KG },
    { case: "profile.bodyWeight", bodyWeight: PROFILE_KG, past: undefined },
  ])(
    "should record, not offer, a weight that differs from $case",
    async ({ bodyWeight, past }) => {
      // Arrange
      const persistence = await seed(
        bodyWeight,
        past === undefined ? [] : [weighIn(PAST_DAY, past)]
      );

      // Act
      const result = await syncZones(PROFILE_ID, transport, persistence);

      // Assert
      if (!result.ok) throw new Error("expected ok");
      expect(result.conflicts).toEqual([]);
      expect(result.applied).toEqual([{ field: WEIGHT_FIELD, value: T2G_KG }]);
      const train2go = (await allWeighIns(persistence)).filter(
        (r) => r.sourceBridgeId === TRAIN2GO_BRIDGE
      );
      expect(train2go.map((r) => [r.date, r.krd.weightKilograms])).toEqual([
        [todayIsoDate(), T2G_KG],
      ]);
    }
  );

  it("should record nothing when the current weigh-in already reads Train2Go's weight", async () => {
    // Arrange
    // The profile fallback disagrees; the weigh-in agrees with Train2Go.
    const persistence = await seed(PROFILE_KG, [weighIn(PAST_DAY, T2G_KG)]);

    // Act
    const result = await syncZones(PROFILE_ID, transport, persistence);

    // Assert
    if (!result.ok) throw new Error("expected ok");
    expect(result.applied).toEqual([]);
    expect(result.conflicts).toEqual([]);
    expect(await allWeighIns(persistence)).toHaveLength(1);
  });

  it("should record an unknown weight as today's weigh-in, not on the profile", async () => {
    // Arrange
    const persistence = await seed();

    // Act
    const result = await syncZones(PROFILE_ID, transport, persistence);

    // Assert
    if (!result.ok) throw new Error("expected ok");
    expect(result.applied).toEqual([{ field: WEIGHT_FIELD, value: T2G_KG }]);
    expect(await bySource(persistence)).toEqual([
      [TRAIN2GO_BRIDGE, todayIsoDate(), T2G_KG],
    ]);
    expect((await persistence.profiles.getById(PROFILE_ID))?.bodyWeight).toBe(
      undefined
    );
  });

  it("should not duplicate the weigh-in when the same weight is re-synced", async () => {
    // Arrange
    const persistence = await seed();
    await syncZones(PROFILE_ID, transport, persistence);

    // Act
    const again = await syncZones(PROFILE_ID, transport, persistence);

    // Assert
    if (!again.ok) throw new Error("expected ok");
    expect(again.applied).toEqual([]);
    expect(again.conflicts).toEqual([]);
    expect(await allWeighIns(persistence)).toHaveLength(1);
  });

  it("should keep today's own weigh-in untouched and as the current weight", async () => {
    // Arrange
    const today = todayIsoDate();
    const persistence = await seed(PROFILE_KG, [weighIn(today, WEIGH_IN_KG)]);

    // Act
    await syncZones(PROFILE_ID, transport, persistence);

    // Assert
    expect(await bySource(persistence)).toEqual([
      [MANUAL, today, WEIGH_IN_KG],
      [TRAIN2GO_BRIDGE, today, T2G_KG],
    ]);
    expect(await currentWeight(persistence)).toBe(WEIGH_IN_KG);
    expect((await persistence.profiles.getById(PROFILE_ID))?.bodyWeight).toBe(
      PROFILE_KG
    );
  });

  it("should update Train2Go's own weigh-in of the day when its weight changes", async () => {
    // Arrange
    const today = todayIsoDate();
    const persistence = await seed(undefined, [
      weighIn(today, WEIGH_IN_KG, TRAIN2GO_BRIDGE),
    ]);

    // Act
    await syncZones(PROFILE_ID, transport, persistence);

    // Assert
    const records = await allWeighIns(persistence);
    expect(
      records.map((r) => [r.id, r.sourceBridgeId, r.krd.weightKilograms])
    ).toEqual([[`w-${TRAIN2GO_BRIDGE}-${today}`, TRAIN2GO_BRIDGE, T2G_KG]]);
  });

  it("should record nothing when Train2Go still reports what it reported", async () => {
    // Arrange
    // A manual weigh-in of the same day stays; Train2Go has not changed.
    const today = todayIsoDate();
    const persistence = await seed(undefined, [
      weighIn(today, WEIGH_IN_KG),
      weighIn(today, T2G_KG, TRAIN2GO_BRIDGE),
    ]);

    // Act
    const again = await syncZones(PROFILE_ID, transport, persistence);

    // Assert
    if (!again.ok) throw new Error("expected ok");
    expect(again.applied).toEqual([]);
    expect(again.conflicts).toEqual([]);
    expect(await allWeighIns(persistence)).toHaveLength(2);
  });
});
