/* eslint-disable no-magic-numbers -- a steps table is literal durations, watts and bpm, clearer inline */
import { describe, expect, it, vi } from "vitest";

import { createInMemoryAthleteNoteRepository } from "../../test-utils/in-memory-athlete-note-repository";
import { createInMemorySessionMatchRepository } from "../../test-utils/in-memory-session-match-repository";
import type { WorkoutRecord } from "../../types/calendar-record";
import type { CoachingActivityRecord } from "../../types/coaching-activity-record";
import type { CoachingStepGroup } from "../../types/coaching-structured-steps";
import { getStructuredWorkout } from "../../utils/structured-workout";
import {
  convertCoachingActivityWithAi,
  type ConvertWithAiDeps,
} from "./convert-coaching-activity-with-ai";
import {
  buildStubAnalytics,
  buildStubCoachingRepo,
  buildStubWorkoutRepo,
  fakeAiMeta,
  fakeKrd,
  passThroughTransaction,
  stubActivity,
} from "./convert-coaching-activity-with-ai.test-helpers";
import { createReadStepsTable } from "./read-steps-table";

// Synthetic table: invented zones, not an athlete's.
const row = (durationSeconds: number, zone: string) => ({
  durationSeconds,
  zone,
  powerWatts: { min: 100, max: 140 },
  heartRateBpm: { min: 110, max: 125 },
});
const TABLE: CoachingStepGroup[] = [
  { repeat: 1, steps: [row(600, "R0")] },
  { repeat: 4, steps: [row(120, "R1"), row(60, "R0")] },
  { repeat: 1, steps: [row(300, "R0")] },
];
const TABLE_SECONDS = 600 + 4 * 180 + 300;

const NOW = "2026-11-25T10:00:00.000Z";

const setup = (activity: CoachingActivityRecord, existing?: WorkoutRecord) => {
  const workouts = buildStubWorkoutRepo(existing ? [existing] : []);
  workouts.setSourceLookup(existing);
  const deps: ConvertWithAiDeps = {
    coaching: buildStubCoachingRepo([activity]),
    workouts,
    sessionMatches: createInMemorySessionMatchRepository(),
    athleteNotes: createInMemoryAthleteNoteRepository(),
    transaction: passThroughTransaction,
    analytics: buildStubAnalytics(),
    generateKrd: vi.fn().mockResolvedValue({
      krd: fakeKrd(),
      aiMeta: fakeAiMeta(),
    }),
    readStepsTable: createReadStepsTable(() => NOW),
    newWorkoutId: () => "w-new",
    newMatchId: () => "M-new",
    clock: () => NOW,
  };
  return deps;
};

const convert = async (
  deps: ConvertWithAiDeps,
  activityId: string,
  regenerate?: boolean
) => {
  const result = await convertCoachingActivityWithAi(
    { activityId, regenerate },
    deps
  );
  if (!result.ok) throw new Error(result.reason);
  const stored = await deps.workouts.getById(result.workoutId);
  return { stored, workout: stored?.krd && getStructuredWorkout(stored.krd) };
};

type Timed = { duration?: { seconds: number } };
type Block = { repeatCount?: number; steps?: Timed[] };
const totalSeconds = (steps: unknown[]): number =>
  (steps as (Timed & Block)[]).reduce(
    (t, s) =>
      t +
      (s.repeatCount
        ? s.repeatCount * totalSeconds(s.steps ?? [])
        : (s.duration?.seconds ?? 0)),
    0
  );

