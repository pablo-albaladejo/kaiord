/**
 * Composite coverage for store -> guards -> context-menu props.
 *
 * `EditorContextMenuContent.test.tsx` is presentational: it feeds `show*` in by
 * hand, so a botched guard leaves it green. This pins the whole chain, and in
 * particular that block identity is resolved by `findById` rather than by
 * prefix-matching the legacy `block-*` id format.
 */
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Workout } from "../types/krd";
import { useEditorContextMenu } from "./use-editor-context-menu";

const hoisted = vi.hoisted(() => ({
  store: {} as Record<string, unknown>,
  clipboard: false,
}));

vi.mock("../store/selectors", () => ({
  useContextMenuStore: () => hoisted.store,
}));

vi.mock("../store/clipboard-store", () => ({
  hasClipboardContent: () => hoisted.clipboard,
}));

const step = (id: string, stepIndex: number) => ({
  id,
  stepIndex,
  durationType: "time" as const,
  durationValue: 60,
  targetType: "open" as const,
  intensity: "active" as const,
});

const NESTED = step("nested-uuid", 0);
const BLOCK = { id: "9b1c-uuid-block", repeatCount: 3, steps: [NESTED] };
const STEP = step("step-uuid", 0);

const workoutOf = (steps: Array<unknown>) => ({ steps }) as unknown as Workout;

const setStore = (overrides: Record<string, unknown> = {}): void => {
  const workout = (overrides.workout as Workout) ?? workoutOf([STEP, BLOCK]);
  hoisted.store = {
    currentWorkout: { extensions: { structured_workout: workout } },
    selectedStepId: null,
    selectedStepIds: [],
    selectStep: vi.fn(),
    clearStepSelection: vi.fn(),
    deleteStep: vi.fn(),
    copyStep: vi.fn(),
    pasteStep: vi.fn(),
    openCreateBlockDialog: vi.fn(),
    ungroupRepetitionBlock: vi.fn(),
    selectAllSteps: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
    canUndo: false,
    canRedo: false,
    reorderStep: vi.fn(),
    ...overrides,
  };
};

const menuOf = () => renderHook(() => useEditorContextMenu()).result.current;

describe("useEditorContextMenu", () => {
  beforeEach(() => {
    hoisted.clipboard = false;
    setStore();
  });

  describe("a repetition block is selected", () => {
    it("should offer ungroup", () => {
      // Arrange
      setStore({ selectedStepId: BLOCK.id });

      // Act
      const menu = menuOf().menu;

      // Assert
      expect(menu.showUngroup).toBe(true);
    });

    it("should not offer cut, copy or delete on a UUID block id", () => {
      // Arrange
      setStore({ selectedStepId: BLOCK.id });

      // Act
      const menu = menuOf().menu;

      // Assert
      expect(menu).toMatchObject({
        showCut: false,
        showCopy: false,
        showDelete: false,
      });
    });
  });

  describe("a step inside a block is selected", () => {
    it("should offer neither the clipboard items nor ungroup", () => {
      // Arrange
      setStore({ selectedStepId: NESTED.id });

      // Act
      const menu = menuOf().menu;

      // Assert
      expect(menu).toMatchObject({
        showCut: false,
        showCopy: false,
        showDelete: false,
        showUngroup: false,
      });
    });
  });

  describe("a top-level step is selected", () => {
    it("should offer cut, copy and delete but not ungroup", () => {
      // Arrange
      setStore({ selectedStepId: STEP.id });

      // Act
      const menu = menuOf().menu;

      // Assert
      expect(menu).toMatchObject({
        showCut: true,
        showCopy: true,
        showDelete: true,
        showUngroup: false,
      });
    });
  });

  describe("a blocks-only workout", () => {
    it("should not offer select-all", () => {
      // Arrange
      setStore({ workout: workoutOf([BLOCK]) });

      // Act
      const menu = menuOf().menu;

      // Assert
      expect(menu.showSelectAll).toBe(false);
    });

    it("should still offer ungroup for the selected block", () => {
      // Arrange
      setStore({ workout: workoutOf([BLOCK]), selectedStepId: BLOCK.id });

      // Act
      const menu = menuOf().menu;

      // Assert
      expect(menu.showUngroup).toBe(true);
    });
  });

  // The one visible change this fix makes to the shipped menu. Delete has
  // never worked on a multi-selection: both `toggleStepSelection` and
  // `selectAllSteps` leave `selectedStepId` null, so `onDelete` had no step to
  // act on and returned false. The menu offered it anyway; now it says so.
  describe("a multi-selection with no focused step", () => {
    it("should not offer delete, which has always been a no-op here", () => {
      // Arrange
      setStore({ selectedStepId: null, selectedStepIds: [STEP.id, "other"] });

      // Act
      const menu = menuOf().menu;

      // Assert
      expect(menu.showDelete).toBe(false);
    });

    it("should still offer group, which is what a multi-selection is for", () => {
      // Arrange
      setStore({ selectedStepId: null, selectedStepIds: [STEP.id, "other"] });

      // Act
      const menu = menuOf().menu;

      // Assert
      expect(menu.showGroup).toBe(true);
    });

    it("should keep the menu open rather than suppressing it entirely", () => {
      // Arrange
      setStore({ selectedStepId: null, selectedStepIds: [STEP.id, "other"] });

      // Act
      const ctx = menuOf();

      // Assert
      expect(ctx.hasAnyAction).toBe(true);
    });
  });

  describe("suppression", () => {
    it("should report no action for an empty workout and empty clipboard", () => {
      // Arrange
      setStore({ workout: workoutOf([]) });

      // Act
      const ctx = menuOf();

      // Assert
      expect(ctx.hasAnyAction).toBe(false);
    });

    it("should report an action once the clipboard holds a step", () => {
      // Arrange
      hoisted.clipboard = true;
      setStore({ workout: workoutOf([]) });

      // Act
      const ctx = menuOf();

      // Assert
      expect(ctx.hasAnyAction).toBe(true);
    });
  });

  describe("action wiring", () => {
    it("should ungroup the selected block through the store action", () => {
      // Arrange
      const ungroupRepetitionBlock = vi.fn();
      setStore({ selectedStepId: BLOCK.id, ungroupRepetitionBlock });

      // Act
      menuOf().menu.onUngroup();

      // Assert
      expect(ungroupRepetitionBlock).toHaveBeenCalledWith(BLOCK.id);
    });
  });
});
