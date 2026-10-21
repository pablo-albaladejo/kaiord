import { describe, expect, it, vi } from "vitest";

import { createInMemorySessionMatchRepository } from "../../test-utils/in-memory-session-match-repository";
import type { WorkoutRecord } from "../../types/calendar-record";
import type { CoachingActivityRecord } from "../../types/coaching-activity-record";
import { getStructuredWorkout } from "../../utils/structured-workout";
import { buildCoachingTemplateKrd } from "./coaching-template";
import {
  convertCoachingActivityWithAi,
  type ConvertWithAiDeps,
} from "./convert-coaching-activity-with-ai";
import {
  buildStubAnalytics,
  buildStubCoachingRepo,
  buildStubWorkoutRepo,
  fakeAiMeta,
  stubActivity,
  type StubWorkoutRepo,
} from "./convert-coaching-activity-with-ai.test-helpers";

const SESSION_TITLE = "Rodaje con contrastes: 10' z1 +30' contrastes";

const buildDeps = (
  activity: CoachingActivityRecord,
  workouts: StubWorkoutRepo,
  aiName?: string
): ConvertWithAiDeps => ({
  coaching: buildStubCoachingRepo([activity]),
  workouts,
  sessionMatches: createInMemorySessionMatchRepository(),
  analytics: buildStubAnalytics(),
  generateKrd: vi.fn().mockResolvedValue({
    krd: buildCoachingTemplateKrd("running", aiName),
    aiMeta: fakeAiMeta(),
  }),
  newWorkoutId: () => "w-new",
  newMatchId: () => "M-new",
  clock: () => "2026-05-04T10:00:00.000Z",
});

const convertAndReadName = async (
  activity: CoachingActivityRecord,
  aiName?: string,
  existing?: WorkoutRecord
): Promise<string | undefined> => {
  const workouts = buildStubWorkoutRepo(existing ? [existing] : []);
  workouts.setSourceLookup(existing);
  const deps = buildDeps(activity, workouts, aiName);
  const result = await convertCoachingActivityWithAi(
    { activityId: activity.id },
    deps
  );
  if (!result.ok) throw new Error(result.reason);
  const stored = await deps.workouts.getById(result.workoutId);
  return stored?.krd ? getStructuredWorkout(stored.krd)?.name : undefined;
};

describe("convertCoachingActivityWithAi workout name", () => {
  it("should keep the AI-generated name over the session title", async () => {
    // Arrange
    const activity = stubActivity({ sport: "running", title: SESSION_TITLE });

    // Act
    const name = await convertAndReadName(activity, "Rodaje con contrastes");

    // Assert
    expect(name).toBe("Rodaje con contrastes");
  });

  it("should fall back to the session title when the AI gives no name", async () => {
    // Arrange
    const activity = stubActivity({ sport: "running", title: SESSION_TITLE });

    // Act
    const name = await convertAndReadName(activity);

    // Assert
    expect(name).toBe(SESSION_TITLE);
  });

  it("should fall back to the session title when re-processing a raw workout", async () => {
    // Arrange
    const activity = stubActivity({ sport: "running", title: SESSION_TITLE });
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

    // Act
    const name = await convertAndReadName(activity, undefined, existingRaw);

    // Assert
    expect(name).toBe(SESSION_TITLE);
  });

  it("should leave the name unset when both AI name and title are blank", async () => {
    // Arrange
    const activity = stubActivity({ sport: "running", title: "   " });

    // Act
    const name = await convertAndReadName(activity);

    // Assert
    expect(name).toBeUndefined();
  });
});
