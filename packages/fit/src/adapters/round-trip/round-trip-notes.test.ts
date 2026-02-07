import { describe, expect, it } from "vitest";
import { createMockLogger, loadFitFixture } from "@kaiord/core/test-utils";
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

    // Act - FIT → KRD
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
        workout.steps[0].notes = testNotes;
      }
    }

    // Act - KRD → FIT messages
    const messages = convertKRDToMessages(krd, logger);

    // Assert - Check first workout step has notes
    const stepMsg = messages.find(
      (msg: unknown) =>
        (msg as { mesgNum?: number }).mesgNum ===
          FIT_MESSAGE_NUMBERS.WORKOUT_STEP &&
        (msg as { messageIndex?: number }).messageIndex === 0
    ) as { mesgNum: number; [key: string]: unknown } | undefined;

    expect(stepMsg).toBeDefined();
    expect(stepMsg?.notes).toBe(testNotes);
  });

  it("should preserve exact notes string value", async () => {
    // Arrange
    const logger = createMockLogger();
    const reader = createGarminFitSdkReader(logger);
    const originalBuffer = loadFitFixture("WorkoutIndividualSteps.fit");

    // Test various notes strings
    const notesValues = [
      "Warm up slowly",
      "Maintain steady pace",
      "Push hard!",
      "Recovery interval - keep it easy",
      "Final sprint - give it everything",
    ];

    for (const notes of notesValues) {
      // Act - FIT → KRD
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

      // Act - KRD → FIT messages
      const messages = convertKRDToMessages(krd, logger);

      // Assert
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
    const longNotes = "a".repeat(300);

    // Act - FIT → KRD
    const krd = await reader(originalBuffer);

    // Add long notes to first step (bypassing schema)
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

    // Act & Assert - Should throw validation error
    expect(() => convertKRDToMessages(krd, logger)).toThrow(/notes.*256/i);
  });

  it("should accept notes at exactly 256 characters in round-trip", async () => {
    // Arrange
    const logger = createMockLogger();
    const reader = createGarminFitSdkReader(logger);
    const originalBuffer = loadFitFixture("WorkoutIndividualSteps.fit");
    const maxNotes = "a".repeat(256);

    // Act - FIT → KRD
    const krd = await reader(originalBuffer);

    // Add max-length notes to first step
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

    // Act - KRD → FIT messages
    const messages = convertKRDToMessages(krd, logger);

    // Assert - Notes should be preserved at 256 characters
    const stepMsg = messages.find(
      (msg: unknown) =>
        (msg as { mesgNum?: number }).mesgNum ===
          FIT_MESSAGE_NUMBERS.WORKOUT_STEP &&
        (msg as { messageIndex?: number }).messageIndex === 0
    ) as { mesgNum: number; [key: string]: unknown } | undefined;

    expect(stepMsg?.notes).toBe(maxNotes);
    expect((stepMsg?.notes as string).length).toBe(256);
  });

  it("should omit notes when undefined in round-trip", async () => {
    // Arrange
    const logger = createMockLogger();
    const reader = createGarminFitSdkReader(logger);
    const originalBuffer = loadFitFixture("WorkoutIndividualSteps.fit");

    // Act - FIT → KRD
    const krd = await reader(originalBuffer);

    // Ensure notes is undefined
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

    // Act - KRD → FIT messages
    const messages = convertKRDToMessages(krd, logger);

    // Assert
    const stepMsg = messages.find(
      (msg: unknown) =>
        (msg as { mesgNum?: number }).mesgNum ===
          FIT_MESSAGE_NUMBERS.WORKOUT_STEP &&
        (msg as { messageIndex?: number }).messageIndex === 0
    ) as { mesgNum: number; [key: string]: unknown } | undefined;

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

    // Act - FIT → KRD
    const krd = await reader(originalBuffer);

    // Add notes to all steps
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

    // Act - KRD → FIT messages
    const messages = convertKRDToMessages(krd, logger);

    // Assert - Check all steps have correct notes
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

    // Act - FIT → KRD
    const krd = await reader(originalBuffer);

    // Set both subSport and notes
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

    // Act - KRD → FIT messages
    const messages = convertKRDToMessages(krd, logger);

    // Assert - Check workout message has subSport
    const workoutMsg = messages.find(
      (msg: unknown) =>
        (msg as { mesgNum?: number }).mesgNum === FIT_MESSAGE_NUMBERS.WORKOUT
    ) as { mesgNum: number; [key: string]: unknown } | undefined;

    expect(workoutMsg?.subSport).toBe(testSubSport);

    // Assert - Check step message has notes
    const stepMsg = messages.find(
      (msg: unknown) =>
        (msg as { mesgNum?: number }).mesgNum ===
          FIT_MESSAGE_NUMBERS.WORKOUT_STEP &&
        (msg as { messageIndex?: number }).messageIndex === 0
    ) as { mesgNum: number; [key: string]: unknown } | undefined;

    expect(stepMsg?.notes).toBe(testNotes);
  });
});
