import { describe, expect, it } from "vitest";

import type { KRD, Workout } from "../types/krd";
import type { EditorCommandGuardInput } from "./editor-command-guards";
import { buildEditorCommandGuards } from "./editor-command-guards";

const step = (id: string, stepIndex: number) => ({
  id,
  stepIndex,
  durationType: "time" as const,
  durationValue: 60,
  targetType: "open" as const,
  intensity: "active" as const,
});

const NESTED = step("nested-uuid", 0);

// Block ids are UUIDs from defaultIdProvider(), never the legacy `block-*`.
const BLOCK = {
  id: "0f3a9c1e-block-uuid",
  repeatCount: 3,
  steps: [NESTED],
};

const WORKOUT = {
  steps: [step("step-uuid", 0), BLOCK],
} as unknown as Workout;

const BLOCKS_ONLY = { steps: [BLOCK] } as unknown as Workout;

const build = (overrides: Partial<EditorCommandGuardInput> = {}) =>
  buildEditorCommandGuards({
    currentWorkout: {} as KRD,
    workout: WORKOUT,
    selectedStepId: null,
    selectedStepIds: [],
    hasClipboard: true,
    canUndo: false,
    canRedo: false,
    ...overrides,
  });

describe("buildEditorCommandGuards", () => {
  describe("a top-level step is selected", () => {
    it("should allow cut, copy and delete", () => {
      // Arrange

      // Act
      const guards = build({ selectedStepId: "step-uuid" });

      // Assert
      expect(guards).toMatchObject({
        canCut: true,
        canCopy: true,
        canDelete: true,
      });
    });

    it("should not allow ungroup", () => {
      // Arrange

      // Act
      const guards = build({ selectedStepId: "step-uuid" });

      // Assert
      expect(guards.canUngroup).toBe(false);
    });
  });

  describe("a repetition block is selected", () => {
    it("should allow ungroup", () => {
      // Arrange

      // Act
      const guards = build({ selectedStepId: BLOCK.id });

      // Assert
      expect(guards.canUngroup).toBe(true);
    });

    it("should refuse cut, copy and delete, which would all no-op", () => {
      // Arrange

      // Act
      const guards = build({ selectedStepId: BLOCK.id });

      // Assert
      expect(guards).toMatchObject({
        canCut: false,
        canCopy: false,
        canDelete: false,
      });
    });
  });

  describe("a step inside a block is selected", () => {
    it("should refuse cut, copy, delete and ungroup", () => {
      // Arrange

      // Act
      const guards = build({ selectedStepId: NESTED.id });

      // Assert
      expect(guards).toMatchObject({
        canCut: false,
        canCopy: false,
        canDelete: false,
        canUngroup: false,
      });
    });
  });

  describe("nothing is selected", () => {
    it("should refuse every selection-dependent command", () => {
      // Arrange

      // Act
      const guards = build();

      // Assert
      expect(guards).toMatchObject({
        canCut: false,
        canCopy: false,
        canDelete: false,
        canUngroup: false,
        canGroup: false,
      });
    });
  });

  describe("cut versus a multi-selection", () => {
    it("should allow cut with one selected id", () => {
      // Arrange

      // Act
      const guards = build({
        selectedStepId: "step-uuid",
        selectedStepIds: ["step-uuid"],
      });

      // Assert
      expect(guards.canCut).toBe(true);
    });

    it("should refuse cut with two selected ids, as the thunk does", () => {
      // Arrange

      // Act
      const guards = build({
        selectedStepId: "step-uuid",
        selectedStepIds: ["step-uuid", "other"],
      });

      // Assert
      expect(guards).toMatchObject({ canCut: false, canCopy: true });
    });
  });

  describe("select-all", () => {
    it("should allow select-all when a step carries a stepIndex", () => {
      // Arrange

      // Act
      const guards = build();

      // Assert
      expect(guards.canSelectAll).toBe(true);
    });

    it("should refuse select-all in a blocks-only workout", () => {
      // Arrange

      // Act
      const guards = build({ workout: BLOCKS_ONLY });

      // Assert
      expect(guards.canSelectAll).toBe(false);
    });

    it("should refuse select-all with no workout", () => {
      // Arrange

      // Act
      const guards = build({ workout: undefined });

      // Assert
      expect(guards.canSelectAll).toBe(false);
    });
  });

  describe("paste", () => {
    it("should allow paste with clipboard content and a workout", () => {
      // Arrange

      // Act
      const guards = build();

      // Assert
      expect(guards.canPaste).toBe(true);
    });

    it("should refuse paste with an empty clipboard", () => {
      // Arrange

      // Act
      const guards = build({ hasClipboard: false });

      // Assert
      expect(guards.canPaste).toBe(false);
    });

    it("should refuse paste with no workout to paste into", () => {
      // Arrange

      // Act
      const guards = build({ workout: undefined });

      // Assert
      expect(guards.canPaste).toBe(false);
    });
  });

  describe("group", () => {
    it("should allow group from two selected ids", () => {
      // Arrange

      // Act
      const guards = build({ selectedStepIds: ["a", "b"] });

      // Assert
      expect(guards).toMatchObject({ canGroup: true, selectedCount: 2 });
    });
  });

  describe("save", () => {
    it("should refuse save with no loaded workout", () => {
      // Arrange

      // Act
      const guards = build({ currentWorkout: null });

      // Assert
      expect(guards.canSave).toBe(false);
    });
  });
});