describe("convertCoachingActivityWithAi with a steps table", () => {
  it("should build the workout from the table without calling the AI", async () => {
    // Arrange
    const activity = stubActivity({ structuredSteps: TABLE });
    const deps = setup(activity);

    // Act
    const { stored, workout } = await convert(deps, activity.id);

    // Assert
    expect(deps.generateKrd).not.toHaveBeenCalled();
    expect(stored?.state).toBe("structured");
    expect(stored?.aiMeta).toBeNull();
    expect(workout?.steps).toHaveLength(3);
    expect(totalSeconds(workout?.steps ?? [])).toBe(TABLE_SECONDS);
    expect(workout?.name).toBe(activity.title);
    expect(workout?.notes).toBe(activity.description);
  });

  it("should use the AI as before when the session has no table", async () => {
    // Arrange
    const activity = stubActivity();
    const deps = setup(activity);

    // Act
    const { stored } = await convert(deps, activity.id);

    // Assert
    expect(deps.generateKrd).toHaveBeenCalledOnce();
    expect(stored?.aiMeta).toStrictEqual(fakeAiMeta());
  });

  it("should use the AI when the table cannot become a workout", async () => {
    // Arrange
    // a rest day has no workout to build from a table.
    const activity = stubActivity({ sport: "rest", structuredSteps: TABLE });
    const deps = setup(activity);

    // Act
    await convert(deps, activity.id);

    // Assert
    expect(deps.generateKrd).toHaveBeenCalledOnce();
  });

  it("should structure a raw workout from the table without calling the AI", async () => {
    // Arrange
    const activity = stubActivity({ structuredSteps: TABLE });
    const existingRaw = {
      id: "w-raw",
      profileId: "p1",
      date: activity.date,
      sport: activity.sport,
      source: activity.source,
      state: "raw",
      raw: { description: activity.description, duration: null },
      krd: null,
      aiMeta: null,
    } as unknown as WorkoutRecord;
    const deps = setup(activity, existingRaw);

    // Act
    const { stored, workout } = await convert(deps, activity.id);

    // Assert
    expect(deps.generateKrd).not.toHaveBeenCalled();
    expect(stored?.state).toBe("structured");
    expect(totalSeconds(workout?.steps ?? [])).toBe(TABLE_SECONDS);
  });

  it("should give the AI the table, the coach's text and the Athlete note", async () => {
    // Arrange
    const activity = stubActivity({ structuredSteps: TABLE });
    const athleteNotes = createInMemoryAthleteNoteRepository();
    await athleteNotes.put({
      id: activity.id,
      profileId: activity.profileId,
      text: "skip the last block",
      updatedAt: NOW,
    });
    const deps = { ...setup(activity), athleteNotes };

    // Act
    await convert(deps, activity.id);

    // Assert
    expect(deps.generateKrd).toHaveBeenCalledOnce();
    const { text } = vi.mocked(deps.generateKrd).mock.calls[0][0];
    expect(text).toContain(activity.description);
    expect(text).toContain("4 ×\n  120 s R1, 100-140 W, HR 110-125 bpm");
    expect(text).toContain("skip the last block");
  });

  it("should regenerate from the table without calling the AI", async () => {
    // Arrange
    const activity = stubActivity({ structuredSteps: TABLE });
    const built = {
      id: "w-built",
      profileId: "p1",
      date: activity.date,
      sport: activity.sport,
      source: activity.source,
      state: "ready",
      krd: fakeKrd(),
      aiMeta: fakeAiMeta(),
    } as unknown as WorkoutRecord;
    const deps = setup(activity, built);

    // Act
    const { stored, workout } = await convert(deps, activity.id, true);

    // Assert
    expect(deps.generateKrd).not.toHaveBeenCalled();
    expect(stored?.aiMeta).toBeNull();
    expect(totalSeconds(workout?.steps ?? [])).toBe(TABLE_SECONDS);
  });

  it("should give the AI the table when its values cannot become a workout", async () => {
    // Arrange
    // 9000 W is out of the KRD's power range: the table parses, the build fails.
    const tooStrong: CoachingStepGroup[] = [
      {
        repeat: 1,
        steps: [{ ...row(60, "R9"), powerWatts: { min: 100, max: 9000 } }],
      },
    ];
    const activity = stubActivity({ structuredSteps: tooStrong });
    const athleteNotes = createInMemoryAthleteNoteRepository();
    await athleteNotes.put({
      id: activity.id,
      profileId: activity.profileId,
      text: "easier please",
      updatedAt: NOW,
    });
    const deps = { ...setup(activity), athleteNotes };

    // Act
    await convert(deps, activity.id);

    // Assert
    expect(deps.generateKrd).toHaveBeenCalledOnce();
    const { text } = vi.mocked(deps.generateKrd).mock.calls[0][0];
    expect(text).toContain("Steps table:\n60 s R9, 100-9000 W, HR 110-125 bpm");
  });
});
