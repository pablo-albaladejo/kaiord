/**
 * Converting an activity whose workout already exists writes onto the row
 * as stored (design §3.10, AC-25, AC-30): a move that lands during the LLM
 * call, or between the read and the write, keeps its date, and a row no
 * longer in the expected state is not written and reported as skipped,
 * not as a success.
 */
import { describe, expect, it, vi } from "vitest";

import { moveSession } from "../move-session";
import {
  ACTIVITY_ID,
  coachActivity,
  NOW,
  seedSession,
  THU,
  TUE,
} from "../session-move.test-fixtures";
import { handleExistingManualWorkout } from "./convert-coaching-activity-manual-helpers";
import { convertCoachingActivityWithAi } from "./convert-coaching-activity-with-ai";
import {
  buildStubAnalytics,
  fakeAiMeta,
  fakeKrd,
} from "./convert-coaching-activity-with-ai.test-helpers";

type Persistence = Awaited<ReturnType<typeof seedSession>>;

const moveToThursday = (persistence: Persistence) =>
  moveSession(
    { ...persistence, now: () => NOW },
    { workoutId: "w", targetDay: THU }
  );

const depsOf = (persistence: Persistence, duringLlm: () => Promise<void>) => ({
  coaching: persistence.coaching,
  workouts: persistence.workouts,
  sessionMatches: persistence.sessionMatch,
  transaction: persistence.transaction,
  analytics: buildStubAnalytics(),
  generateKrd: async () => {
    await duringLlm();
    return { krd: fakeKrd(), aiMeta: fakeAiMeta() };
  },
  newWorkoutId: () => "w-new",
  newMatchId: () => "m-new",
  clock: () => NOW,
});

describe("processExistingRawInPlace with a row changed during the LLM call", () => {
  it("should keep a date moved during the LLM call", async () => {
    // Arrange
    const persistence = await seedSession({ workout: { state: "raw" } });
    const deps = depsOf(persistence, () => moveToThursday(persistence));

    // Act
    const result = await convertCoachingActivityWithAi(
      { activityId: ACTIVITY_ID },
      deps
    );

    // Assert
    expect(result).toEqual({ ok: true, workoutId: "w", created: false });
    expect(deps.analytics.event).toHaveBeenCalledWith(
      "coaching.convert_with_ai.success",
      { created: false }
    );
    expect(await persistence.workouts.getById("w")).toMatchObject({
      date: THU,
      coachDate: TUE,
      state: "structured",
    });
  });

  it("should write nothing when the row left the raw state meanwhile", async () => {
    // Arrange
    const persistence = await seedSession({ workout: { state: "raw" } });
    const deps = depsOf(persistence, async () => {
      const row = await persistence.workouts.getById("w");
      await persistence.workouts.put({ ...row!, state: "skipped" });
    });

    // Act
    const result = await convertCoachingActivityWithAi(
      { activityId: ACTIVITY_ID },
      deps
    );

    // Assert
    expect(result).toEqual({ ok: true, workoutId: "w", created: false });
    expect(deps.analytics.event).toHaveBeenCalledWith(
      "coaching.convert_with_ai.skipped",
      { reason: "changed-meanwhile" }
    );
    expect(deps.analytics.event).not.toHaveBeenCalledWith(
      "coaching.convert_with_ai.success",
      expect.anything()
    );
    expect(await persistence.workouts.getById("w")).toMatchObject({
      state: "skipped",
      krd: null,
    });
  });
});

describe("handleExistingManualWorkout with a row moved after its read", () => {
  it("should keep a date moved between the read and the write", async () => {
    // Arrange
    const persistence = await seedSession({ workout: { state: "raw" } });
    const read = persistence.workouts.getById.bind(persistence.workouts);
    vi.spyOn(persistence.workouts, "getById").mockImplementationOnce(
      async (id) => {
        const row = await read(id);
        await moveToThursday(persistence);
        return row;
      }
    );
    const deps = depsOf(persistence, async () => undefined);

    // Act
    await handleExistingManualWorkout(deps, coachActivity(), "w");

    // Assert
    expect(await persistence.workouts.getById("w")).toMatchObject({
      date: THU,
      state: "structured",
    });
  });

  it("should date a new match from the row as stored, not the earlier read", async () => {
    // Arrange
    const persistence = await seedSession({
      workout: { state: "raw" },
      match: null,
    });
    const read = persistence.workouts.getById.bind(persistence.workouts);
    vi.spyOn(persistence.workouts, "getById").mockImplementationOnce(
      async (id) => {
        const row = await read(id);
        await moveToThursday(persistence);
        return row;
      }
    );
    const deps = depsOf(persistence, async () => undefined);

    // Act
    await handleExistingManualWorkout(deps, coachActivity(), "w");

    // Assert
    expect(await persistence.sessionMatch.getById("m-new")).toMatchObject({
      workoutId: "w",
      date: THU,
    });
  });

  it("should write nothing when the row got a KRD meanwhile", async () => {
    // Arrange
    const persistence = await seedSession({ workout: { state: "raw" } });
    const read = persistence.workouts.getById.bind(persistence.workouts);
    vi.spyOn(persistence.workouts, "getById").mockImplementationOnce(
      async (id) => {
        const row = await read(id);
        await persistence.workouts.put({ ...row!, krd: fakeKrd() });
        return row;
      }
    );
    const put = vi.spyOn(persistence.workouts, "put");
    const deps = depsOf(persistence, async () => undefined);

    // Act
    await handleExistingManualWorkout(deps, coachActivity(), "w");

    // Assert
    expect(put).toHaveBeenCalledTimes(1);
    expect((await persistence.workouts.getById("w"))?.state).toBe("raw");
  });
});
