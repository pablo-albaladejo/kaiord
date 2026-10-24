/**
 * The executed auto-link dedups across matches (design §3.7, AC-8): a
 * recording held by one match, or claimed earlier in the same pass, is never
 * appended to a second match.
 */
import { describe, expect, it } from "vitest";

import type { ActivityRecord } from "../../types/activity-record";
import type { WorkoutRecord } from "../../types/calendar-record";
import type { SessionMatch } from "../../types/session-match";
import { matchExecutedWorkouts } from "./match-executed-workouts";

const TUE = "2026-10-06";
const THU = "2026-10-08";

const match = (id: string, overrides: Partial<SessionMatch> = {}) =>
  ({
    id,
    profileId: "p1",
    coachingActivityId: `p1:train2go:${id}`,
    workoutId: `w-${id}`,
    date: THU,
    createdAt: "2026-10-01T08:00:00.000Z",
    source: "auto-coaching",
    executedWorkoutIds: [],
    ...overrides,
  }) as SessionMatch;

const planned = (id: string) =>
  ({ id, date: THU, sport: "cycling", state: "ready" }) as WorkoutRecord;

const recording = (id: string) =>
  ({
    id,
    profileId: "p1",
    date: THU,
    sport: "cycling",
    linkedWorkoutId: null,
  }) as ActivityRecord;

const run = (sessionMatches: SessionMatch[]) =>
  matchExecutedWorkouts({
    sessionMatches,
    workouts: sessionMatches.map((m) => planned(m.workoutId)),
    activities: [recording("rec")],
    canonicalSport: (sport) => sport || null,
  });

describe("matchExecutedWorkouts across matches", () => {
  it("should link a recording on the moved day to the moved match", () => {
    // Arrange
    const moved = match("a");

    // Act
    const result = run([moved]);

    // Assert
    expect(result).toEqual([{ matchId: "a", toAppend: ["rec"] }]);
  });

  it("should not link a recording another match already holds", () => {
    // Arrange
    const holder = match("a", { date: TUE, executedWorkoutIds: ["rec"] });
    const moved = match("b");

    // Act
    const result = run([holder, moved]);

    // Assert
    expect(result).toEqual([]);
  });

  it("should link a recording to only the first match that claims it in one pass", () => {
    // Arrange
    const first = match("a");
    const second = match("b");

    // Act
    const result = run([first, second]);

    // Assert
    expect(result).toEqual([{ matchId: "a", toAppend: ["rec"] }]);
  });
});
