/**
 * The athlete's calendar drag (`rescheduleWorkout`) against the two other
 * writers of a workout's row: a week sync following the coach's date and a
 * Garmin push stamping its id. Each other writer starts between the drag's
 * read and its write; the lock stands in for Dexie's serialized
 * transactions, so a drag outside the transaction rolls their fields back.
 */
import { describe, expect, it } from "vitest";

import type { WorkoutRepository } from "../ports/persistence-port";
import { createInMemoryPersistence } from "../test-utils/in-memory-persistence";
import { createTransactionLock } from "../test-utils/transaction-lock";
import {
  buildCoachingActivityId,
  type CoachingActivityRecord,
  namespaceSourceId,
} from "../types/coaching-activity-record";
import type { KRD } from "../types/krd";
import { applyCoachDateMoves } from "./coaching/apply-coach-date-moves";
import { recordGarminPush } from "./record-garmin-push";
import { rescheduleWorkout } from "./reschedule-workout";
import { makeWorkoutRecord } from "./test-helpers";

const PROFILE = "p1";
const SOURCE_ID = "77";
const GARMIN_ID = "1700000";
const NOW = "2026-10-01T08:00:00.000Z";
const [D1, D2, D3] = ["2026-10-05", "2026-10-06", "2026-10-07"];

const activity = (date: string): CoachingActivityRecord => ({
  id: buildCoachingActivityId(PROFILE, "train2go", SOURCE_ID),
  profileId: PROFILE,
  source: "train2go",
  sourceId: SOURCE_ID,
  date,
  sport: "cycling",
  title: "Threshold",
  status: "pending",
  fetchedAt: NOW,
});

/** Seeds the workout and runs `other` between the drag's read and write. */
const setup = async (other: (s: Setup) => Promise<unknown>) => {
  const lock = createTransactionLock();
  const persistence = createInMemoryPersistence();
  const s = { persistence, lock };
  await persistence.workouts.put(
    makeWorkoutRecord({
      id: "w",
      profileId: PROFILE,
      date: D1,
      coachDate: D1,
      source: "train2go",
      sourceId: namespaceSourceId(PROFILE, SOURCE_ID),
      state: "ready",
      krd: {} as KRD,
    })
  );
  let racing: Promise<unknown> | undefined;
  const workouts: WorkoutRepository = {
    ...persistence.workouts,
    getById: async (id) => {
      const read = await persistence.workouts.getById(id);
      racing = other(s);
      await Promise.race([lock.contended, racing]);
      return read;
    },
  };
  const drag = async () => {
    await rescheduleWorkout(
      { workouts, transaction: lock.transaction },
      "w",
      D3
    );
    await racing;
  };
  return { ...s, drag };
};
type Setup = {
  persistence: ReturnType<typeof createInMemoryPersistence>;
  lock: ReturnType<typeof createTransactionLock>;
};

const sync = ({ persistence, lock }: Setup, date: string) =>
  applyCoachDateMoves(
    {
      workouts: persistence.workouts,
      now: () => NOW,
      transaction: lock.transaction,
    },
    [activity(date)],
    []
  );

describe("rescheduleWorkout racing another writer", () => {
  it("should keep the coach's date so the next sync reports no override", async () => {
    // Arrange
    const s = await setup((setup) => sync(setup, D2));

    // Act
    await s.drag();
    const next = await sync(s, D2);

    // Assert
    expect(next).toEqual({ coachMoves: 0, overriddenLocalMoves: 0 });
    expect(await s.persistence.workouts.getById("w")).toMatchObject({
      coachDate: D2,
    });
  });

  it("should keep the push stamp and the dragged date", async () => {
    // Arrange
    const s = await setup(({ persistence, lock }) =>
      lock.transaction(async () => {
        const fresh = await persistence.workouts.getById("w");
        if (fresh)
          await persistence.workouts.put(recordGarminPush(fresh, GARMIN_ID));
      })
    );

    // Act
    await s.drag();

    // Assert
    expect(await s.persistence.workouts.getById("w")).toMatchObject({
      date: D3,
      state: "pushed",
      garminPushId: GARMIN_ID,
    });
  });
});
