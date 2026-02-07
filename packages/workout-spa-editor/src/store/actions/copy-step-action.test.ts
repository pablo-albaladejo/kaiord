import { describe, expect, it, vi } from "vitest";
import type { KRD, WorkoutStep } from "../../types/krd";
import { copyStepAction } from "./copy-step-action";

describe("copyStepAction", () => {
  describe("successful copy", () => {
    it("should copy step to clipboard and return success", async () => {
      // Arrange
      const step: WorkoutStep = {
        stepIndex: 0,
        durationType: "time",
        duration: { type: "time", seconds: 300 },
        targetType: "power",
        target: { type: "power", value: { unit: "watts", value: 200 } },
      };
      const krd: KRD = {
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
            steps: [step],
          },
        },
      };

      const mockWriteText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: mockWriteText,
        },
      });

      // Act
      const result = await copyStepAction(krd, 0);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe("Step copied to clipboard");
      expect(mockWriteText).toHaveBeenCalledOnce();
      expect(mockWriteText).toHaveBeenCalledWith(JSON.stringify(step, null, 2));
    });

    it("should copy repetition block to clipboard", async () => {
      // Arrange
      const step1: WorkoutStep = {
        stepIndex: 0,
        durationType: "time",
        duration: { type: "time", seconds: 300 },
        targetType: "power",
        target: { type: "power", value: { unit: "watts", value: 200 } },
      };
      const step2: WorkoutStep = {
        stepIndex: 1,
        durationType: "time",
        duration: { type: "time", seconds: 300 },
        targetType: "power",
        target: { type: "power", value: { unit: "watts", value: 250 } },
      };
      const block = {
        repeatCount: 3,
        steps: [step1, step2],
      };
      const krd: KRD = {
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
            steps: [block],
          },
        },
      };

      const mockWriteText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: mockWriteText,
        },
      });

      // Act
      const result = await copyStepAction(krd, 0);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe("Repetition block copied to clipboard");
      expect(mockWriteText).toHaveBeenCalledOnce();
    });
  });

  describe("error handling", () => {
    it("should return error when no workout found", async () => {
      // Arrange
      const krd: KRD = {
        version: "1.0",
        type: "structured_workout",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "running",
        },
        extensions: {},
      };

      // Act
      const result = await copyStepAction(krd, 0);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe("No workout found");
    });

    it("should return error when step not found", async () => {
      // Arrange
      const step: WorkoutStep = {
        stepIndex: 0,
        durationType: "time",
        duration: { type: "time", seconds: 300 },
        targetType: "power",
        target: { type: "power", value: { unit: "watts", value: 200 } },
      };
      const krd: KRD = {
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
            steps: [step],
          },
        },
      };

      // Act
      const result = await copyStepAction(krd, 5);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe("Step not found");
    });

    it("should return error when clipboard write fails", async () => {
      // Arrange
      const step: WorkoutStep = {
        stepIndex: 0,
        durationType: "time",
        duration: { type: "time", seconds: 300 },
        targetType: "power",
        target: { type: "power", value: { unit: "watts", value: 200 } },
      };
      const krd: KRD = {
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
            steps: [step],
          },
        },
      };

      const mockWriteText = vi
        .fn()
        .mockRejectedValue(new Error("Clipboard error"));
      Object.assign(navigator, {
        clipboard: {
          writeText: mockWriteText,
        },
      });

      // Act
      const result = await copyStepAction(krd, 0);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe("Failed to copy to clipboard");
    });
  });
});
