/**
 * Paste Step Action Tests
 *
 * Tests for pasting workout steps from clipboard.
 * Requirement 39.2: Read step data from clipboard and insert at current position
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { KRD, RepetitionBlock, WorkoutStep } from "../../types/krd";
import { pasteStepAction } from "./paste-step-action";

describe("pasteStepAction", () => {
  const mockKrd: KRD = {
    version: "1.0",
    type: "structured_workout",
    metadata: {
      created: "2025-01-15T10:30:00Z",
      sport: "running",
    },
    extensions: {
      structured_workout: {
        name: "Test Workout",
        sport: "running",
        steps: [
          {
            stepIndex: 0,
            durationType: "time",
            duration: { type: "time", seconds: 300 },
            targetType: "power",
            target: {
              type: "power",
              value: { unit: "watts", value: 200 },
            },
          },
          {
            stepIndex: 1,
            durationType: "time",
            duration: { type: "time", seconds: 360 },
            targetType: "power",
            target: {
              type: "power",
              value: { unit: "watts", value: 210 },
            },
          },
        ],
      },
    },
  };

  const mockStep: WorkoutStep = {
    stepIndex: 99,
    durationType: "time",
    duration: { type: "time", seconds: 600 },
    targetType: "heart_rate",
    target: {
      type: "heart_rate",
      value: { unit: "bpm", value: 150 },
    },
  };

  const mockRepetitionBlock: RepetitionBlock = {
    repeatCount: 3,
    steps: [
      {
        stepIndex: 99,
        durationType: "time",
        duration: { type: "time", seconds: 120 },
        targetType: "power",
        target: {
          type: "power",
          value: { unit: "watts", value: 250 },
        },
      },
    ],
  };

  beforeEach(() => {
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        readText: vi.fn(),
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("successful paste", () => {
    it("should paste a workout step at the end when no insertIndex provided", async () => {
      // Arrange
      vi.spyOn(navigator.clipboard, "readText").mockResolvedValue(
        JSON.stringify(mockStep)
      );

      // Act
      const result = await pasteStepAction(mockKrd);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe("Step pasted successfully");
      expect(result.updatedKrd).toBeDefined();
      expect(
        result.updatedKrd!.extensions!.structured_workout!.steps
      ).toHaveLength(3);

      const steps = result.updatedKrd!.extensions!.structured_workout!.steps;
      expect(steps[2]).toMatchObject({
        durationType: "time",
        duration: { type: "time", seconds: 600 },
        targetType: "heart_rate",
      });
    });

    it("should paste a workout step at specified insertIndex", async () => {
      // Arrange
      vi.spyOn(navigator.clipboard, "readText").mockResolvedValue(
        JSON.stringify(mockStep)
      );

      // Act
      const result = await pasteStepAction(mockKrd, 1);

      // Assert
      expect(result.success).toBe(true);
      expect(
        result.updatedKrd!.extensions!.structured_workout!.steps
      ).toHaveLength(3);

      const steps = result.updatedKrd!.extensions!.structured_workout!.steps;
      expect(steps[1]).toMatchObject({
        durationType: "time",
        duration: { type: "time", seconds: 600 },
        targetType: "heart_rate",
      });
    });

    it("should recalculate step indices after pasting", async () => {
      // Arrange
      vi.spyOn(navigator.clipboard, "readText").mockResolvedValue(
        JSON.stringify(mockStep)
      );

      // Act
      const result = await pasteStepAction(mockKrd, 1);

      // Assert
      const steps = result.updatedKrd!.extensions!.structured_workout!.steps;
      expect(steps[0]).toHaveProperty("stepIndex", 0);
      expect(steps[1]).toHaveProperty("stepIndex", 1);
      expect(steps[2]).toHaveProperty("stepIndex", 2);
    });

    it("should paste a repetition block successfully", async () => {
      // Arrange
      vi.spyOn(navigator.clipboard, "readText").mockResolvedValue(
        JSON.stringify(mockRepetitionBlock)
      );

      // Act
      const result = await pasteStepAction(mockKrd);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe("Repetition block pasted successfully");
      expect(
        result.updatedKrd!.extensions!.structured_workout!.steps
      ).toHaveLength(3);

      const lastStep =
        result.updatedKrd!.extensions!.structured_workout!.steps[2];
      expect(lastStep).toHaveProperty("repeatCount", 3);
    });
  });

  describe("error handling", () => {
    it("should return error when no workout found", async () => {
      // Arrange
      const krdWithoutWorkout: KRD = {
        ...mockKrd,
        extensions: {},
      };

      // Act
      const result = await pasteStepAction(krdWithoutWorkout);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe("No workout found");
    });

    it("should return error when clipboard is empty", async () => {
      // Arrange
      vi.spyOn(navigator.clipboard, "readText").mockResolvedValue("");

      // Act
      const result = await pasteStepAction(mockKrd);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe("No content in clipboard");
    });

    it("should return error when clipboard contains invalid JSON", async () => {
      // Arrange
      vi.spyOn(navigator.clipboard, "readText").mockResolvedValue(
        "not valid json"
      );

      // Act
      const result = await pasteStepAction(mockKrd);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe("Invalid clipboard content");
    });

    it("should return error when clipboard contains invalid step structure", async () => {
      // Arrange
      vi.spyOn(navigator.clipboard, "readText").mockResolvedValue(
        JSON.stringify({ invalid: "data" })
      );

      // Act
      const result = await pasteStepAction(mockKrd);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe("Clipboard does not contain a valid step");
    });

    it("should return error when clipboard API fails", async () => {
      // Arrange - clipboard API fails, fallback returns empty
      vi.spyOn(navigator.clipboard, "readText").mockRejectedValue(
        new Error("Clipboard error")
      );

      // Act
      const result = await pasteStepAction(mockKrd);

      // Assert - fallback returns empty string, treated as empty clipboard
      expect(result.success).toBe(false);
      expect(result.message).toBe("No content in clipboard");
    });
  });
});
