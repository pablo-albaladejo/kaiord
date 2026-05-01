import { describe, expect, it } from "vitest";

import { createInMemorySessionMatchRepository } from "../test-utils/in-memory-session-match-repository";
import type { CoachingActivityRecord } from "../types/coaching-activity-record";
import type { CoachingRepository } from "../ports/persistence-port";
import type { SessionMatch } from "../types/session-match";
import type { SessionMatchRepository } from "../ports/session-match-repository";
import type { WorkoutRecord } from "../types/calendar-record";
import type { WorkoutRepository } from "../ports/persistence-port";
import { autoMatchSessions } from "./auto-match-sessions";

const a = (
  overrides: Partial<CoachingActivityRecord> = {}
): CoachingActivityRecord => ({
  id: overrides.id ?? "a-1",
  profileId: overrides.profileId ?? "p1",
  source: overrides.source ?? "train2go",
  sourceId: overrides.sourceId ?? "1",
  date: overrides.date ?? "2026-04-29",
  sport: overrides.sport ?? "swim",
  title: overrides.title ?? "Swim 45m",
  status: overrides.status ?? "pending",
  fetchedAt: "2026-04-28T10:00:00.000Z",
  duration: overrides.duration,
  ...overrides,
});

const w = (overrides: Partial<WorkoutRecord> = {}): WorkoutRecord => ({
  id: overrides.id ?? "w-1",
  date: overrides.date ?? "2026-04-29",
  state: overrides.state ?? "ready",
  source: overrides.source ?? "manual",
  sport: overrides.sport ?? "swim",
  raw: overrides.raw,
  ...overrides,
});

const stubCoachingRepo = (
  rows: CoachingActivityRecord[]
): CoachingRepository => {
  const map = new Map(rows.map((r) => [r.id, r]));
  return {
    getById: async (id) => map.get(id),
    getByProfileAndDateRange: async (profileId, start, end) =>
      [...map.values()].filter(
        (r) => r.profileId === profileId && r.date >= start && r.date <= end
      ),
    getByProfileAndSourceId: async () => undefined,
    upsertMany: async () => undefined,
    put: async () => undefined,
    delete: async () => undefined,
    deleteByProfile: async () => undefined,
  };
};

const stubWorkoutRepo = (rows: WorkoutRecord[]): WorkoutRepository => {
  const map = new Map(rows.map((r) => [r.id, r]));
  return {
    getById: async (id) => map.get(id),
    getByDateRange: async (start, end) =>
      [...map.values()].filter((r) => r.date >= start && r.date <= end),
    getByState: async () => [],
    getBySourceId: async () => undefined,
    put: async () => undefined,
    delete: async () => undefined,
  };
};

const noWriteRepo = (): SessionMatchRepository =>
  createInMemorySessionMatchRepository();

