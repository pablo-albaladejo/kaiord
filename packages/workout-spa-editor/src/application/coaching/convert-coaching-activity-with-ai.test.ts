import type { Analytics } from "@kaiord/core";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createInMemorySessionMatchRepository } from "../../test-utils/in-memory-session-match-repository";
import type { WorkoutRecord } from "../../types/calendar-record";
import type { CoachingActivityRecord } from "../../types/coaching-activity-record";
import {
  convertCoachingActivityWithAi,
  type ConvertWithAiDeps,
  type GenerateKrdPort,
} from "./convert-coaching-activity-with-ai";
import {
  buildStubAnalytics,
  buildStubCoachingRepo,
  buildStubWorkoutRepo,
  fakeAiMeta,
  fakeKrd,
  stubActivity,
} from "./convert-coaching-activity-with-ai.test-helpers";

const NOW = "2026-05-04T10:00:00.000Z";

const buildDeps = (
  overrides: Partial<ConvertWithAiDeps> = {}
): ConvertWithAiDeps => ({
  coaching: buildStubCoachingRepo([]),
  workouts: buildStubWorkoutRepo(),
  sessionMatches: createInMemorySessionMatchRepository(),
  analytics: buildStubAnalytics(),
  generateKrd: vi
    .fn()
    .mockResolvedValue({ krd: fakeKrd(), aiMeta: fakeAiMeta() }),
  newWorkoutId: () => "w-new",
  newMatchId: () => "M-new",
  clock: () => NOW,
  ...overrides,
});

describe("convertCoachingActivityWithAi", () => {
  let activity: CoachingActivityRecord;

  beforeEach(() => {
    activity = stubActivity();
  });

  it("should persist workout and match atomically on first-time AI success", async () => {
    // Arrange
    const deps = buildDeps({ coaching: buildStubCoachingRepo([activity]) });

    // Act
    const result = await convertCoachingActivityWithAi(
      { activityId: activity.id },
      deps
    );

    // Assert
    expect(result).toEqual({ ok: true, workoutId: "w-new", created: true });
    const stored = await deps.workouts.getById("w-new");
    expect(stored?.state).toBe("structured");
    expect(stored?.krd).not.toBeNull();
    expect(stored?.aiMeta).not.toBeNull();
    expect(stored?.raw?.description).toBe(activity.description);
    const match = await deps.sessionMatches.getByActivityId("p1", activity.id);
    expect(match?.workoutId).toBe("w-new");
  });

  it("should not persist anything when the LLM rejects", async () => {
    // Arrange
    const generateKrd: GenerateKrdPort = vi
      .fn()
      .mockRejectedValue(new Error("Model returned invalid KRD"));
    const deps = buildDeps({
      coaching: buildStubCoachingRepo([activity]),
      generateKrd,
    });

    // Act
    const result = await convertCoachingActivityWithAi(
      { activityId: activity.id },
      deps
    );

    // Assert
    expect(result.ok).toBe(false);
    expect(await deps.workouts.getById("w-new")).toBeUndefined();
    expect(
      await deps.sessionMatches.getByActivityId("p1", activity.id)
    ).toBeUndefined();
  });

  it("should map AbortError to reason ai-cancelled", async () => {
    // Arrange
    const abortErr = new DOMException("aborted", "AbortError");
    const deps = buildDeps({
      coaching: buildStubCoachingRepo([activity]),
      generateKrd: vi.fn().mockRejectedValue(abortErr),
    });

    // Act
    const result = await convertCoachingActivityWithAi(
      { activityId: activity.id },
      deps
    );

    // Assert
    expect(result).toMatchObject({ ok: false, reason: "ai-cancelled" });
    const events = (deps.analytics.event as ReturnType<typeof vi.fn>).mock
      .calls;
    expect(events.map((c) => c[0])).toContain(
      "coaching.convert_with_ai.cancelled"
    );
  });

  it("should return existing workout on idempotent re-call without invoking the LLM", async () => {
    // Arrange
    const existing: WorkoutRecord = {
      id: "w-existing",
      date: activity.date,
      sport: activity.sport,
      source: activity.source,
    } as WorkoutRecord;
    const workouts = buildStubWorkoutRepo([existing]);
    workouts.setSourceLookup(existing);
    const generateKrd = vi.fn();
    const deps = buildDeps({
      coaching: buildStubCoachingRepo([activity]),
      workouts,
      generateKrd,
    });

    // Act
    const result = await convertCoachingActivityWithAi(
      { activityId: activity.id },
      deps
    );

    // Assert
    expect(result).toEqual({
      ok: true,
      workoutId: "w-existing",
      created: false,
    });
    expect(generateKrd).not.toHaveBeenCalled();
    const match = await deps.sessionMatches.getByActivityId("p1", activity.id);
    expect(match?.workoutId).toBe("w-existing");
  });

  it("should fall back to title + sport for the prompt when description is empty", async () => {
    // Arrange
    const empty = stubActivity({ description: "" });
    const generateKrd: GenerateKrdPort = vi
      .fn()
      .mockResolvedValue({ krd: fakeKrd(), aiMeta: fakeAiMeta() });
    const deps = buildDeps({
      coaching: buildStubCoachingRepo([empty]),
      generateKrd,
    });

    // Act
    await convertCoachingActivityWithAi({ activityId: empty.id }, deps);

    // Assert
    expect(generateKrd).toHaveBeenCalledTimes(1);
    const call = (generateKrd as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.text).toBe(`${empty.title} (${empty.sport})`);
  });

  it("should return reason not-found when activity does not exist", async () => {
    // Arrange
    const deps = buildDeps({ coaching: buildStubCoachingRepo([]) });

    // Act
    const result = await convertCoachingActivityWithAi(
      { activityId: "missing" },
      deps
    );

    // Assert
    expect(result).toEqual({ ok: false, reason: "not-found" });
    const events = (deps.analytics.event as ReturnType<typeof vi.fn>).mock
      .calls;
    expect(events.map((c) => c[0])).toContain(
      "coaching.convert_with_ai.failure"
    );
  });

  it("should emit invoked + success events around a happy-path call", async () => {
    // Arrange
    const analytics: Analytics = buildStubAnalytics();
    const deps = buildDeps({
      coaching: buildStubCoachingRepo([activity]),
      analytics,
    });

    // Act
    await convertCoachingActivityWithAi({ activityId: activity.id }, deps);

    // Assert
    const names = (analytics.event as ReturnType<typeof vi.fn>).mock.calls.map(
      (c) => c[0]
    );
    expect(names).toEqual([
      "coaching.convert_with_ai.invoked",
      "coaching.convert_with_ai.success",
    ]);
  });
});
