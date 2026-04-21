import { describe, expect, it, vi } from "vitest";

import type { KeyboardHandlerDeps } from "./build-keyboard-handlers";
import { buildKeyboardHandlers } from "./build-keyboard-handlers";

vi.mock("../store/clipboard-store", () => ({
  hasClipboardContent: vi.fn(() => false),
}));

vi.mock("./save-workout", () => ({
  saveWorkout: vi.fn(),
}));

import { hasClipboardContent } from "../store/clipboard-store";

const mockDeps = (
  overrides: Partial<KeyboardHandlerDeps> = {}
): KeyboardHandlerDeps => ({
  currentWorkout: null,
  workout: undefined,
  stepIndex: () => null,
  canUndo: false,
  canRedo: false,
  undo: vi.fn(),
  redo: vi.fn(),
  reorderStep: vi.fn(),
  copyStep: vi.fn().mockResolvedValue(undefined),
  pasteStep: vi.fn().mockResolvedValue(undefined),
  deleteStep: vi.fn(),
  selectedStepId: null,
  selectedStepIds: [],
  openCreateBlockDialog: vi.fn(),
  ungroupRepetitionBlock: vi.fn(),
  selectAllSteps: vi.fn(),
  selectStep: vi.fn(),
  clearStepSelection: vi.fn(),
  ...overrides,
});

const makeWorkout = (stepCount: number) => ({
  steps: Array.from({ length: stepCount }, (_, i) => ({
    stepIndex: i,
    type: "active" as const,
  })),
});

