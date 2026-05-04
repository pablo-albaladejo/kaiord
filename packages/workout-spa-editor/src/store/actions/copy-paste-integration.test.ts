/**
 * Copy/Paste Integration Tests
 *
 * Tests the complete copy/paste flow including:
 * - Copy action → Clipboard → Paste action
 * - Step index recalculation
 * - Repetition block handling
 *
 * Requirement 39.2: Complete copy/paste flow
 */

import { describe, expect, it, vi } from "vitest";

import type { KRD, RepetitionBlock, WorkoutStep } from "../../types/krd";
import { copyStepAction } from "./copy-step-action";
import { pasteStepAction } from "./paste-step-action";

describe("Copy/Paste Integration", () => {
  const createMockKrd = (steps: Array<WorkoutStep | RepetitionBlock>): KRD => ({
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
        steps,
      },
    },
  });

  describe("complete copy/paste flow", () => {
    it("should copy and paste a workout step successfully", async () => {
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
        duration: { type: "time", seconds: 360 },
        targetType: "power",
        target: { type: "power", value: { unit: "watts", value: 210 } },
      };
      const krd = createMockKrd([step1, step2]);
      let clipboardContent = "";
      const mockWriteText = vi.fn().mockImplementation((text: string) => {
        clipboardContent = text;
        return Promise.resolve();
      });
      const mockReadText = vi.fn().mockImplementation(() => {
        return Promise.resolve(clipboardContent);
      });
      Object.assign(navigator, {
        clipboard: {
          writeText: mockWriteText,
          readText: mockReadText,
        },
      });
      const copyResult = await copyStepAction(krd, 0);
      expect(copyResult.success).toBe(true);
      expect(mockWriteText).toHaveBeenCalledOnce();
      const pasteResult = await pasteStepAction(krd);
      expect(pasteResult.success).toBe(true);
      expect(pasteResult.updatedKrd).toBeDefined();
      expect(
        pasteResult.updatedKrd!.extensions!.structured_workout!.steps
      ).toHaveLength(3);
      const steps =
        pasteResult.updatedKrd!.extensions!.structured_workout!.steps;

      // Act
      const pastedStep = steps[2] as WorkoutStep;

      // Assert
      expect(pastedStep.durationType).toBe("time");
      expect(pastedStep.duration).toEqual({ type: "time", seconds: 300 });
      expect(pastedStep.targetType).toBe("power");
      expect(pastedStep.target).toEqual({
        type: "power",
        value: { unit: "watts", value: 200 },
      });
    });

    it("should copy and paste a repetition block successfully", async () => {
      // Arrange
      const step1: WorkoutStep = {
        stepIndex: 0,
        durationType: "time",
        duration: { type: "time", seconds: 120 },
        targetType: "power",
        target: { type: "power", value: { unit: "watts", value: 250 } },
      };
      const step2: WorkoutStep = {
        stepIndex: 1,
        durationType: "time",
        duration: { type: "time", seconds: 60 },
        targetType: "power",
        target: { type: "power", value: { unit: "watts", value: 150 } },
      };
      const block: RepetitionBlock = {
        repeatCount: 3,
        steps: [step1, step2],
      };
      const krd = createMockKrd([block]);
      let clipboardContent = "";
      const mockWriteText = vi.fn().mockImplementation((text: string) => {
        clipboardContent = text;
        return Promise.resolve();
      });
      const mockReadText = vi.fn().mockImplementation(() => {
        return Promise.resolve(clipboardContent);
      });
      Object.assign(navigator, {
        clipboard: {
          writeText: mockWriteText,
          readText: mockReadText,
        },
      });
      const copyResult = await copyStepAction(krd, 0);
      expect(copyResult.success).toBe(true);
      expect(copyResult.message).toBe("Repetition block copied to clipboard");
      const pasteResult = await pasteStepAction(krd);
      expect(pasteResult.success).toBe(true);
      expect(pasteResult.message).toBe("Repetition block pasted successfully");
      expect(
        pasteResult.updatedKrd!.extensions!.structured_workout!.steps
      ).toHaveLength(2);

      // Act
      const pastedBlock = pasteResult.updatedKrd!.extensions!
        .structured_workout!.steps[1] as RepetitionBlock;

      // Assert
      expect(pastedBlock.repeatCount).toBe(3);
      expect(pastedBlock.steps).toHaveLength(2);
    });

    it("should recalculate step indices after paste", async () => {
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
        duration: { type: "time", seconds: 360 },
        targetType: "power",
        target: { type: "power", value: { unit: "watts", value: 210 } },
      };
      const step3: WorkoutStep = {
        stepIndex: 2,
        durationType: "time",
        duration: { type: "time", seconds: 420 },
        targetType: "power",
        target: { type: "power", value: { unit: "watts", value: 220 } },
      };
      const krd = createMockKrd([step1, step2, step3]);
      let clipboardContent = "";
      const mockWriteText = vi.fn().mockImplementation((text: string) => {
        clipboardContent = text;
        return Promise.resolve();
      });
      const mockReadText = vi.fn().mockImplementation(() => {
        return Promise.resolve(clipboardContent);
      });
      Object.assign(navigator, {
        clipboard: {
          writeText: mockWriteText,
          readText: mockReadText,
        },
      });
      await copyStepAction(krd, 0);
      const pasteResult = await pasteStepAction(krd, 1);

      // Act
      const steps =
        pasteResult.updatedKrd!.extensions!.structured_workout!.steps;

      // Assert
      expect(steps).toHaveLength(4);
      expect((steps[0] as WorkoutStep).stepIndex).toBe(0);
      expect((steps[1] as WorkoutStep).stepIndex).toBe(1);
      expect((steps[2] as WorkoutStep).stepIndex).toBe(2);
      expect((steps[3] as WorkoutStep).stepIndex).toBe(3);
    });

    it("should handle multiple copy/paste operations", async () => {
      // Arrange
      const step1: WorkoutStep = {
        stepIndex: 0,
        durationType: "time",
        duration: { type: "time", seconds: 300 },
        targetType: "power",
        target: { type: "power", value: { unit: "watts", value: 200 } },
      };
      const krd = createMockKrd([step1]);
      let clipboardContent = "";
      const mockWriteText = vi.fn().mockImplementation((text: string) => {
        clipboardContent = text;
        return Promise.resolve();
      });
      const mockReadText = vi.fn().mockImplementation(() => {
        return Promise.resolve(clipboardContent);
      });
      Object.assign(navigator, {
        clipboard: {
          writeText: mockWriteText,
          readText: mockReadText,
        },
      });
      await copyStepAction(krd, 0);
      const paste1 = await pasteStepAction(krd);
      await copyStepAction(paste1.updatedKrd!, 0);
      const paste2 = await pasteStepAction(paste1.updatedKrd!);
      await copyStepAction(paste2.updatedKrd!, 0);

      // Act
      const paste3 = await pasteStepAction(paste2.updatedKrd!);

      // Assert
      expect(
        paste3.updatedKrd!.extensions!.structured_workout!.steps
      ).toHaveLength(4);
      expect(mockWriteText).toHaveBeenCalledTimes(3);
      expect(mockReadText).toHaveBeenCalledTimes(3);
    });
  });

  describe("error recovery", () => {
    it("should handle clipboard corruption between copy and paste", async () => {
      // Arrange
      const step: WorkoutStep = {
        stepIndex: 0,
        durationType: "time",
        duration: { type: "time", seconds: 300 },
        targetType: "power",
        target: { type: "power", value: { unit: "watts", value: 200 } },
      };
      const krd = createMockKrd([step]);
      const mockWriteText = vi.fn().mockResolvedValue(undefined);
      const mockReadText = vi
        .fn()
        .mockResolvedValue("corrupted clipboard content");
      Object.assign(navigator, {
        clipboard: {
          writeText: mockWriteText,
          readText: mockReadText,
        },
      });
      const copyResult = await copyStepAction(krd, 0);

      // Act
      const pasteResult = await pasteStepAction(krd);

      // Assert
      expect(copyResult.success).toBe(true);
      expect(pasteResult.success).toBe(false);
      expect(pasteResult.message).toBe("Invalid clipboard content");
    });

    it("should handle paste without prior copy", async () => {
      // Arrange
      const step: WorkoutStep = {
        stepIndex: 0,
        durationType: "time",
        duration: { type: "time", seconds: 300 },
        targetType: "power",
        target: { type: "power", value: { unit: "watts", value: 200 } },
      };
      const krd = createMockKrd([step]);
      const mockReadText = vi.fn().mockResolvedValue("");
      Object.assign(navigator, {
        clipboard: {
          readText: mockReadText,
        },
      });

      // Act
      const pasteResult = await pasteStepAction(krd);

      // Assert
      expect(pasteResult.success).toBe(false);
      expect(pasteResult.message).toBe("No content in clipboard");
    });
  });
});
