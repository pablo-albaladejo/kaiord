import { createMockLogger, loadFitFixture } from "@kaiord/core/test-utils";
import { describe, expect, it } from "vitest";

import {
  FIT_NOTES_MAX_LENGTH,
  FIT_NOTES_OVERSIZED_LENGTH,
} from "../../test-utils/constants";
import { createGarminFitSdkReader } from "../garmin-fitsdk";
import { convertKRDToMessages } from "../krd-to-fit/krd-to-fit.converter";
import { FIT_MESSAGE_NUMBERS } from "../shared/message-numbers";

describe("Round-trip: Workout step - notes field", () => {
  it("should preserve notes through FIT → KRD → FIT conversion", async () => {
    // Arrange
    const logger = createMockLogger();
    const reader = createGarminFitSdkReader(logger);
    const originalBuffer = loadFitFixture("WorkoutIndividualSteps.fit");
    const testNotes = "Focus on form and breathing";
    const krd = await reader(originalBuffer);
    if (krd.extensions?.structured_workout) {
      const workout = krd.extensions.structured_workout as {
        name?: string;
        sport: string;
        steps: Array<{
          stepIndex: number;
          notes?: string;
          [key: string]: unknown;
        }>;
      };
      if (workout.steps.length > 0) {
        workout.steps[0].notes = testNotes;
      }
    }
    const messages = convertKRDToMessages(krd, logger);

    // Act
    const stepMsg = messages.find(
      (msg: unknown) =>
        (msg as { mesgNum?: number }).mesgNum ===
          FIT_MESSAGE_NUMBERS.WORKOUT_STEP &&
        (msg as { messageIndex?: number }).messageIndex === 0
    ) as { mesgNum: number; [key: string]: unknown } | undefined;

    // Assert
    expect(stepMsg).toBeDefined();
    expect(stepMsg?.notes).toBe(testNotes);
  });

  it("should preserve exact notes string value", async () => {
    // Arrange
    const logger = createMockLogger();
    const reader = createGarminFitSdkReader(logger);
    const originalBuffer = loadFitFixture("WorkoutIndividualSteps.fit");

    // Act
    const notesValues = [
      "Warm up slowly",
      "Maintain steady pace",
      "Push hard!",
      "Recovery interval - keep it easy",
      "Final sprint - give it everything",
    ];

    // Assert
    for (const notes of notesValues) {
      const krd = await reader(originalBuffer);

      // Add notes to first step
      if (krd.extensions?.structured_workout) {
        const workout = krd.extensions.structured_workout as {
          name?: string;
          sport: string;
          steps: Array<{
            stepIndex: number;
            notes?: string;
            [key: string]: unknown;
          }>;
        };
        if (workout.steps.length > 0) {
          workout.steps[0].notes = notes;
        }
      }

      const messages = convertKRDToMessages(krd, logger);

      const stepMsg = messages.find(
        (msg: unknown) =>
          (msg as { mesgNum?: number }).mesgNum ===
            FIT_MESSAGE_NUMBERS.WORKOUT_STEP &&
          (msg as { messageIndex?: number }).messageIndex === 0
      ) as { mesgNum: number; [key: string]: unknown } | undefined;

      expect(stepMsg?.notes).toBe(notes);
    }
  });

  it("should reject notes exceeding 256 characters due to schema validation", async () => {
    // Arrange
    const logger = createMockLogger();
    const reader = createGarminFitSdkReader(logger);
    const originalBuffer = loadFitFixture("WorkoutIndividualSteps.fit");
    const longNotes = "a".repeat(FIT_NOTES_OVERSIZED_LENGTH);
    const krd = await reader(originalBuffer);

    // Act
    if (krd.extensions?.structured_workout) {
      const workout = krd.extensions.structured_workout as {
        name?: string;
        sport: string;
        steps: Array<{
          stepIndex: number;
          notes?: string;
          [key: string]: unknown;
        }>;
      };
      if (workout.steps.length > 0) {
        workout.steps[0].notes = longNotes;
      }
    }

    // Assert
    expect(() => convertKRDToMessages(krd, logger)).toThrow(/notes.*256/i);
  });

  it("should accept notes at exactly 256 characters in round-trip", async () => {
    // Arrange
    const logger = createMockLogger();
    const reader = createGarminFitSdkReader(logger);
    const originalBuffer = loadFitFixture("WorkoutIndividualSteps.fit");
    const maxNotes = "a".repeat(FIT_NOTES_MAX_LENGTH);
    const krd = await reader(originalBuffer);
    if (krd.extensions?.structured_workout) {
      const workout = krd.extensions.structured_workout as {
        name?: string;
        sport: string;
        steps: Array<{
          stepIndex: number;
          notes?: string;
          [key: string]: unknown;
        }>;
      };
      if (workout.steps.length > 0) {
        workout.steps[0].notes = maxNotes;
      }
    }
    const messages = convertKRDToMessages(krd, logger);

    // Act
    const stepMsg = messages.find(
      (msg: unknown) =>
        (msg as { mesgNum?: number }).mesgNum ===
          FIT_MESSAGE_NUMBERS.WORKOUT_STEP &&
        (msg as { messageIndex?: number }).messageIndex === 0
    ) as { mesgNum: number; [key: string]: unknown } | undefined;

    // Assert
    expect(stepMsg?.notes).toBe(maxNotes);
    expect((stepMsg?.notes as string).length).toBe(FIT_NOTES_MAX_LENGTH);
  });

  it("should omit notes when undefined in round-trip", async () => {
    // Arrange
    const logger = createMockLogger();
    const reader = createGarminFitSdkReader(logger);
    const originalBuffer = loadFitFixture("WorkoutIndividualSteps.fit");
    const krd = await reader(originalBuffer);
    if (krd.extensions?.structured_workout) {
      const workout = krd.extensions.structured_workout as {
        name?: string;
        sport: string;
        steps: Array<{
          stepIndex: number;
          notes?: string;
          [key: string]: unknown;
        }>;
      };
      if (workout.steps.length > 0) {
        workout.steps[0].notes = undefined;
      }
    }
    const messages = convertKRDToMessages(krd, logger);

    // Act
    const stepMsg = messages.find(
      (msg: unknown) =>
        (msg as { mesgNum?: number }).mesgNum ===
          FIT_MESSAGE_NUMBERS.WORKOUT_STEP &&
        (msg as { messageIndex?: number }).messageIndex === 0
    ) as { mesgNum: number; [key: string]: unknown } | undefined;

    // Assert
    expect(stepMsg)?.not.toHaveProperty("notes");
  });

  it("should preserve notes on multiple steps", async () => {
    // Arrange
    const logger = createMockLogger();
    const reader = createGarminFitSdkReader(logger);
    const originalBuffer = loadFitFixture("WorkoutIndividualSteps.fit");
    const notesArray = [
      "Warm up",
      "Build intensity",
      "Maintain pace",
      "Cool down",
    ];
    const krd = await reader(originalBuffer);
    if (krd.extensions?.structured_workout) {
      const workout = krd.extensions.structured_workout as {
        name?: string;
        sport: string;
        steps: Array<{
          stepIndex: number;
          notes?: string;
          [key: string]: unknown;
        }>;
      };
      workout.steps.forEach((step, index) => {
        if (index < notesArray.length) {
          step.notes = notesArray[index];
        }
      });
    }

    // Act
    const messages = convertKRDToMessages(krd, logger);

    // Assert
    for (let i = 0; i < notesArray.length; i++) {
      const stepMsg = messages.find(
        (msg: unknown) =>
          (msg as { mesgNum?: number }).mesgNum ===
            FIT_MESSAGE_NUMBERS.WORKOUT_STEP &&
          (msg as { messageIndex?: number }).messageIndex === i
      ) as { mesgNum: number; [key: string]: unknown } | undefined;

      expect(stepMsg?.notes).toBe(notesArray[i]);
    }
  });
});