describe("buildKeyboardHandlers return values", () => {
  describe("onSave", () => {
    it("returns true always", () => {
      const h = buildKeyboardHandlers(mockDeps());
      expect(h.onSave!()).toBe(true);
    });
  });

  describe("onUndo", () => {
    it("returns true always", () => {
      const h = buildKeyboardHandlers(mockDeps());
      expect(h.onUndo!()).toBe(true);
    });
  });

  describe("onRedo", () => {
    it("returns true always", () => {
      const h = buildKeyboardHandlers(mockDeps());
      expect(h.onRedo!()).toBe(true);
    });
  });

  describe("onMoveStepUp", () => {
    it("returns false when no step selected", () => {
      const h = buildKeyboardHandlers(mockDeps());
      expect(h.onMoveStepUp!()).toBe(false);
    });

    it("returns false when first step selected", () => {
      const h = buildKeyboardHandlers(
        mockDeps({ stepIndex: () => 0, workout: makeWorkout(3) })
      );
      expect(h.onMoveStepUp!()).toBe(false);
    });

    it("returns true when movable step selected", () => {
      const h = buildKeyboardHandlers(
        mockDeps({ stepIndex: () => 1, workout: makeWorkout(3) })
      );
      expect(h.onMoveStepUp!()).toBe(true);
    });
  });

  describe("onMoveStepDown", () => {
    it("returns false when no step selected", () => {
      const h = buildKeyboardHandlers(mockDeps());
      expect(h.onMoveStepDown!()).toBe(false);
    });

    it("returns false when last step selected", () => {
      const h = buildKeyboardHandlers(
        mockDeps({ stepIndex: () => 2, workout: makeWorkout(3) })
      );
      expect(h.onMoveStepDown!()).toBe(false);
    });

    it("returns true when movable step selected", () => {
      const h = buildKeyboardHandlers(
        mockDeps({ stepIndex: () => 0, workout: makeWorkout(3) })
      );
      expect(h.onMoveStepDown!()).toBe(true);
    });
  });

  describe("onCopy", () => {
    it("returns false when no step selected", () => {
      const h = buildKeyboardHandlers(mockDeps());
      expect(h.onCopy!()).toBe(false);
    });

    it("returns true when step selected", () => {
      const h = buildKeyboardHandlers(
        mockDeps({ stepIndex: () => 0, workout: makeWorkout(2) })
      );
      expect(h.onCopy!()).toBe(true);
    });
  });

  describe("onCut", () => {
    it("returns false when no step selected", () => {
      const h = buildKeyboardHandlers(mockDeps());
      expect(h.onCut!()).toBe(false);
    });

    it("returns false when multi-selection active", () => {
      const h = buildKeyboardHandlers(
        mockDeps({
          stepIndex: () => 0,
          workout: makeWorkout(3),
          selectedStepIds: ["step-0", "step-1"],
        })
      );
      expect(h.onCut!()).toBe(false);
    });

    it("returns true when single step selected", () => {
      const deps = mockDeps({
        stepIndex: () => 0,
        workout: makeWorkout(2),
        selectedStepIds: ["step-0"],
      });
      const h = buildKeyboardHandlers(deps);

      expect(h.onCut!()).toBe(true);
      expect(deps.copyStep).toHaveBeenCalled();
      expect(deps.deleteStep).toHaveBeenCalled();
    });
  });

  describe("onPaste", () => {
    it("returns false when clipboard is empty", () => {
      const h = buildKeyboardHandlers(
        mockDeps({ stepIndex: () => 0, workout: makeWorkout(2) })
      );
      expect(h.onPaste!()).toBe(false);
    });

    it("returns false when clipboard has content but no workout", () => {
      vi.mocked(hasClipboardContent).mockReturnValue(true);
      const h = buildKeyboardHandlers(mockDeps());

      expect(h.onPaste!()).toBe(false);
      vi.mocked(hasClipboardContent).mockReturnValue(false);
    });

    it("returns true when clipboard has content and step selected", () => {
      vi.mocked(hasClipboardContent).mockReturnValue(true);
      const h = buildKeyboardHandlers(
        mockDeps({ stepIndex: () => 0, workout: makeWorkout(2) })
      );

      expect(h.onPaste!()).toBe(true);
      vi.mocked(hasClipboardContent).mockReturnValue(false);
    });

    it("returns true when clipboard has content, no step, but workout exists", () => {
      vi.mocked(hasClipboardContent).mockReturnValue(true);
      const h = buildKeyboardHandlers(mockDeps({ workout: makeWorkout(2) }));

      expect(h.onPaste!()).toBe(true);
      vi.mocked(hasClipboardContent).mockReturnValue(false);
    });
  });

  describe("onDelete", () => {
    it("returns false when no step selected", () => {
      const h = buildKeyboardHandlers(mockDeps());
      expect(h.onDelete!()).toBe(false);
    });

    it("returns true when step selected", () => {
      const deps = mockDeps({
        stepIndex: () => 0,
        workout: makeWorkout(2),
      });
      const h = buildKeyboardHandlers(deps);

      expect(h.onDelete!()).toBe(true);
      expect(deps.deleteStep).toHaveBeenCalledWith(0);
    });
  });

  describe("onCreateBlock", () => {
    it("returns false when fewer than 2 steps selected", () => {
      const h = buildKeyboardHandlers(
        mockDeps({ selectedStepIds: ["step-0"] })
      );
      expect(h.onCreateBlock!()).toBe(false);
    });

    it("returns true when 2+ steps selected", () => {
      const h = buildKeyboardHandlers(
        mockDeps({ selectedStepIds: ["step-0", "step-1"] })
      );
      expect(h.onCreateBlock!()).toBe(true);
    });
  });

  describe("onUngroupBlock", () => {
    it("returns false when no step selected", () => {
      const h = buildKeyboardHandlers(mockDeps());
      expect(h.onUngroupBlock!()).toBe(false);
    });

    it("returns false when the selected id points at a step, not a block", () => {
      // A workout with a top-level step `id-step-1` and no matching block.
      const workout = {
        steps: [
          {
            id: "id-step-1",
            stepIndex: 0,
            type: "active" as const,
          },
        ],
      } as unknown as KeyboardHandlerDeps["workout"];

      const h = buildKeyboardHandlers(
        mockDeps({ selectedStepId: "id-step-1", workout })
      );
      expect(h.onUngroupBlock!()).toBe(false);
    });

    it("returns true when the selected id points at a repetition block", () => {
      // A workout with a block whose `id` matches the selection.
      const workout = {
        steps: [
          {
            id: "id-block-1",
            repeatCount: 2,
            steps: [
              {
                id: "id-inner-0",
                stepIndex: 0,
                durationType: "time",
                duration: { type: "time", seconds: 60 },
                targetType: "open",
                target: { type: "open" },
              },
            ],
          },
        ],
      } as unknown as KeyboardHandlerDeps["workout"];

      const h = buildKeyboardHandlers(
        mockDeps({ selectedStepId: "id-block-1", workout })
      );
      expect(h.onUngroupBlock!()).toBe(true);
    });
  });

  describe("onSelectAll", () => {
    it("returns false when no workout", () => {
      const h = buildKeyboardHandlers(mockDeps());
      expect(h.onSelectAll!()).toBe(false);
    });

    it("returns false when workout has no steps", () => {
      const h = buildKeyboardHandlers(mockDeps({ workout: makeWorkout(0) }));
      expect(h.onSelectAll!()).toBe(false);
    });

    it("returns true when workout has steps", () => {
      const h = buildKeyboardHandlers(mockDeps({ workout: makeWorkout(3) }));
      expect(h.onSelectAll!()).toBe(true);
    });
  });

  describe("onClearSelection", () => {
    it("returns false when no selection", () => {
      const h = buildKeyboardHandlers(mockDeps());
      expect(h.onClearSelection!()).toBe(false);
    });

    it("returns true when single step selected", () => {
      const h = buildKeyboardHandlers(mockDeps({ selectedStepId: "step-0" }));
      expect(h.onClearSelection!()).toBe(true);
    });

    it("returns true when multi-selection active", () => {
      const h = buildKeyboardHandlers(
        mockDeps({ selectedStepIds: ["step-0", "step-1"] })
      );
      expect(h.onClearSelection!()).toBe(true);
    });
  });
});
