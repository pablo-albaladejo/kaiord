import { Plus, Repeat } from "lucide-react";
import type { RefObject } from "react";

import { Button } from "../../atoms/Button/Button";
import { PasteButton } from "../../molecules/PasteButton";
import { MultiSelectionHint, SingleSelectionHint } from "./SelectionHints";

type WorkoutStepsListActionsProps = {
  readonly hasMultipleSelection: boolean;
  readonly selectedStepCount: number;
  readonly onCreateRepetitionBlock: () => void;
  readonly onCreateEmptyRepetitionBlock: () => void;
  readonly onAddStep: () => void;
  readonly onPasteStep?: () => void;
  /**
   * Ref to the Add Step button — this is the empty-state focus
   * target for `useFocusAfterAction` (§7.5). The button is always
   * mounted, so the hook can land focus on it whether or not the
   * workout currently has steps.
   */
  readonly addStepButtonRef?: RefObject<HTMLButtonElement | null>;
};

export function WorkoutStepsListActions({
  hasMultipleSelection,
  selectedStepCount,
  onCreateRepetitionBlock,
  onCreateEmptyRepetitionBlock,
  onAddStep,
  onPasteStep,
  addStepButtonRef,
}: WorkoutStepsListActionsProps) {
  const hasSingleSelection = selectedStepCount === 1;

  return (
    <div className="mt-4 flex flex-col items-center gap-2">
      {hasMultipleSelection && (
        <MultiSelectionHint
          selectedStepCount={selectedStepCount}
          onCreateRepetitionBlock={onCreateRepetitionBlock}
        />
      )}
      {hasSingleSelection && <SingleSelectionHint />}
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:justify-center">
        <Button
          variant="secondary"
          onClick={onCreateEmptyRepetitionBlock}
          aria-label="Add repetition block"
          data-testid="create-empty-repetition-block-button"
          className="w-full sm:w-auto"
        >
          <Repeat className="mr-2 h-4 w-4" aria-hidden="true" />
          Add Repetition
        </Button>
        <Button
          ref={addStepButtonRef}
          variant="secondary"
          onClick={onAddStep}
          aria-label="Add new step to workout"
          data-testid="add-step-button"
          className="w-full sm:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
          Add Step
        </Button>
        {onPasteStep && (
          <PasteButton onPaste={onPasteStep} className="w-full sm:w-auto" />
        )}
      </div>
    </div>
  );
}
