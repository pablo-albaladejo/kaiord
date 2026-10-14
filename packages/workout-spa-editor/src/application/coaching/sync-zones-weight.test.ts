/**
 * Train2Go's weight is the athlete's current weight (audit P-03, #1403): the
 * sync reads it through `getCurrentWeightKg` and records an incoming value as
 * today's weigh-in, never as `profile.bodyWeight`.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import type { LinkedCoachingAccount } from "../../types/coaching-account";
import type { ConflictDecision, FieldKey } from "../../types/coaching-zones";
import type { HealthWeightRecord } from "../../types/health/health-records";
import type { Profile } from "../../types/profile";
import { todayIsoDate } from "../../utils/today-iso-date";
import {
  getCurrentWeightKg,
  loadLatestWeighIn,
} from "../health/current-weight";
import { saveManualHealthMetric } from "../health/save-manual-health-metric.use-case";
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
const MANUAL = "manual";
const TRAIN2GO_BRIDGE = "train2go-bridge";
// A fixed clock: the weigh-in's day and time never depend on when CI runs.
const SYNC_AT = "2026-10-14T09:00:00.000Z";
const LATER = "2026-10-14T10:00:00.000Z";

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

  it("should compare against profile.bodyWeight when there is no weigh-in", async () => {
    // Arrange
    const persistence = await seed(PROFILE_KG);

    // Act
    const result = await syncZones(PROFILE_ID, transport, persistence);

    // Assert
    if (!result.ok) throw new Error("expected ok");
    expect(result.applied).toEqual([]);
    expect(result.conflicts).toEqual([
      { field: WEIGHT_FIELD, current: PROFILE_KG, incoming: T2G_KG },
    ]);
    expect(await allWeighIns(persistence)).toEqual([]);
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
    expect(
      records.map((r) => [r.date, r.krd.weightKilograms, r.sourceBridgeId])
    ).toEqual([[todayIsoDate(), T2G_KG, TRAIN2GO_BRIDGE]]);
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

  it("should keep today's manual weigh-in and add one Train2Go weigh-in, however often it is committed", async () => {
    // Arrange
    const today = todayIsoDate();
    const persistence = await seed(PROFILE_KG, [weighIn(today, WEIGH_IN_KG)]);

    // Act
    await commitConflictResolution(PROFILE_ID, decisions, persistence, PAYLOAD);
    await commitConflictResolution(PROFILE_ID, decisions, persistence, PAYLOAD);

    // Assert
    const bySource = (await allWeighIns(persistence))
      .map((r) => [r.sourceBridgeId, r.date, r.krd.weightKilograms])
      .sort();
    expect(bySource).toEqual([
      [MANUAL, today, WEIGH_IN_KG],
      [TRAIN2GO_BRIDGE, today, T2G_KG],
    ]);
    expect((await persistence.profiles.getById(PROFILE_ID))?.bodyWeight).toBe(
      PROFILE_KG
    );
  });

  it("should make an accepted weight the current weight over an earlier manual weigh-in", async () => {
    // Arrange
    // Manual row first, then Train2Go's (minted with a real UUID).
    const persistence = await seed(PROFILE_KG, [
      weighIn(todayIsoDate(), WEIGH_IN_KG),
    ]);

    // Act
    await commitConflictResolution(PROFILE_ID, decisions, persistence, PAYLOAD);

    // Assert
    expect(await currentWeight(persistence)).toBe(T2G_KG);
  });

  it("should make an accepted weight current when Train2Go's row was stored first", async () => {
    // Arrange
    // Train2Go's earlier row of the day comes first, the manual one after.
    const today = todayIsoDate();
    const persistence = await seed(undefined, [
      weighIn(today, PROFILE_KG, TRAIN2GO_BRIDGE),
      weighIn(today, WEIGH_IN_KG),
    ]);

    // Act
    await commitConflictResolution(PROFILE_ID, decisions, persistence, PAYLOAD);

    // Assert
    expect(await currentWeight(persistence)).toBe(T2G_KG);
  });

  it("should let a later manual edit win over the Train2Go weigh-in", async () => {
    // Arrange
    const persistence = await seed();
    await commitConflictResolution(PROFILE_ID, decisions, persistence, PAYLOAD);
    vi.setSystemTime(new Date(LATER));

    // Act
    await saveManualHealthMetric(
      { persistence, profileId: PROFILE_ID },
      { metric: "weight", day: todayIsoDate(), value: WEIGH_IN_KG }
    );

    // Assert
    expect(await currentWeight(persistence)).toBe(WEIGH_IN_KG);
  });

  it("should update the Train2Go weigh-in of the day when Train2Go's weight changes", async () => {
    // Arrange
    const today = todayIsoDate();
    const persistence = await seed(undefined, [
      weighIn(today, WEIGH_IN_KG, TRAIN2GO_BRIDGE),
    ]);

    // Act
    await commitConflictResolution(PROFILE_ID, decisions, persistence, PAYLOAD);

    // Assert
    const records = await allWeighIns(persistence);
    expect(
      records.map((r) => [r.id, r.sourceBridgeId, r.krd.weightKilograms])
    ).toEqual([[`w-${TRAIN2GO_BRIDGE}-${today}`, TRAIN2GO_BRIDGE, T2G_KG]]);
  });

  it("should not raise the conflict again once Train2Go's weight is recorded", async () => {
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
