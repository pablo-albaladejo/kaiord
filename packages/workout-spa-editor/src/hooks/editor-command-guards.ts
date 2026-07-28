import type { FindByIdResult } from "../store/find-by-id";
import { findById } from "../store/find-by-id";
import type { KRD, Workout } from "../types/krd";
import type { EditorCommandGuards } from "./editor-command.types";

export type EditorCommandGuardInput = {
  currentWorkout: KRD | null;
  workout: Workout | undefined;
  selectedStepId: string | null;
  selectedStepIds: Array<string>;
  hasClipboard: boolean;
  canUndo: boolean;
  canRedo: boolean;
};

/**
 * The clipboard thunks index by the positional `stepIndex`, and
 * `getSelectedStepIndex` only resolves top-level steps — a block or a
 * step-inside-block yields `null` and every one of them returns `false`.
 */
const isTopLevelStep = (found: FindByIdResult | null): boolean =>
  found?.kind === "step" && "stepIndex" in found.step;

/**
 * Mirror of the guard each `buildKeyboardHandlers` thunk applies internally.
 * Selection ids are UUIDs, so identity is resolved with `findById`, never by
 * prefix-matching the legacy `block-*` format.
 */
export const buildEditorCommandGuards = (
  input: EditorCommandGuardInput
): EditorCommandGuards => {
  const found = findById(input.workout, input.selectedStepId);
  const onStep = isTopLevelStep(found);
  const steps = input.workout?.steps ?? [];

  return {
    // onCut additionally bails out on a multi-selection.
    canCut: onStep && input.selectedStepIds.length <= 1,
    canCopy: onStep,
    canPaste: input.hasClipboard && !!input.workout,
    canDelete: onStep,
    canSelectAll: steps.some((step) => "stepIndex" in step),
    canGroup: input.selectedStepIds.length >= 2,
    canUngroup: found?.kind === "block",
    canUndo: input.canUndo,
    canRedo: input.canRedo,
    canSave: !!input.currentWorkout,
    selectedCount: input.selectedStepIds.length,
  };
};
