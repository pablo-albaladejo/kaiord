import { describe, expect, it } from "vitest";

import { createInMemorySessionMatchRepository } from "../../test-utils/in-memory-session-match-repository";
import type { WorkoutRecord } from "../../types/calendar-record";
import {
  buildCoachingActivityId,
  namespaceSourceId,
} from "../../types/coaching-activity-record";
import type { SessionMatch } from "../../types/session-match";
import {
  buildStubCoachingRepo,
  buildStubWorkoutRepo,
  stubActivity,
} from "./convert-coaching-activity-with-ai.test-helpers";
import {
  healSessionMatchIdShape,
  type HealSessionMatchIdShapeDeps,
} from "./heal-session-match-id-shape";

const PROFILE = "p1";
const SOURCE = "train2go";
const RAW_SOURCE_ID = "12345";
const COMPOSITE = buildCoachingActivityId(PROFILE, SOURCE, RAW_SOURCE_ID);
const SHORT = `${SOURCE}:${RAW_SOURCE_ID}`;

const stubWorkout = (overrides: Partial<WorkoutRecord> = {}): WorkoutRecord =>
  ({
    id: "w-1",
    date: "2026-04-29",
    sport: "cycling",
    source: SOURCE,
    sourceId: namespaceSourceId(PROFILE, RAW_SOURCE_ID),
    state: "structured",
    krd: null,
    raw: undefined,
    aiMeta: null,
    garminPushId: null,
    tags: [],
    previousState: null,
    createdAt: "2026-04-28T10:00:00.000Z",
    updatedAt: "2026-04-28T10:00:00.000Z",
    modifiedAt: null,
    planId: null,
    ...overrides,
  }) as WorkoutRecord;

const stubMatch = (overrides: Partial<SessionMatch> = {}): SessionMatch => ({
  id: "m-1",
  profileId: PROFILE,
  coachingActivityId: SHORT,
  workoutId: "w-1",
  date: "2026-04-29",
  createdAt: "2026-04-28T10:00:00.000Z",
  source: "auto-coaching",
  ...overrides,
});

const buildDeps = (
  args: {
    activities?: ReturnType<typeof stubActivity>[];
    workouts?: WorkoutRecord[];
    matches?: SessionMatch[];
  } = {}
): HealSessionMatchIdShapeDeps => {
  const sessionMatches = createInMemorySessionMatchRepository();
  for (const m of args.matches ?? []) void sessionMatches.put(m);
  return {
    coaching: buildStubCoachingRepo(args.activities ?? []),
    workouts: buildStubWorkoutRepo(args.workouts ?? []),
    sessionMatches,
  };
};

describe("healSessionMatchIdShape", () => {
  it("should no-op when the match already references a COMPOSITE activity id", async () => {
    // Arrange
    const activity = stubActivity({
      profileId: PROFILE,
      source: SOURCE,
      sourceId: RAW_SOURCE_ID,
    });
    const match = stubMatch({ coachingActivityId: COMPOSITE });
    const deps = buildDeps({
      activities: [activity],
      workouts: [stubWorkout()],
      matches: [match],
    });

    // Act
    const outcome = await healSessionMatchIdShape({ match }, deps);

    // Assert
    expect(outcome).toEqual({ kind: "noop", reason: "already-composite" });
    const stored = await deps.sessionMatches.getById("m-1");
    expect(stored?.coachingActivityId).toBe(COMPOSITE);
  });

  it("should rewrite a SHORT-form orphan to COMPOSITE when the activity and workout resolve", async () => {
    // Arrange
    const activity = stubActivity({
      profileId: PROFILE,
      source: SOURCE,
      sourceId: RAW_SOURCE_ID,
    });
    const match = stubMatch();
    const deps = buildDeps({
      activities: [activity],
      workouts: [stubWorkout()],
      matches: [match],
    });

    // Act
    const outcome = await healSessionMatchIdShape({ match }, deps);

    // Assert
    expect(outcome).toEqual({ kind: "healed", from: SHORT, to: COMPOSITE });
    const stored = await deps.sessionMatches.getById("m-1");
    expect(stored?.coachingActivityId).toBe(COMPOSITE);
  });

  it("should drop the orphan when a canonical COMPOSITE row already holds the slot", async () => {
    // Arrange
    const activity = stubActivity({
      profileId: PROFILE,
      source: SOURCE,
      sourceId: RAW_SOURCE_ID,
    });
    const canonical = stubMatch({
      id: "m-canonical",
      coachingActivityId: COMPOSITE,
      workoutId: "w-canonical",
    });
    const orphan = stubMatch();
    const deps = buildDeps({
      activities: [activity],
      workouts: [stubWorkout(), stubWorkout({ id: "w-canonical" })],
      matches: [canonical, orphan],
    });

    // Act
    const outcome = await healSessionMatchIdShape({ match: orphan }, deps);

    // Assert
    expect(outcome).toEqual({
      kind: "deleted-orphan",
      orphanMatchId: "m-1",
      canonicalMatchId: "m-canonical",
    });
    const droppedOrphan = await deps.sessionMatches.getById("m-1");
    expect(droppedOrphan).toBeUndefined();
    const canonicalStill = await deps.sessionMatches.getById("m-canonical");
    expect(canonicalStill?.coachingActivityId).toBe(COMPOSITE);
  });

  it("should no-op when no canonical activity row can be found", async () => {
    // Arrange
    const match = stubMatch();
    const deps = buildDeps({
      activities: [], // no activity at all
      workouts: [stubWorkout()],
      matches: [match],
    });

    // Act
    const outcome = await healSessionMatchIdShape({ match }, deps);

    // Assert
    expect(outcome).toEqual({ kind: "noop", reason: "no-activity" });
    const stored = await deps.sessionMatches.getById("m-1");
    expect(stored?.coachingActivityId).toBe(SHORT);
  });

  it("should no-op when the workout side cannot be reconstructed", async () => {
    // Arrange
    const match = stubMatch({ workoutId: "w-missing" });
    const deps = buildDeps({
      activities: [],
      workouts: [],
      matches: [match],
    });

    // Act
    const outcome = await healSessionMatchIdShape({ match }, deps);

    // Assert
    expect(outcome).toEqual({ kind: "noop", reason: "no-workout" });
  });
});
