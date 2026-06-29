import type { vi } from "vitest";
import { describe, expect, it } from "vitest";

import { createInMemorySessionMatchRepository } from "../../test-utils/in-memory-session-match-repository";
import type { WorkoutRecord } from "../../types/calendar-record";
import {
  convertCoachingActivityManual,
  type ConvertManualDeps,
} from "./convert-coaching-activity-manual";
import {
  buildStubAnalytics,
  buildStubCoachingRepo,
  buildStubWorkoutRepo,
  stubActivity,
} from "./convert-coaching-activity-with-ai.test-helpers";

const NOW = "2026-05-04T10:00:00.000Z";

const buildDeps = (
  overrides: Partial<ConvertManualDeps> = {}
): ConvertManualDeps => ({
  coaching: buildStubCoachingRepo([]),
  workouts: buildStubWorkoutRepo(),
  sessionMatches: createInMemorySessionMatchRepository(),
  analytics: buildStubAnalytics(),
  newWorkoutId: () => "w-new",
  newMatchId: () => "M-new",
  clock: () => NOW,
  ...overrides,
});

describe("convertCoachingActivityManual", () => {
  it("should persist a structured workout with template KRD on first-time conversion", async () => {
    // Arrange
    const activity = stubActivity();
    const deps = buildDeps({ coaching: buildStubCoachingRepo([activity]) });

    // Act
    const result = await convertCoachingActivityManual(
      { activityId: activity.id },
      deps
    );

    // Assert
    expect(result).toEqual({ workoutId: "w-new", created: true });
    const stored = await deps.workouts.getById("w-new");
    expect(stored?.state).toBe("structured");
    expect(stored?.aiMeta).toBeNull();
    expect(stored?.raw?.description).toBe(activity.description);
    const workout = stored?.krd?.extensions?.structured_workout as
      | { steps: Array<unknown> }
      | undefined;
    expect(workout?.steps).toHaveLength(1);
  });

  it("should write a SessionMatch row pointing to the new workout", async () => {
    // Arrange
    const activity = stubActivity();
    const deps = buildDeps({ coaching: buildStubCoachingRepo([activity]) });

    // Act
    await convertCoachingActivityManual({ activityId: activity.id }, deps);

    // Assert
    const match = await deps.sessionMatches.getByActivityId("p1", activity.id);
    expect(match?.workoutId).toBe("w-new");
    expect(match?.source).toBe("auto-coaching");
  });

  it("should be idempotent and return the existing workout on re-call", async () => {
    // Arrange
    const activity = stubActivity();
    const existing: WorkoutRecord = {
      id: "w-existing",
      date: activity.date,
      sport: activity.sport,
      source: activity.source,
    } as WorkoutRecord;
    const workouts = buildStubWorkoutRepo([existing]);
    workouts.setSourceLookup(existing);
    const deps = buildDeps({
      coaching: buildStubCoachingRepo([activity]),
      workouts,
    });

    // Act
    const result = await convertCoachingActivityManual(
      { activityId: activity.id },
      deps
    );

    // Assert
    expect(result).toEqual({ workoutId: "w-existing", created: false });
    expect(await deps.workouts.getById("w-new")).toBeUndefined();
  });

  it("should auto-heal a missing match when the workout already exists", async () => {
    // Arrange
    const activity = stubActivity();
    const existing: WorkoutRecord = {
      id: "w-existing",
      date: activity.date,
      sport: activity.sport,
      source: activity.source,
    } as WorkoutRecord;
    const workouts = buildStubWorkoutRepo([existing]);
    workouts.setSourceLookup(existing);
    const matches = createInMemorySessionMatchRepository();
    const deps = buildDeps({
      coaching: buildStubCoachingRepo([activity]),
      workouts,
      sessionMatches: matches,
    });

    // Act
    await convertCoachingActivityManual({ activityId: activity.id }, deps);

    // Assert
    const match = await matches.getByActivityId("p1", activity.id);
    expect(match?.workoutId).toBe("w-existing");
  });

  it("should preserve activity.description verbatim into raw.description", async () => {
    // Arrange
    const activity = stubActivity({
      description: "Specific Z2 endurance ride 90 min",
    });
    const deps = buildDeps({ coaching: buildStubCoachingRepo([activity]) });

    // Act
    await convertCoachingActivityManual({ activityId: activity.id }, deps);

    // Assert
    const stored = await deps.workouts.getById("w-new");
    expect(stored?.raw?.description).toBe("Specific Z2 endurance ride 90 min");
  });

  it("should populate the template KRD when an existing workout has krd=null (legacy raw)", async () => {
    // Arrange
    const activity = stubActivity();
    const existing: WorkoutRecord = {
      id: "w-legacy-raw",
      date: activity.date,
      sport: activity.sport,
      source: activity.source,
      state: "raw",
      krd: null,
      updatedAt: "2026-01-01T00:00:00Z",
    } as WorkoutRecord;
    const workouts = buildStubWorkoutRepo([existing]);
    workouts.setSourceLookup(existing);
    const deps = buildDeps({
      coaching: buildStubCoachingRepo([activity]),
      workouts,
    });

    // Act
    await convertCoachingActivityManual({ activityId: activity.id }, deps);

    // Assert
    const stored = await deps.workouts.getById("w-legacy-raw");
    expect(stored?.krd).not.toBeNull();
    expect(stored?.state).toBe("structured");
    expect(stored?.updatedAt).toBe(NOW);
  });

  it.each([
    {
      sport: "stationarybike",
      recordSport: "cycling",
      metaSport: "cycling",
      subSport: "indoor_cycling",
    },
    {
      sport: "stretching",
      recordSport: "training",
      metaSport: "training",
      subSport: "flexibility_training",
    },
  ] as const)(
    "should set record and KRD sport from the resolved key for $sport",
    async ({ sport, recordSport, metaSport, subSport }) => {
      // Arrange
      const activity = stubActivity({ sport });
      const deps = buildDeps({ coaching: buildStubCoachingRepo([activity]) });

      // Act
      await convertCoachingActivityManual({ activityId: activity.id }, deps);

      // Assert
      const stored = await deps.workouts.getById("w-new");
      expect(stored?.sport).toBe(recordSport);
      expect(stored?.krd?.metadata.sport).toBe(metaSport);
      expect(stored?.krd?.metadata.subSport).toBe(subSport);
    }
  );

  it("should emit invoked + success analytics events", async () => {
    // Arrange
    const activity = stubActivity();
    const analytics = buildStubAnalytics();
    const deps = buildDeps({
      coaching: buildStubCoachingRepo([activity]),
      analytics,
    });

    // Act
    await convertCoachingActivityManual({ activityId: activity.id }, deps);

    // Assert
    const names = (analytics.event as ReturnType<typeof vi.fn>).mock.calls.map(
      (c) => c[0]
    );
    expect(names).toEqual([
      "coaching.convert_manual.invoked",
      "coaching.convert_manual.success",
    ]);
  });
});
