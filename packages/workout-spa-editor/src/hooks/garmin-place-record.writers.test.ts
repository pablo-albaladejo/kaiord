/**
 * Two writers of the same workout, interleaved: a Garmin push stamping its
 * confirmed id (`placeRecord`) and a week sync following the coach's date
 * (`applyCoachDateMoves`). Each reads and writes inside the port's
 * transaction, which Dexie serializes; the lock below stands in for it and
 * holds the coach's write open until the push asks for the lock, so a
 * writer outside the transaction would clobber the other's fields.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { applyCoachDateMoves } from "../application/coaching/apply-coach-date-moves";
import { makeWorkoutRecord } from "../application/test-helpers";
import type { PersistencePort } from "../ports/persistence-port";
import { createInMemoryPersistence } from "../test-utils/in-memory-persistence";
import {
  createPlacementHarness,
  D1,
  D2,
} from "../test-utils/placement-harness";
import { createTransactionLock } from "../test-utils/transaction-lock";
import {
  buildCoachingActivityId,
  type CoachingActivityRecord,
  namespaceSourceId,
} from "../types/coaching-activity-record";
import type { KRD } from "../types/krd";
import { placeRecord, placeRecordResult } from "./garmin-place-record";

vi.mock("../utils/export-workout-formats", () => ({
  exportGcnWorkout: async () => ({}),
}));
vi.mock("../adapters/dexie/dexie-database", () => ({ db: {} }));
vi.mock("../adapters/dexie/dexie-integration-policy-repository", () => ({
  createDexieIntegrationPolicyRepository: () => ({}),
}));
vi.mock(
  "../application/integration-policy/resolve-export-policies.use-case",
  () => ({
    resolveExportPolicies: async () => [
      {
        id: "00000000-0000-0000-0000-000000000001",
        profileId: "p1",
        dataType: "workout",
        bridgeId: "garmin-bridge",
        direction: "export",
        mode: "manual",
        enabled: true,
        updatedAt: "2026-05-01T00:00:00.000Z",
      },
    ],
  })
);

const T0 = new Date("2026-10-01T08:00:00.000Z");
const PROFILE = "p1";
const SOURCE_ID = "77";
const GARMIN_ID = "1700000";

const activity = (date: string): CoachingActivityRecord => ({
  id: buildCoachingActivityId(PROFILE, "train2go", SOURCE_ID),
  profileId: PROFILE,
  source: "train2go",
  sourceId: SOURCE_ID,
  date,
  sport: "cycling",
  title: "Threshold",
  status: "pending",
  fetchedAt: T0.toISOString(),
});

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(T0);
});
afterEach(() => vi.useRealTimers());

describe("placeRecord and applyCoachDateMoves on the same workout", () => {
  it("should keep both the coach's date and the push stamp", async () => {
    // Arrange
    const lock = createTransactionLock();
    const persistence: PersistencePort = {
      ...createInMemoryPersistence(),
      transaction: lock.transaction,
    };
    await persistence.workouts.put(
      makeWorkoutRecord({
        id: "w-77",
        profileId: PROFILE,
        date: D1,
        coachDate: D1,
        sourceId: namespaceSourceId(PROFILE, SOURCE_ID),
        state: "ready",
        krd: {} as KRD,
      })
    );
    const h = createPlacementHarness();
    const pushWorkout = async () => ({
      success: true,
      garminWorkoutId: GARMIN_ID,
    });
    let placing: Promise<unknown> | undefined;
    const workouts = {
      ...persistence.workouts,
      getBySourceId: async (source: string, sourceId: string) => {
        const read = await persistence.workouts.getBySourceId(source, sourceId);
        placing = placeRecord(persistence, pushWorkout, "w-77", h.deps);
        await Promise.race([lock.contended, placing]);
        return read;
      },
    };

    // Act
    await applyCoachDateMoves(
      { workouts, now: () => T0.toISOString(), transaction: lock.transaction },
      [activity(D2)],
      []
    );
    await placing;

    // Assert
    expect(await persistence.workouts.getById("w-77")).toMatchObject({
      date: D2,
      coachDate: D2,
      state: "pushed",
      garminPushId: GARMIN_ID,
    });
  });
});

describe("placeRecord on a workout deleted during its push", () => {
  it("should not recreate the workout to stamp the push", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await persistence.workouts.put(
      makeWorkoutRecord({ id: "w-9", profileId: PROFILE, krd: {} as KRD })
    );
    const pushWorkout = async () => {
      await persistence.workouts.delete("w-9");
      return { success: true, garminWorkoutId: GARMIN_ID };
    };

    // Act
    await placeRecord(
      persistence,
      pushWorkout,
      "w-9",
      createPlacementHarness().deps
    );

    // Assert
    expect(await persistence.workouts.getById("w-9")).toBeUndefined();
  });
});

describe("placeRecord on a workout moved after the week was selected", () => {
  it("should return the date it placed, the record's date at its turn", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await persistence.workouts.put(
      makeWorkoutRecord({
        id: "w-5",
        profileId: PROFILE,
        date: D2,
        krd: {} as KRD,
      })
    );
    const h = createPlacementHarness();
    const pushWorkout = async () => ({
      success: true,
      garminWorkoutId: GARMIN_ID,
    });

    // Act
    const item = await placeRecordResult(
      persistence,
      pushWorkout,
      "w-5",
      h.deps
    );

    // Assert
    expect(item).toEqual({ result: { kind: "scheduled" }, date: D2 });
    expect(h.calendar.items.map((i) => i.date)).toEqual([D2]);
  });
});
