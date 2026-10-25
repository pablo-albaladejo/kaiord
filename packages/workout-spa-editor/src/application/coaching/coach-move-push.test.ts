/**
 * AC-41 (follow the coach, end to end): the coach moves a session a
 * workout was already pushed for, the week syncs, and the next push moves
 * the Garmin entry — one entry, at the coach's new date.
 *
 * AC-19/AC-20 (the athlete's move): a move never touches Garmin; the drift
 * names the day Garmin still holds until Update Garmin moves the entry.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import {
  createPlacementHarness,
  D1,
  D2,
  RECORD_ID,
} from "../../test-utils/placement-harness";
import {
  buildCoachingActivityId,
  type CoachingActivityRecord,
  namespaceSourceId,
} from "../../types/coaching-activity-record";
import { garminDateDrift } from "../garmin-placement/garmin-date-drift";
import { moveSession } from "../move-session";
import { makeWorkoutRecord } from "../test-helpers";
import { persistSyncedWeek } from "./sync-week-persist";

const T0 = new Date("2026-10-01T08:00:00.000Z");
const PROFILE = "p1";
const SOURCE_ID = "77";

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

describe("follow the coach — end to end", () => {
  it.each([
    { path: "C", pushes: ["v1"] },
    { path: "U", pushes: ["v1", "v2"] },
  ])(
    "should move the Garmin entry to the coach's new date [$path]",
    async ({ pushes }) => {
      // Arrange
      const h = createPlacementHarness();
      const port = createInMemoryPersistence();
      const workout = makeWorkoutRecord({
        id: "w-77",
        profileId: PROFILE,
        date: D1,
        coachDate: D1,
        sourceId: namespaceSourceId(PROFILE, SOURCE_ID),
        state: "pushed",
      });
      await port.workouts.put(workout);
      for (const content of pushes) await h.push(workout.date, content);
      await persistSyncedWeek(
        { ...port, now: () => T0.toISOString() },
        {
          profileId: PROFILE,
          source: "train2go",
          fetched: [activity(D2)],
          localSameSource: [activity(D1)],
        }
      );
      const synced = await port.workouts.getById(workout.id);
      const afterSync = h.calendar.items.map((i) => i.date);

      // Act
      const result = await h.push(synced?.date ?? D1, pushes.at(-1));

      // Assert
      expect(synced?.date).toBe(D2);
      expect(afterSync).toEqual([D1]);
      expect(result).toEqual({ kind: "moved" });
      expect(h.calendar.items.map((i) => i.date)).toEqual([D2]);
    }
  );
});

describe("the athlete's move — end to end", () => {
  it.each([
    { path: "C", pushes: ["v1"] },
    { path: "U", pushes: ["v1", "v2"] },
  ])(
    "should leave Garmin alone on the move and move it on Update Garmin [$path]",
    async ({ pushes }) => {
      // Arrange
      const h = createPlacementHarness();
      const port = createInMemoryPersistence();
      await port.workouts.put(
        makeWorkoutRecord({ id: RECORD_ID, profileId: PROFILE, date: D1 })
      );
      for (const content of pushes) await h.push(D1, content);
      await moveSession(
        { ...port, now: () => T0.toISOString() },
        { workoutId: RECORD_ID, targetDay: D2 }
      );
      const moved = await port.workouts.getById(RECORD_ID);
      const before = { items: h.calendar.items.map((i) => i.date) };
      const driftBefore = garminDateDrift(
        await h.row(),
        moved ?? { date: D1 },
        {
          locked: false,
        }
      );

      // Act
      const result = await h.push(moved?.date ?? D1, pushes.at(-1));

      // Assert
      expect(before.items).toEqual([D1]);
      expect(driftBefore).toEqual({ placedOn: D1, certainty: "placed" });
      expect(result).toEqual({ kind: "moved" });
      expect(h.calendar.items.map((i) => i.date)).toEqual([D2]);
      expect(
        garminDateDrift(await h.row(), { date: D2 }, { locked: false })
      ).toBeUndefined();
    }
  );
});
