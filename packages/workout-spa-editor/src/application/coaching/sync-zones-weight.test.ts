/**
 * Train2Go's weight is the athlete's current weight (audit P-03, #1403): the
 * sync reads it through `getCurrentWeightKg` and records an incoming value as
 * today's weigh-in, never as `profile.bodyWeight`.
 */
import { describe, expect, it, vi } from "vitest";

import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import type { LinkedCoachingAccount } from "../../types/coaching-account";
import type { ConflictDecision, FieldKey } from "../../types/coaching-zones";
import type { HealthWeightRecord } from "../../types/health/health-records";
import type { Profile } from "../../types/profile";
import { todayIsoDate } from "../../utils/today-iso-date";
import type { CoachingTransport } from "./coaching-transport-port";
import { commitConflictResolution } from "./commit-conflict-resolution";
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

const weighIn = (date: string, kg: number): HealthWeightRecord => ({
  id: `w-${date}`,
  profileId: PROFILE_ID,
  date,
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

const PAYLOAD = { physiological: { weight: T2G_KG } };

const seed = async (
  bodyWeight?: number,
  weighIns: HealthWeightRecord[] = []
) => {
  const persistence = createInMemoryPersistence();
  await persistence.profiles.put(makeProfile(bodyWeight));
  for (const record of weighIns) await persistence.healthWeight.put(record);
  return persistence;
};

const allWeighIns = async (
  persistence: ReturnType<typeof createInMemoryPersistence>
) =>
  persistence.healthWeight.getByProfileAndDateRange(
    PROFILE_ID,
    EARLIEST,
    LATEST
  );

describe("syncZones — the weight is the current weight", () => {
  it("should read the latest weigh-in, not profile.bodyWeight", async () => {
    // Arrange
    // The profile fallback disagrees; the weigh-in agrees with Train2Go.
    const persistence = await seed(PROFILE_KG, [weighIn(PAST_DAY, T2G_KG)]);

    // Act
    const result = await syncZones(PROFILE_ID, transport, persistence);

    // Assert
    if (!result.ok) throw new Error("expected ok");
    expect(result.applied).toEqual([]);
    expect(result.conflicts).toEqual([]);
  });

  it("should compare against a weigh-in when the profile has no weight", async () => {
    // Arrange
    const persistence = await seed(undefined, [weighIn(PAST_DAY, WEIGH_IN_KG)]);

    // Act
    const result = await syncZones(PROFILE_ID, transport, persistence);

    // Assert
    if (!result.ok) throw new Error("expected ok");
    expect(result.applied).toEqual([]);
    expect(result.conflicts).toEqual([
      { field: WEIGHT_FIELD, current: WEIGH_IN_KG, incoming: T2G_KG },
    ]);
  });

  it("should record an unknown weight as today's weigh-in, not on the profile", async () => {
    // Arrange
    const persistence = await seed();

    // Act
    const result = await syncZones(PROFILE_ID, transport, persistence);

    // Assert
    if (!result.ok) throw new Error("expected ok");
    expect(result.applied).toEqual([{ field: WEIGHT_FIELD, value: T2G_KG }]);
    const records = await allWeighIns(persistence);
    expect(records.map((r) => [r.date, r.krd.weightKilograms])).toEqual([
      [todayIsoDate(), T2G_KG],
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
});

describe("commitConflictResolution — an accepted weight is a weigh-in", () => {
  const decisions = { [WEIGHT_FIELD]: "accept" } as Record<
    FieldKey,
    ConflictDecision
  >;

  it("should update today's weigh-in once, however often it is committed", async () => {
    // Arrange
    const today = todayIsoDate();
    const persistence = await seed(PROFILE_KG, [weighIn(today, WEIGH_IN_KG)]);

    // Act
    await commitConflictResolution(PROFILE_ID, decisions, persistence, PAYLOAD);
    await commitConflictResolution(PROFILE_ID, decisions, persistence, PAYLOAD);

    // Assert
    const records = await allWeighIns(persistence);
    expect(records.map((r) => [r.date, r.krd.weightKilograms])).toEqual([
      [today, T2G_KG],
    ]);
    expect((await persistence.profiles.getById(PROFILE_ID))?.bodyWeight).toBe(
      PROFILE_KG
    );
  });

  it("should record nothing when the weight is rejected", async () => {
    // Arrange
    const persistence = await seed(PROFILE_KG, [
      weighIn(PAST_DAY, WEIGH_IN_KG),
    ]);
    const reject = { [WEIGHT_FIELD]: "reject" } as Record<
      FieldKey,
      ConflictDecision
    >;

    // Act
    await commitConflictResolution(PROFILE_ID, reject, persistence, PAYLOAD);

    // Assert
    const records = await allWeighIns(persistence);
    expect(records.map((r) => r.krd.weightKilograms)).toEqual([WEIGH_IN_KG]);
  });
});
