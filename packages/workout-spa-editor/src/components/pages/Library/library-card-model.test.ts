import { describe, expect, it } from "vitest";

import { getTranslate } from "../../../i18n/use-translate";
import type { WorkoutStep } from "../../../types/krd";
import type { WorkoutTemplate } from "../../../types/workout-library";
import { buildLibraryCardModel } from "./library-card-model";

const FIVE_MINUTES = 300;
const t = getTranslate("library");

const timedStep = (stepIndex: number): WorkoutStep => ({
  stepIndex,
  durationType: "time",
  duration: { type: "time", seconds: FIVE_MINUTES },
  targetType: "open",
  target: { type: "open" },
});

const template: WorkoutTemplate = {
  id: "8f9b3c2e-1d4a-4e6b-9c7d-2a1b3c4d5e6f",
  name: "Easy fifteen",
  sport: "running",
  tags: [],
  createdAt: "2026-10-11T00:00:00.000Z",
  updatedAt: "2026-10-11T00:00:00.000Z",
  krd: {
    version: "1.0",
    type: "structured_workout",
    metadata: { created: "2026-10-11T00:00:00Z", sport: "running" },
    extensions: {
      structured_workout: {
        sport: "running",
        steps: [timedStep(0), timedStep(1), timedStep(2)],
      },
    },
  },
};

describe("buildLibraryCardModel", () => {
  it("should not claim a load it cannot know for a session without targets", () => {
    // Arrange

    // Act
    const model = buildLibraryCardModel(template, null, t);

    // Assert
    expect(model.duration).toBe("15m");
    expect(model.tss).toBeUndefined();
  });
});
