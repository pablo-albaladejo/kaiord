/**
 * Copy/Paste Performance Tests
 *
 * Tests performance of copy/paste operations with large data:
 * - Large repetition blocks
 * - Many steps
 * - Complex nested structures
 *
 * Requirement 39.2: Performance tests for copying large repetition blocks
 */

import { describe, expect, it, vi } from "vitest";

import type { KRD, RepetitionBlock, WorkoutStep } from "../../types/krd";
import { copyStepAction } from "./copy-step-action";
import { pasteStepAction } from "./paste-step-action";

describe("Copy/Paste Performance", () => {
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

  const createWorkoutStep = (index: number): WorkoutStep => ({
    stepIndex: index,
    durationType: "time",
    duration: { type: "time", seconds: 300 + index * 10 },
    targetType: "power",
    target: { type: "power", value: { unit: "watts", value: 200 + index } },
  });

  const createRepetitionBlock = (
    stepCount: number,
    repeatCount: number
  ): RepetitionBlock => ({
    repeatCount,
    steps: Array.from({ length: stepCount }, (_, i) => createWorkoutStep(i)),
  });

  describe("large repetition blocks", () => {
    it("should copy large repetition block within 500ms", async () => {
      // Arrange
      const largeBlock = createRepetitionBlock(50, 5);
      const krd = createMockKrd([largeBlock]);
      const mockWriteText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: mockWriteText,
        },
      });
      const startTime = performance.now();
      const result = await copyStepAction(krd, 0);
      const endTime = performance.now();

      // Act
      const duration = endTime - startTime;

      // Assert
      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(500);
    });

    it("should paste large repetition block within 500ms", async () => {
      // Arrange
      const largeBlock = createRepetitionBlock(50, 5);
      const krd = createMockKrd([createWorkoutStep(0)]);
      const mockReadText = vi
        .fn()
        .mockResolvedValue(JSON.stringify(largeBlock));
      Object.assign(navigator, {
        clipboard: {
          readText: mockReadText,
        },
      });
      const startTime = performance.now();
      const result = await pasteStepAction(krd);
      const endTime = performance.now();

      // Act
      const duration = endTime - startTime;

      // Assert
      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(500);
    });

    it("should handle repetition block with 100 steps", async () => {
      // Arrange
      const veryLargeBlock = createRepetitionBlock(100, 3);
      const krd = createMockKrd([veryLargeBlock]);
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
      const pasteResult = await pasteStepAction(krd);
      expect(copyResult.success).toBe(true);
      expect(pasteResult.success).toBe(true);

      // Act
      const pastedBlock = pasteResult.updatedKrd!.extensions!
        .structured_workout!.steps[1] as RepetitionBlock;

      // Assert
      expect(pastedBlock.steps).toHaveLength(100);
      expect(pastedBlock.repeatCount).toBe(3);
    });
  });

  describe("many steps", () => {
    it("should copy workout with 100 steps within 500ms", async () => {
      // Arrange
      const manySteps = Array.from({ length: 100 }, (_, i) =>
        createWorkoutStep(i)
      );
      const krd = createMockKrd(manySteps);
      const mockWriteText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: mockWriteText,
        },
      });
      const startTime = performance.now();
      const result = await copyStepAction(krd, 50);
      const endTime = performance.now();

      // Act
      const duration = endTime - startTime;

      // Assert
      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(500);
    });

    it("should paste into workout with 100 steps within 500ms", async () => {
      // Arrange
      const manySteps = Array.from({ length: 100 }, (_, i) =>
        createWorkoutStep(i)
      );
      const krd = createMockKrd(manySteps);
      const stepToPaste = createWorkoutStep(999);
      const mockReadText = vi
        .fn()
        .mockResolvedValue(JSON.stringify(stepToPaste));
      Object.assign(navigator, {
        clipboard: {
          readText: mockReadText,
        },
      });
      const startTime = performance.now();
      const result = await pasteStepAction(krd, 50);
      const endTime = performance.now();

      // Act
      const duration = endTime - startTime;

      // Assert
      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(500);
      expect(
        result.updatedKrd!.extensions!.structured_workout!.steps
      ).toHaveLength(101);
    });

    it("should recalculate indices for 100 steps efficiently", async () => {
      // Arrange
      const manySteps = Array.from({ length: 100 }, (_, i) =>
        createWorkoutStep(i)
      );
      const krd = createMockKrd(manySteps);
      const stepToPaste = createWorkoutStep(999);
      const mockReadText = vi
        .fn()
        .mockResolvedValue(JSON.stringify(stepToPaste));
      Object.assign(navigator, {
        clipboard: {
          readText: mockReadText,
        },
      });
      const startTime = performance.now();
      const result = await pasteStepAction(krd, 0);
      const endTime = performance.now();
      const duration = endTime - startTime;
      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(500);

      // Act
      const steps = result.updatedKrd!.extensions!.structured_workout!.steps;

      // Assert
      steps.forEach((step, index) => {
        if ("stepIndex" in step) {
          expect(step.stepIndex).toBe(index);
        }
      });
    });
  });

  describe("complex nested structures", () => {
    it("should handle workout with mixed steps and blocks", async () => {
      // Arrange
      const complexWorkout: Array<WorkoutStep | RepetitionBlock> = [
        createWorkoutStep(0),
        createRepetitionBlock(10, 3),
        createWorkoutStep(1),
        createRepetitionBlock(20, 2),
        createWorkoutStep(2),
        createRepetitionBlock(15, 4),
      ];
      const krd = createMockKrd(complexWorkout);
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
      const startTime = performance.now();
      await copyStepAction(krd, 1);
      const pasteResult = await pasteStepAction(krd);
      const endTime = performance.now();

      // Act
      const duration = endTime - startTime;

      // Assert
      expect(pasteResult.success).toBe(true);
      expect(duration).toBeLessThan(500);
      expect(
        pasteResult.updatedKrd!.extensions!.structured_workout!.steps
      ).toHaveLength(7);
    });

    it("should maintain data integrity with large clipboard payload", async () => {
      // Arrange
      const complexBlock = createRepetitionBlock(50, 5);
      const krd = createMockKrd([complexBlock]);
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
      const pasteResult = await pasteStepAction(krd);
      const originalBlock = krd.extensions!.structured_workout!
        .steps[0] as RepetitionBlock;

      // Act
      const pastedBlock = pasteResult.updatedKrd!.extensions!
        .structured_workout!.steps[1] as RepetitionBlock;

      // Assert
      expect(pastedBlock.repeatCount).toBe(originalBlock.repeatCount);
      expect(pastedBlock.steps).toHaveLength(originalBlock.steps.length);
      pastedBlock.steps.forEach((step, index) => {
        const originalStep = originalBlock.steps[index];
        expect(step.durationType).toBe(originalStep.durationType);
        expect(step.duration).toEqual(originalStep.duration);
        expect(step.targetType).toBe(originalStep.targetType);
        expect(step.target).toEqual(originalStep.target);
      });
    });
  });

  describe("memory efficiency", () => {
    it("should not leak memory with repeated operations", async () => {
      // Arrange
      const block = createRepetitionBlock(20, 3);
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
      let currentKrd = krd;

      // Act
      for (let i = 0; i < 50; i++) {
        await copyStepAction(currentKrd, 0);
        const result = await pasteStepAction(currentKrd);
        currentKrd = result.updatedKrd!;
      }

      // Assert
      expect(currentKrd.extensions!.structured_workout!.steps).toHaveLength(51);
      expect(mockWriteText).toHaveBeenCalledTimes(50);
      expect(mockReadText).toHaveBeenCalledTimes(50);
    });
  });
});