describe("Round-trip: Combined fields - subSport and notes", () => {
  it("should preserve both subSport and notes in round-trip", async () => {
    // Arrange
    const logger = createMockLogger();
    const reader = createGarminFitSdkReader(logger);
    const originalBuffer = loadFitFixture("WorkoutIndividualSteps.fit");
    const testSubSport = "trail";
    const testNotes = "Focus on technique";
    const krd = await reader(originalBuffer);
    if (krd.extensions?.structured_workout) {
      const workout = krd.extensions.structured_workout as {
        name?: string;
        sport: string;
        subSport?: string;
        steps: Array<{
          stepIndex: number;
          notes?: string;
          [key: string]: unknown;
        }>;
      };
      workout.subSport = testSubSport;
      if (workout.steps.length > 0) {
        workout.steps[0].notes = testNotes;
      }
    }
    const messages = convertKRDToMessages(krd, logger);
    const workoutMsg = messages.find(
      (msg: unknown) =>
        (msg as { mesgNum?: number }).mesgNum === FIT_MESSAGE_NUMBERS.WORKOUT
    ) as { mesgNum: number; [key: string]: unknown } | undefined;
    expect(workoutMsg?.subSport).toBe(testSubSport);

    // Act
    const stepMsg = messages.find(
      (msg: unknown) =>
        (msg as { mesgNum?: number }).mesgNum ===
          FIT_MESSAGE_NUMBERS.WORKOUT_STEP &&
        (msg as { messageIndex?: number }).messageIndex === 0
    ) as { mesgNum: number; [key: string]: unknown } | undefined;

    // Assert
    expect(stepMsg?.notes).toBe(testNotes);
  });
});
