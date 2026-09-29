/**
 * AC-41 (follow the coach, end to end): the coach moves a session a
 * workout was already pushed for, the week syncs, and the next push moves
 * the Garmin entry — one entry, at the coach's new date.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import {
  createPlacementHarness,
  D1,
  D2,
} from "../../test-utils/placement-harness";
import {
  buildCoachingActivityId,
  type CoachingActivityRecord,
  namespaceSourceId,
} from "../../types/coaching-activity-record";
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

      // Act
      const result = await h.push(synced?.date ?? D1, pushes.at(-1));

      // Assert
      expect(synced?.date).toBe(D2);
      expect(result).toEqual({ kind: "moved" });
      expect(h.calendar.items.map((i) => i.date)).toEqual([D2]);
    }
  );
});
