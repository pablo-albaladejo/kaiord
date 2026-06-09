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

describe("isUntouchedCoachingTemplate", () => {
  it("should return true for an untouched coaching template record", () => {
    // Arrange
    const record = makeRecord();

    // Act
    const result = isUntouchedCoachingTemplate(record);

    // Assert
    expect(result).toBe(true);
  });

  it("should return false when state is not structured", () => {
    // Arrange
    const record = makeRecord({ state: "raw" });

    // Act
    const result = isUntouchedCoachingTemplate(record);

    // Assert
    expect(result).toBe(false);
  });

  it("should return false for a non-coaching (non-train2go) source", () => {
    // Arrange
    const record = makeRecord({ source: "manual" });

    // Act
    const result = isUntouchedCoachingTemplate(record);

    // Assert
    expect(result).toBe(false);
  });

  it("should return false when modifiedAt is set (user explicitly saved)", () => {
    // Arrange
    const record = makeRecord({ modifiedAt: "2026-01-02T10:00:00.000Z" });

    // Act
    const result = isUntouchedCoachingTemplate(record);

    // Assert
    expect(result).toBe(false);
  });

  it("should return false when updatedAt differs from createdAt (user-edited)", () => {
    // Arrange
    const record = makeRecord({ updatedAt: "2026-01-02T10:00:00.000Z" });

    // Act
    const result = isUntouchedCoachingTemplate(record);

    // Assert
    expect(result).toBe(false);
  });

  it("should return false for a multi-step workout", () => {
    // Arrange
    const krd = makeTemplateKrd();
    const multiStep = {
      ...krd,
      extensions: {
        structured_workout: {
          ...krd.extensions.structured_workout,
          steps: [WARMUP_STEP, { ...WARMUP_STEP, stepIndex: 1, name: "Main" }],
        },
      },
    };
    const record = makeRecord({ krd: multiStep as WorkoutRecord["krd"] });

    // Act
    const result = isUntouchedCoachingTemplate(record);

    // Assert
    expect(result).toBe(false);
  });

  it("should return false when the single step has been modified (different duration)", () => {
    // Arrange
    const krd = makeTemplateKrd();
    const editedKrd = {
      ...krd,
      extensions: {
        structured_workout: {
          ...krd.extensions.structured_workout,
          steps: [
            { ...WARMUP_STEP, duration: { type: "time", seconds: 1200 } },
          ],
        },
      },
    };
    const record = makeRecord({ krd: editedKrd as WorkoutRecord["krd"] });

    // Act
    const result = isUntouchedCoachingTemplate(record);

    // Assert
    expect(result).toBe(false);
  });

  it("should return false when the step name differs (user renamed step)", () => {
    // Arrange
    const krd = makeTemplateKrd();
    const editedKrd = {
      ...krd,
      extensions: {
        structured_workout: {
          ...krd.extensions.structured_workout,
          steps: [{ ...WARMUP_STEP, name: "Custom" }],
        },
      },
    };
    const record = makeRecord({ krd: editedKrd as WorkoutRecord["krd"] });

    // Act
    const result = isUntouchedCoachingTemplate(record);

    // Assert
    expect(result).toBe(false);
  });

  it("should return false when krd is null", () => {
    // Arrange
    const record = makeRecord({ krd: null });

    // Act
    const result = isUntouchedCoachingTemplate(record);

    // Assert
    expect(result).toBe(false);
  });
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

  it("should not remove a user-edited workout (updatedAt > createdAt)", async () => {
    // Arrange
    const record = makeRecord({
      id: "w-edited",
      updatedAt: "2026-01-02T10:00:00.000Z",
    });
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

  it("should not remove a user-edited workout (modifiedAt set)", async () => {
    // Arrange
    const record = makeRecord({
      id: "w-modified",
      modifiedAt: "2026-01-02T10:00:00.000Z",
    });
    const { workouts, sessionMatch } = makeRepos([record]);

    // Act
    const result = await removeUntouchedCoachingTemplates(
      workouts,
      sessionMatch
    );

    // Assert
    expect(result.removed).toBe(0);
    expect(workouts.delete).not.toHaveBeenCalled();
  });

  it("should not remove a non-coaching (scratch) workout", async () => {
    // Arrange
    const record = makeRecord({ id: "w-scratch", source: "scratch" });
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

  it("should not remove a multi-step coaching workout", async () => {
    // Arrange
    const krd = makeTemplateKrd();
    const multiKrd = {
      ...krd,
      extensions: {
        structured_workout: {
          ...krd.extensions.structured_workout,
          steps: [WARMUP_STEP, { ...WARMUP_STEP, stepIndex: 1, name: "Main" }],
        },
      },
    };
    const record = makeRecord({
      id: "w-multi",
      krd: multiKrd as WorkoutRecord["krd"],
    });
    const { workouts, sessionMatch } = makeRepos([record]);

    // Act
    const result = await removeUntouchedCoachingTemplates(
      workouts,
      sessionMatch
    );

    // Assert
    expect(result.removed).toBe(0);
    expect(workouts.delete).not.toHaveBeenCalled();
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
