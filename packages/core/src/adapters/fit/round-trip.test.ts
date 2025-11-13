import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { createMockLogger } from "../../tests/helpers/test-utils";
import { createGarminFitSdkReader } from "./garmin-fitsdk";
import { convertKRDToMessages } from "./krd-to-fit/krd-to-fit.converter";

describe("Round-trip conversion tests", () => {
  describe("Priority 1 fields - subSport", () => {
    it("should preserve subSport through FIT → KRD → FIT conversion", async () => {
      // Arrange
      const logger = createMockLogger();
      const reader = createGarminFitSdkReader(logger);
      const fitPath = join(
        __dirname,
        "../../tests/fixtures/fit-files/WorkoutIndividualSteps.fit"
      );
      const originalBuffer = readFileSync(fitPath);

      // Act - FIT → KRD
      const krd = await reader.readToKRD(originalBuffer);

      // Manually set subSport for testing (since test files may not have it)
      if (krd.extensions?.workout) {
        const workout = krd.extensions.workout as {
          name?: string;
          sport: string;
          subSport?: string;
          steps: Array<unknown>;
        };
        workout.subSport = "trail";
      }

      // Act - KRD → FIT messages
      const messages = convertKRDToMessages(krd, logger);

      // Assert - Check workout message has subSport
      const workoutMsg = messages.find(
        (msg: unknown) => (msg as { type: string }).type === "workoutMesgs"
      ) as { type: string; workoutMesg: Record<string, unknown> } | undefined;

      expect(workoutMsg).toBeDefined();
      expect(workoutMsg?.workoutMesg.subSport).toBe("trail");
    });

    it("should preserve exact subSport string value", async () => {
      // Arrange
      const logger = createMockLogger();
      const reader = createGarminFitSdkReader(logger);
      const fitPath = join(
        __dirname,
        "../../tests/fixtures/fit-files/WorkoutIndividualSteps.fit"
      );
      const originalBuffer = readFileSync(fitPath);

      // Test multiple subSport values
      const subSportValues = [
        "trail",
        "road",
        "track",
        "treadmill",
        "mountain",
      ];

      for (const subSport of subSportValues) {
        // Act - FIT → KRD
        const krd = await reader.readToKRD(originalBuffer);

        // Set subSport
        if (krd.extensions?.workout) {
          const workout = krd.extensions.workout as {
            name?: string;
            sport: string;
            subSport?: string;
            steps: Array<unknown>;
          };
          workout.subSport = subSport;
        }

        // Act - KRD → FIT messages
        const messages = convertKRDToMessages(krd, logger);

        // Assert
        const workoutMsg = messages.find(
          (msg: unknown) => (msg as { type: string }).type === "workoutMesgs"
        ) as { type: string; workoutMesg: Record<string, unknown> } | undefined;

        expect(workoutMsg?.workoutMesg.subSport).toBe(subSport);
      }
    });

    it("should omit subSport when undefined in round-trip", async () => {
      // Arrange
      const logger = createMockLogger();
      const reader = createGarminFitSdkReader(logger);
      const fitPath = join(
        __dirname,
        "../../tests/fixtures/fit-files/WorkoutIndividualSteps.fit"
      );
      const originalBuffer = readFileSync(fitPath);

      // Act - FIT → KRD
      const krd = await reader.readToKRD(originalBuffer);

      // Ensure subSport is undefined
      if (krd.extensions?.workout) {
        const workout = krd.extensions.workout as {
          name?: string;
          sport: string;
          subSport?: string;
          steps: Array<unknown>;
        };
        workout.subSport = undefined;
      }

      // Act - KRD → FIT messages
      const messages = convertKRDToMessages(krd, logger);

      // Assert
      const workoutMsg = messages.find(
        (msg: unknown) => (msg as { type: string }).type === "workoutMesgs"
      ) as { type: string; workoutMesg: Record<string, unknown> } | undefined;

      expect(workoutMsg?.workoutMesg).not.toHaveProperty("subSport");
    });
  });

  describe("Priority 1 fields - notes", () => {
    it("should preserve notes through FIT → KRD → FIT conversion", async () => {
      // Arrange
      const logger = createMockLogger();
      const reader = createGarminFitSdkReader(logger);
      const fitPath = join(
        __dirname,
        "../../tests/fixtures/fit-files/WorkoutIndividualSteps.fit"
      );
      const originalBuffer = readFileSync(fitPath);
      const testNotes = "Focus on form and breathing";

      // Act - FIT → KRD
      const krd = await reader.readToKRD(originalBuffer);

      // Add notes to first step
      if (krd.extensions?.workout) {
        const workout = krd.extensions.workout as {
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
          (msg as { type: string }).type === "workoutStepMesgs" &&
          (msg as { workoutStepMesg: { messageIndex: number } }).workoutStepMesg
            .messageIndex === 0
      ) as
        | { type: string; workoutStepMesg: Record<string, unknown> }
        | undefined;

      expect(stepMsg).toBeDefined();
      expect(stepMsg?.workoutStepMesg.notes).toBe(testNotes);
    });

    it("should preserve exact notes string value", async () => {
      // Arrange
      const logger = createMockLogger();
      const reader = createGarminFitSdkReader(logger);
      const fitPath = join(
        __dirname,
        "../../tests/fixtures/fit-files/WorkoutIndividualSteps.fit"
      );
      const originalBuffer = readFileSync(fitPath);

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
        const krd = await reader.readToKRD(originalBuffer);

        // Add notes to first step
        if (krd.extensions?.workout) {
          const workout = krd.extensions.workout as {
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
            (msg as { type: string }).type === "workoutStepMesgs" &&
            (msg as { workoutStepMesg: { messageIndex: number } })
              .workoutStepMesg.messageIndex === 0
        ) as
          | { type: string; workoutStepMesg: Record<string, unknown> }
          | undefined;

        expect(stepMsg?.workoutStepMesg.notes).toBe(notes);
      }
    });

    it("should truncate notes exceeding 256 characters in round-trip", async () => {
      // Arrange
      const logger = createMockLogger();
      const reader = createGarminFitSdkReader(logger);
      const fitPath = join(
        __dirname,
        "../../tests/fixtures/fit-files/WorkoutIndividualSteps.fit"
      );
      const originalBuffer = readFileSync(fitPath);
      const longNotes = "a".repeat(300);

      // Act - FIT → KRD
      const krd = await reader.readToKRD(originalBuffer);

      // Add long notes to first step
      if (krd.extensions?.workout) {
        const workout = krd.extensions.workout as {
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

      // Act - KRD → FIT messages
      const messages = convertKRDToMessages(krd, logger);

      // Assert - Notes should be truncated to 256 characters
      const stepMsg = messages.find(
        (msg: unknown) =>
          (msg as { type: string }).type === "workoutStepMesgs" &&
          (msg as { workoutStepMesg: { messageIndex: number } }).workoutStepMesg
            .messageIndex === 0
      ) as
        | { type: string; workoutStepMesg: Record<string, unknown> }
        | undefined;

      expect(stepMsg?.workoutStepMesg.notes).toBe("a".repeat(256));
      expect((stepMsg?.workoutStepMesg.notes as string).length).toBe(256);
    });

    it("should omit notes when undefined in round-trip", async () => {
      // Arrange
      const logger = createMockLogger();
      const reader = createGarminFitSdkReader(logger);
      const fitPath = join(
        __dirname,
        "../../tests/fixtures/fit-files/WorkoutIndividualSteps.fit"
      );
      const originalBuffer = readFileSync(fitPath);

      // Act - FIT → KRD
      const krd = await reader.readToKRD(originalBuffer);

      // Ensure notes is undefined
      if (krd.extensions?.workout) {
        const workout = krd.extensions.workout as {
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
          (msg as { type: string }).type === "workoutStepMesgs" &&
          (msg as { workoutStepMesg: { messageIndex: number } }).workoutStepMesg
            .messageIndex === 0
      ) as
        | { type: string; workoutStepMesg: Record<string, unknown> }
        | undefined;

      expect(stepMsg?.workoutStepMesg).not.toHaveProperty("notes");
    });

    it("should preserve notes on multiple steps", async () => {
      // Arrange
      const logger = createMockLogger();
      const reader = createGarminFitSdkReader(logger);
      const fitPath = join(
        __dirname,
        "../../tests/fixtures/fit-files/WorkoutIndividualSteps.fit"
      );
      const originalBuffer = readFileSync(fitPath);
      const notesArray = [
        "Warm up",
        "Build intensity",
        "Maintain pace",
        "Cool down",
      ];

      // Act - FIT → KRD
      const krd = await reader.readToKRD(originalBuffer);

      // Add notes to all steps
      if (krd.extensions?.workout) {
        const workout = krd.extensions.workout as {
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
            (msg as { type: string }).type === "workoutStepMesgs" &&
            (msg as { workoutStepMesg: { messageIndex: number } })
              .workoutStepMesg.messageIndex === i
        ) as
          | { type: string; workoutStepMesg: Record<string, unknown> }
          | undefined;

        expect(stepMsg?.workoutStepMesg.notes).toBe(notesArray[i]);
      }
    });
  });

  describe("Combined Priority 1 fields", () => {
    it("should preserve both subSport and notes in round-trip", async () => {
      // Arrange
      const logger = createMockLogger();
      const reader = createGarminFitSdkReader(logger);
      const fitPath = join(
        __dirname,
        "../../tests/fixtures/fit-files/WorkoutIndividualSteps.fit"
      );
      const originalBuffer = readFileSync(fitPath);
      const testSubSport = "trail";
      const testNotes = "Focus on technique";

      // Act - FIT → KRD
      const krd = await reader.readToKRD(originalBuffer);

      // Set both subSport and notes
      if (krd.extensions?.workout) {
        const workout = krd.extensions.workout as {
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
        (msg: unknown) => (msg as { type: string }).type === "workoutMesgs"
      ) as { type: string; workoutMesg: Record<string, unknown> } | undefined;

      expect(workoutMsg?.workoutMesg.subSport).toBe(testSubSport);

      // Assert - Check step message has notes
      const stepMsg = messages.find(
        (msg: unknown) =>
          (msg as { type: string }).type === "workoutStepMesgs" &&
          (msg as { workoutStepMesg: { messageIndex: number } }).workoutStepMesg
            .messageIndex === 0
      ) as
        | { type: string; workoutStepMesg: Record<string, unknown> }
        | undefined;

      expect(stepMsg?.workoutStepMesg.notes).toBe(testNotes);
    });
  });
});