describe("autoMatchSessions", () => {
  it("returns one obvious pair (same day, same family, ≤20% duration variance)", async () => {
    const result = await autoMatchSessions(
      { profileId: "p1", weekStart: "2026-04-27" },
      {
        coachingRepository: stubCoachingRepo([
          a({ id: "a1", duration: "45 min" }),
        ]),
        workoutRepository: stubWorkoutRepo([
          w({ id: "w1", raw: { duration: { value: 2580, unit: "s" } } }),
        ]),
        repository: noWriteRepo(),
      }
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      activityId: "a1",
      workoutId: "w1",
    });
    expect(result[0]!.score!).toBeGreaterThanOrEqual(0.9);
    expect(result[0]!.reasons[0]).toEqual({
      code: "sport-family-match",
      family: "swimming",
    });
  });

  it("returns no suggestions for cross-sport pairs (same day)", async () => {
    const result = await autoMatchSessions(
      { profileId: "p1", weekStart: "2026-04-27" },
      {
        coachingRepository: stubCoachingRepo([
          a({ id: "a-yoga", sport: "yoga", duration: "45 min" }),
        ]),
        workoutRepository: stubWorkoutRepo([
          w({
            id: "w-kayak",
            sport: "kayaking",
            raw: { duration: { value: 2700, unit: "s" } },
          }),
        ]),
        repository: noWriteRepo(),
      }
    );

    expect(result).toEqual([]);
  });

  it("filters out below-threshold scores (>20% variance)", async () => {
    const result = await autoMatchSessions(
      { profileId: "p1", weekStart: "2026-04-27" },
      {
        coachingRepository: stubCoachingRepo([
          a({ id: "a-run", sport: "run", duration: "60 min" }),
        ]),
        workoutRepository: stubWorkoutRepo([
          w({
            id: "w-run",
            sport: "run",
            raw: { duration: { value: 1200, unit: "s" } }, // 20min — score 0.33
          }),
        ]),
        repository: noWriteRepo(),
      }
    );

    expect(result).toEqual([]);
  });

  it("preserves null-score (duration-unknown) suggestions through the filter", async () => {
    const result = await autoMatchSessions(
      { profileId: "p1", weekStart: "2026-04-27" },
      {
        coachingRepository: stubCoachingRepo([
          a({ id: "a-no-dur", duration: undefined }),
        ]),
        workoutRepository: stubWorkoutRepo([
          w({ id: "w-some", raw: { duration: { value: 2700, unit: "s" } } }),
        ]),
        repository: noWriteRepo(),
      }
    );

    expect(result).toHaveLength(1);
    expect(result[0]!.score).toBeNull();
    expect(result[0]!.reasons.some((r) => r.code === "duration-unknown")).toBe(
      true
    );
  });

  it("greedy assignment with deterministic tiebreaker (lower activityId, then workoutId)", async () => {
    const result = await autoMatchSessions(
      { profileId: "p1", weekStart: "2026-04-27" },
      {
        coachingRepository: stubCoachingRepo([
          a({ id: "a-A", sport: "swim", duration: "45 min" }),
          a({ id: "a-B", sport: "bike", duration: "60 min", sourceId: "2" }),
        ]),
        workoutRepository: stubWorkoutRepo([
          w({
            id: "w-A",
            sport: "swim",
            raw: { duration: { value: 2700, unit: "s" } },
          }),
          w({
            id: "w-B",
            sport: "bike",
            raw: { duration: { value: 3600, unit: "s" } },
          }),
        ]),
        repository: noWriteRepo(),
      }
    );

    expect(result.map((r) => r.activityId).sort()).toEqual(["a-A", "a-B"]);
    // No overlapping pairings.
    const ids = result.map((r) => `${r.activityId}|${r.workoutId}`).sort();
    expect(ids).toEqual(["a-A|w-A", "a-B|w-B"]);
  });

  it("skips already-matched activities and workouts in the current profile", async () => {
    const repo = createInMemorySessionMatchRepository();
    const existing: SessionMatch = {
      id: "M-existing",
      profileId: "p1",
      coachingActivityId: "a-1",
      workoutId: "w-other",
      date: "2026-04-29",
      createdAt: "2026-04-30T10:00:00.000Z",
      source: "manual",
    };
    await repo.put(existing);

    const result = await autoMatchSessions(
      { profileId: "p1", weekStart: "2026-04-27" },
      {
        coachingRepository: stubCoachingRepo([
          a({ id: "a-1", duration: "45 min" }),
        ]),
        workoutRepository: stubWorkoutRepo([
          w({ id: "w-1", raw: { duration: { value: 2580, unit: "s" } } }),
        ]),
        repository: repo,
      }
    );

    expect(result.find((r) => r.activityId === "a-1")).toBeUndefined();
  });

  it("does NOT write any SessionMatch row (read-only)", async () => {
    const repo = createInMemorySessionMatchRepository();

    await autoMatchSessions(
      { profileId: "p1", weekStart: "2026-04-27" },
      {
        coachingRepository: stubCoachingRepo([a()]),
        workoutRepository: stubWorkoutRepo([w()]),
        repository: repo,
      }
    );

    expect(
      await repo.listByProfileAndWeek("p1", "2026-04-27", "2026-05-03")
    ).toEqual([]);
  });

  it("is deterministic — same inputs produce same outputs", async () => {
    const inputs = {
      coaching: [a({ id: "a-1", duration: "45 min" })],
      workouts: [
        w({ id: "w-1", raw: { duration: { value: 2580, unit: "s" } } }),
      ],
    };

    const r1 = await autoMatchSessions(
      { profileId: "p1", weekStart: "2026-04-27" },
      {
        coachingRepository: stubCoachingRepo(inputs.coaching),
        workoutRepository: stubWorkoutRepo(inputs.workouts),
        repository: noWriteRepo(),
      }
    );
    const r2 = await autoMatchSessions(
      { profileId: "p1", weekStart: "2026-04-27" },
      {
        coachingRepository: stubCoachingRepo(inputs.coaching),
        workoutRepository: stubWorkoutRepo(inputs.workouts),
        repository: noWriteRepo(),
      }
    );

    expect(r1).toEqual(r2);
  });
});
