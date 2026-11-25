/**
 * Regenerate (owner decision 2, #1685): an explicit, billed rebuild of an
 * AI-built Workout, replaced in place (same Match, same Day). The builder is
 * chosen in one place: a steps table and no Athlete note re-reads the table
 * without the AI; otherwise the AI gets the coach's text and the note.
 */
import { describe, expect, it, vi } from "vitest";

import {
  ACTIVITY_ID,
  coachActivity,
  NOW,
  seedSession,
  TUE,
} from "../session-move.test-fixtures";
import {
  convertCoachingActivityWithAi,
  type ConvertWithAiDeps,
} from "./convert-coaching-activity-with-ai";
import {
  buildStubAnalytics,
  fakeAiMeta,
  fakeKrd,
} from "./convert-coaching-activity-with-ai.test-helpers";

type Persistence = Awaited<ReturnType<typeof seedSession>>;

const COACH_TEXT = "3x10 min Z3, single-leg drills";
const NOTE = "on the trainer, skip the single-leg part";

const depsOf = (
  persistence: Persistence,
  overrides: Partial<ConvertWithAiDeps> = {}
): ConvertWithAiDeps => ({
  coaching: persistence.coaching,
  workouts: persistence.workouts,
  sessionMatches: persistence.sessionMatch,
  athleteNotes: persistence.athleteNotes,
  transaction: persistence.transaction,
  analytics: buildStubAnalytics(),
  generateKrd: vi
    .fn()
    .mockResolvedValue({ krd: fakeKrd(), aiMeta: fakeAiMeta() }),
  newWorkoutId: () => "w-new",
  newMatchId: () => "m-new",
  clock: () => NOW,
  ...overrides,
});

const seedBuilt = (workout = {}) =>
  seedSession({
    activity: { description: COACH_TEXT },
    workout: { state: "ready", aiMeta: fakeAiMeta(), ...workout },
  });

const regenerate = (deps: ConvertWithAiDeps) =>
  convertCoachingActivityWithAi(
    { activityId: ACTIVITY_ID, regenerate: true },
    deps
  );

const writeNote = (persistence: Persistence, text: string) =>
  persistence.athleteNotes.put({
    id: ACTIVITY_ID,
    profileId: "p1",
    text,
    updatedAt: NOW,
  });

describe("convertCoachingActivityWithAi with regenerate", () => {
  it("should replace the Workout in place, keeping its id, Match and Day", async () => {
    // Arrange
    const persistence = await seedBuilt();
    const deps = depsOf(persistence);

    // Act
    const result = await regenerate(deps);

    // Assert
    expect(result).toEqual({ ok: true, workoutId: "w", created: false });
    expect(deps.generateKrd).toHaveBeenCalledTimes(1);
    const stored = await persistence.workouts.getById("w");
    expect(stored?.state).toBe("structured");
    expect(stored?.date).toBe(TUE);
    expect(stored?.krd?.extensions?.structured_workout).toBeDefined();
    const match = await persistence.sessionMatch.getByActivityId(
      "p1",
      ACTIVITY_ID
    );
    expect(match?.id).toBe("m");
    expect(match?.workoutId).toBe("w");
  });

  it("should not call the AI on a plain re-click without regenerate", async () => {
    // Arrange
    const persistence = await seedBuilt();
    const deps = depsOf(persistence);

    // Act
    await convertCoachingActivityWithAi({ activityId: ACTIVITY_ID }, deps);

    // Assert
    expect(deps.generateKrd).not.toHaveBeenCalled();
  });

  it("should send the Athlete note with the coach's text", async () => {
    // Arrange
    const persistence = await seedBuilt();
    await writeNote(persistence, NOTE);
    const deps = depsOf(persistence);

    // Act
    await regenerate(deps);

    // Assert
    const { text } = vi.mocked(deps.generateKrd).mock.calls[0][0];
    expect(text).toContain(COACH_TEXT);
    expect(text).toContain(NOTE);
  });

  it("should leave a cleared note out of the AI's text", async () => {
    // Arrange
    const persistence = await seedBuilt();
    await writeNote(persistence, "   ");
    const deps = depsOf(persistence);

    // Act
    await regenerate(deps);

    // Assert
    const { text } = vi.mocked(deps.generateKrd).mock.calls[0][0];
    expect(text).toBe(COACH_TEXT);
  });

  it("should bring a Workout on the watch back to Ready", async () => {
    // Arrange
    const persistence = await seedBuilt({
      state: "pushed",
      garminPushId: "g-1",
    });

    // Act
    await regenerate(depsOf(persistence));

    // Assert
    const stored = await persistence.workouts.getById("w");
    expect(stored?.state).toBe("structured");
    expect(stored?.garminPushId).toBeNull();
  });

  it("should clear the hand edits it replaces", async () => {
    // Arrange
    const persistence = await seedBuilt({
      modifiedAt: "2026-10-02T08:00:00.000Z",
    });

    // Act
    await regenerate(depsOf(persistence));

    // Assert
    expect((await persistence.workouts.getById("w"))?.modifiedAt).toBeNull();
  });

  it("should write nothing when the AI fails", async () => {
    // Arrange
    const persistence = await seedBuilt();
    const before = await persistence.workouts.getById("w");
    const deps = depsOf(persistence, {
      generateKrd: vi.fn().mockRejectedValue(new Error("boom")),
    });

    // Act
    const result = await regenerate(deps);

    // Assert
    expect(result.ok).toBe(false);
    expect(await persistence.workouts.getById("w")).toEqual(before);
  });

  it("should re-read the steps table without the AI when there is no Athlete note", async () => {
    // Arrange
    const persistence = await seedBuilt();
    const tableKrd = fakeKrd();
    const deps = depsOf(persistence, {
      readStepsTable: () => ({ krd: tableKrd, text: "| 10 min | Z3 |" }),
    });

    // Act
    const result = await regenerate(deps);

    // Assert
    expect(result.ok).toBe(true);
    expect(deps.generateKrd).not.toHaveBeenCalled();
    const stored = await persistence.workouts.getById("w");
    expect(stored?.aiMeta).toBeNull();
    expect(stored?.state).toBe("structured");
  });

  it("should give the AI the table, the coach's text and the note when there is a note", async () => {
    // Arrange
    const persistence = await seedBuilt();
    await writeNote(persistence, NOTE);
    const deps = depsOf(persistence, {
      readStepsTable: () => ({ krd: fakeKrd(), text: "| 10 min | Z3 |" }),
    });

    // Act
    await regenerate(deps);

    // Assert
    const { text } = vi.mocked(deps.generateKrd).mock.calls[0][0];
    expect(text).toContain("| 10 min | Z3 |");
    expect(text).toContain(COACH_TEXT);
    expect(text).toContain(NOTE);
  });
});

describe("convertCoachingActivityWithAi after a Workout was deleted", () => {
  it("should match the new Workout when the old Match was left pointing at nothing", async () => {
    // Arrange
    const persistence = await seedSession({
      activity: coachActivity({ description: COACH_TEXT }),
    });
    await persistence.workouts.deleteLocalOrphan("w");

    // Act
    const result = await convertCoachingActivityWithAi(
      { activityId: ACTIVITY_ID },
      depsOf(persistence)
    );

    // Assert
    expect(result).toEqual({ ok: true, workoutId: "w-new", created: true });
    const match = await persistence.sessionMatch.getByActivityId(
      "p1",
      ACTIVITY_ID
    );
    expect(match?.workoutId).toBe("w-new");
  });
});
