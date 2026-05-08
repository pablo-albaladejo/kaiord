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
import {
  CLIPBOARD_READ_TRIPLE,
  CLIPBOARD_WRITE_TRIPLE,
  COOLDOWN_SECONDS,
  INTERVAL_SECONDS,
  RECOVERY_LONG_SECONDS,
  RECOVERY_SHORT_SECONDS,
  REPEAT_COUNT_DEFAULT,
  STEP_INDEX_FIRST,
  STEP_INDEX_FOURTH,
  STEP_INDEX_SECOND,
  STEP_INDEX_THIRD,
  STEPS_AFTER_SINGLE_PASTE,
  STEPS_AFTER_TRIPLE_PASTE,
  STEPS_AFTER_TWO_ITEMS,
  WARMUP_SECONDS,
  WATTS_RECOVERY,
  WATTS_TEMPO,
  WATTS_TEMPO_PLUS,
  WATTS_THRESHOLD,
  WATTS_VO2_MAX,
} from "./copy-paste-integration.test-fixtures";
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
        stepIndex: STEP_INDEX_FIRST,
        durationType: "time",
        duration: { type: "time", seconds: WARMUP_SECONDS },
        targetType: "power",
        target: { type: "power", value: { unit: "watts", value: WATTS_TEMPO } },
      };
      const step2: WorkoutStep = {
        stepIndex: STEP_INDEX_SECOND,
        durationType: "time",
        duration: { type: "time", seconds: INTERVAL_SECONDS },
        targetType: "power",
        target: {
          type: "power",
          value: { unit: "watts", value: WATTS_TEMPO_PLUS },
        },
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
      const copyResult = await copyStepAction(krd, STEP_INDEX_FIRST);
      expect(copyResult.success).toBe(true);
      expect(mockWriteText).toHaveBeenCalledOnce();
      const pasteResult = await pasteStepAction(krd);
      expect(pasteResult.success).toBe(true);
      expect(pasteResult.updatedKrd).toBeDefined();
      expect(
        pasteResult.updatedKrd!.extensions!.structured_workout!.steps
      ).toHaveLength(STEPS_AFTER_SINGLE_PASTE);
      const steps =
        pasteResult.updatedKrd!.extensions!.structured_workout!.steps;

      // Act
      const pastedStep = steps[STEP_INDEX_THIRD] as WorkoutStep;

      // Assert
      expect(pastedStep.durationType).toBe("time");
      expect(pastedStep.duration).toEqual({
        type: "time",
        seconds: WARMUP_SECONDS,
      });
      expect(pastedStep.targetType).toBe("power");
      expect(pastedStep.target).toEqual({
        type: "power",
        value: { unit: "watts", value: WATTS_TEMPO },
      });
    });

    it("should copy and paste a repetition block successfully", async () => {
      // Arrange
      const step1: WorkoutStep = {
        stepIndex: STEP_INDEX_FIRST,
        durationType: "time",
        duration: { type: "time", seconds: RECOVERY_LONG_SECONDS },
        targetType: "power",
        target: {
          type: "power",
          value: { unit: "watts", value: WATTS_VO2_MAX },
        },
      };
      const step2: WorkoutStep = {
        stepIndex: STEP_INDEX_SECOND,
        durationType: "time",
        duration: { type: "time", seconds: RECOVERY_SHORT_SECONDS },
        targetType: "power",
        target: {
          type: "power",
          value: { unit: "watts", value: WATTS_RECOVERY },
        },
      };
      const block: RepetitionBlock = {
        repeatCount: REPEAT_COUNT_DEFAULT,
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
      const copyResult = await copyStepAction(krd, STEP_INDEX_FIRST);
      expect(copyResult.success).toBe(true);
      expect(copyResult.message).toBe("Repetition block copied to clipboard");
      const pasteResult = await pasteStepAction(krd);
      expect(pasteResult.success).toBe(true);
      expect(pasteResult.message).toBe("Repetition block pasted successfully");
      expect(
        pasteResult.updatedKrd!.extensions!.structured_workout!.steps
      ).toHaveLength(STEPS_AFTER_TWO_ITEMS);

      // Act
      const pastedBlock = pasteResult.updatedKrd!.extensions!
        .structured_workout!.steps[STEP_INDEX_SECOND] as RepetitionBlock;

      // Assert
      expect(pastedBlock.repeatCount).toBe(REPEAT_COUNT_DEFAULT);
      expect(pastedBlock.steps).toHaveLength(STEPS_AFTER_TWO_ITEMS);
    });

    it("should recalculate step indices after paste", async () => {
      // Arrange
      const step1: WorkoutStep = {
        stepIndex: STEP_INDEX_FIRST,
        durationType: "time",
        duration: { type: "time", seconds: WARMUP_SECONDS },
        targetType: "power",
        target: { type: "power", value: { unit: "watts", value: WATTS_TEMPO } },
      };
      const step2: WorkoutStep = {
        stepIndex: STEP_INDEX_SECOND,
        durationType: "time",
        duration: { type: "time", seconds: INTERVAL_SECONDS },
        targetType: "power",
        target: {
          type: "power",
          value: { unit: "watts", value: WATTS_TEMPO_PLUS },
        },
      };
      const step3: WorkoutStep = {
        stepIndex: STEP_INDEX_THIRD,
        durationType: "time",
        duration: { type: "time", seconds: COOLDOWN_SECONDS },
        targetType: "power",
        target: {
          type: "power",
          value: { unit: "watts", value: WATTS_THRESHOLD },
        },
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
      await copyStepAction(krd, STEP_INDEX_FIRST);
      const pasteResult = await pasteStepAction(krd, STEP_INDEX_SECOND);

      // Act
      const steps =
        pasteResult.updatedKrd!.extensions!.structured_workout!.steps;

      // Assert
      expect(steps).toHaveLength(STEPS_AFTER_TRIPLE_PASTE);
      expect((steps[STEP_INDEX_FIRST] as WorkoutStep).stepIndex).toBe(
        STEP_INDEX_FIRST
      );
      expect((steps[STEP_INDEX_SECOND] as WorkoutStep).stepIndex).toBe(
        STEP_INDEX_SECOND
      );
      expect((steps[STEP_INDEX_THIRD] as WorkoutStep).stepIndex).toBe(
        STEP_INDEX_THIRD
      );
      expect((steps[STEP_INDEX_FOURTH] as WorkoutStep).stepIndex).toBe(
        STEP_INDEX_FOURTH
      );
    });

    it("should handle multiple copy/paste operations", async () => {
      // Arrange
      const step1: WorkoutStep = {
        stepIndex: STEP_INDEX_FIRST,
        durationType: "time",
        duration: { type: "time", seconds: WARMUP_SECONDS },
        targetType: "power",
        target: { type: "power", value: { unit: "watts", value: WATTS_TEMPO } },
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
      await copyStepAction(krd, STEP_INDEX_FIRST);
      const paste1 = await pasteStepAction(krd);
      await copyStepAction(paste1.updatedKrd!, STEP_INDEX_FIRST);
      const paste2 = await pasteStepAction(paste1.updatedKrd!);
      await copyStepAction(paste2.updatedKrd!, STEP_INDEX_FIRST);

      // Act
      const paste3 = await pasteStepAction(paste2.updatedKrd!);

      // Assert
      expect(
        paste3.updatedKrd!.extensions!.structured_workout!.steps
      ).toHaveLength(STEPS_AFTER_TRIPLE_PASTE);
      expect(mockWriteText).toHaveBeenCalledTimes(CLIPBOARD_WRITE_TRIPLE);
      expect(mockReadText).toHaveBeenCalledTimes(CLIPBOARD_READ_TRIPLE);
    });
  });

  describe("error recovery", () => {
    it("should handle clipboard corruption between copy and paste", async () => {
      // Arrange
      const step: WorkoutStep = {
        stepIndex: STEP_INDEX_FIRST,
        durationType: "time",
        duration: { type: "time", seconds: WARMUP_SECONDS },
        targetType: "power",
        target: { type: "power", value: { unit: "watts", value: WATTS_TEMPO } },
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
      const copyResult = await copyStepAction(krd, STEP_INDEX_FIRST);

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
        stepIndex: STEP_INDEX_FIRST,
        durationType: "time",
        duration: { type: "time", seconds: WARMUP_SECONDS },
        targetType: "power",
        target: { type: "power", value: { unit: "watts", value: WATTS_TEMPO } },
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
