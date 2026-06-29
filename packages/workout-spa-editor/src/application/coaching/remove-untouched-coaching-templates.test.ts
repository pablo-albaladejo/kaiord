/**
 * Tests for isUntouchedCoachingTemplate predicate and
 * removeUntouchedCoachingTemplates use case.
 */
import { describe, expect, it, vi } from "vitest";

import type { SessionMatchRepository } from "../../ports/session-match-repository";
import type { WorkoutRepository } from "../../ports/workout-repository";
import type { WorkoutRecord } from "../../types/calendar-record";
import {
  isUntouchedCoachingTemplate,
  removeUntouchedCoachingTemplates,
} from "./remove-untouched-coaching-templates";

const NOW = "2026-01-01T10:00:00.000Z";

const WARMUP_STEP = {
  stepIndex: 0,
  name: "Warmup",
  durationType: "time",
  duration: { type: "time", seconds: 600 },
  targetType: "heart_rate",
  target: { type: "heart_rate", value: { unit: "zone", value: 1 } },
  intensity: "warmup",
};

const makeTemplateKrd = () => ({
  type: "structured_workout" as const,
  sport: "cycling",
  extensions: {
    structured_workout: {
      name: "My Workout",
      sport: "cycling",
      steps: [WARMUP_STEP],
    },
  },
});

const makeRecord = (overrides: Partial<WorkoutRecord> = {}): WorkoutRecord => ({
  id: "w-1",
  profileId: "p-1",
  date: "2026-01-01",
  sport: "cycling",
  source: "train2go",
  sourceId: "ns:42",
  planId: null,
  state: "structured",
  raw: null,
  krd: makeTemplateKrd() as WorkoutRecord["krd"],
  lastProcessingError: null,
  feedback: null,
  aiMeta: null,
  garminPushId: null,
  tags: [],
  previousState: null,
  createdAt: NOW,
  modifiedAt: null,
  updatedAt: NOW,
  ...overrides,
});

const multiStepKrd = (): WorkoutRecord["krd"] => {
  const krd = makeTemplateKrd();
  return {
    ...krd,
    extensions: {
      structured_workout: {
        ...krd.extensions.structured_workout,
        steps: [WARMUP_STEP, { ...WARMUP_STEP, stepIndex: 1, name: "Main" }],
      },
    },
  } as WorkoutRecord["krd"];
};

const editedDurationKrd = (): WorkoutRecord["krd"] => {
  const krd = makeTemplateKrd();
  return {
    ...krd,
    extensions: {
      structured_workout: {
        ...krd.extensions.structured_workout,
        steps: [{ ...WARMUP_STEP, duration: { type: "time", seconds: 1200 } }],
      },
    },
  } as WorkoutRecord["krd"];
};

const renamedStepKrd = (): WorkoutRecord["krd"] => {
  const krd = makeTemplateKrd();
  return {
    ...krd,
    extensions: {
      structured_workout: {
        ...krd.extensions.structured_workout,
        steps: [{ ...WARMUP_STEP, name: "Custom" }],
      },
    },
  } as WorkoutRecord["krd"];
};

describe("isUntouchedCoachingTemplate", () => {
  const cases: Array<{
    label: string;
    override: Partial<WorkoutRecord>;
    expected: boolean;
  }> = [
    { label: "an untouched coaching template", override: {}, expected: true },
    {
      label: "a non-structured state",
      override: { state: "raw" },
      expected: false,
    },
    {
      label: "a non-coaching (non-train2go) source",
      override: { source: "manual" },
      expected: false,
    },
    {
      label: "a set modifiedAt (user explicitly saved)",
      override: { modifiedAt: "2026-01-02T10:00:00.000Z" },
      expected: false,
    },
    {
      label: "updatedAt differing from createdAt (user-edited)",
      override: { updatedAt: "2026-01-02T10:00:00.000Z" },
      expected: false,
    },
    {
      label: "a multi-step workout",
      override: { krd: multiStepKrd() },
      expected: false,
    },
    {
      label: "a single step with a modified duration",
      override: { krd: editedDurationKrd() },
      expected: false,
    },
    {
      label: "a renamed single step",
      override: { krd: renamedStepKrd() },
      expected: false,
    },
    { label: "a null krd", override: { krd: null }, expected: false },
  ];

  it.each(cases)(
    "should return $expected for $label",
    ({ override, expected }) => {
      // Arrange
      const record = makeRecord(override);

      // Act
      const result = isUntouchedCoachingTemplate(record);

      // Assert
      expect(result).toBe(expected);
    }
  );
});

describe("removeUntouchedCoachingTemplates", () => {
  const makeRepos = (records: WorkoutRecord[]) => {
    const store = new Map(records.map((r) => [r.id, r]));
    const workouts: Pick<WorkoutRepository, "getByState" | "delete"> = {
      getByState: async (state) =>
        [...store.values()].filter((r) => r.state === state),
      delete: vi.fn(async (id: string) => {
        store.delete(id);
      }),
    };
    const sessionMatch: Pick<SessionMatchRepository, "deleteByWorkoutId"> = {
      deleteByWorkoutId: vi.fn(async () => {}),
    };
    return { workouts, sessionMatch, store };
  };

  it("should remove an untouched template and its session match", async () => {
    // Arrange
    const record = makeRecord({ id: "w-junk" });
    const { workouts, sessionMatch } = makeRepos([record]);

    // Act
    const result = await removeUntouchedCoachingTemplates(
      workouts,
      sessionMatch
    );

    // Assert
    expect(result.removed).toBe(1);
    expect(sessionMatch.deleteByWorkoutId).toHaveBeenCalledWith("w-junk");
    expect(workouts.delete).toHaveBeenCalledWith("w-junk");
  });

  const negativeCases: Array<{
    label: string;
    override: Partial<WorkoutRecord>;
  }> = [
    {
      label: "a user-edited workout (updatedAt > createdAt)",
      override: { id: "w-edited", updatedAt: "2026-01-02T10:00:00.000Z" },
    },
    {
      label: "a user-edited workout (modifiedAt set)",
      override: { id: "w-modified", modifiedAt: "2026-01-02T10:00:00.000Z" },
    },
    {
      label: "a non-coaching (scratch) workout",
      override: { id: "w-scratch", source: "scratch" },
    },
    {
      label: "a multi-step coaching workout",
      override: { id: "w-multi", krd: multiStepKrd() },
    },
  ];

  it.each(negativeCases)("should not remove $label", async ({ override }) => {
    // Arrange
    const record = makeRecord(override);
    const { workouts, sessionMatch } = makeRepos([record]);

    // Act
    const result = await removeUntouchedCoachingTemplates(
      workouts,
      sessionMatch
    );

    // Assert
    expect(result.removed).toBe(0);
    expect(workouts.delete).not.toHaveBeenCalled();
    expect(sessionMatch.deleteByWorkoutId).not.toHaveBeenCalled();
  });

  it("should be idempotent — second run is a no-op when store is empty", async () => {
    // Arrange
    const record = makeRecord({ id: "w-once" });
    const { workouts, sessionMatch } = makeRepos([record]);

    // Act
    await removeUntouchedCoachingTemplates(workouts, sessionMatch);
    const second = await removeUntouchedCoachingTemplates(
      workouts,
      sessionMatch
    );

    // Assert
    expect(second.removed).toBe(0);
    expect(workouts.delete).toHaveBeenCalledTimes(1);
  });
});
