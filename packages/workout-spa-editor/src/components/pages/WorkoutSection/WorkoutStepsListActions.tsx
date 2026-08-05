import { Plus, Repeat } from "lucide-react";
import type { RefObject } from "react";

import { useTranslate } from "../../../i18n/use-translate";
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
  const t = useTranslate("editor");
  const hasSingleSelection = selectedStepCount === 1;

  // The canvas footer: a hairline, then the two ways to grow the list.
  // Left-aligned, because they continue the rows above rather than close them.
  return (
    <div className="flex flex-col gap-2 border-t border-edge-soft px-4 py-3.5 sm:px-[18px]">
      {hasMultipleSelection && (
        <MultiSelectionHint
          selectedStepCount={selectedStepCount}
          onCreateRepetitionBlock={onCreateRepetitionBlock}
        />
      )}
      {hasSingleSelection && <SingleSelectionHint />}
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
        <Button
          ref={addStepButtonRef}
          variant="secondary"
          size="sm"
          onClick={onAddStep}
          aria-label={t("actions.addStepAria")}
          data-testid="add-step-button"
          className="w-full sm:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
          {t("actions.addStep")}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={onCreateEmptyRepetitionBlock}
          aria-label={t("actions.addRepetitionAria")}
          data-testid="create-empty-repetition-block-button"
          className="w-full sm:w-auto"
        >
          <Repeat className="mr-2 h-4 w-4" aria-hidden="true" />
          {t("actions.addRepetition")}
        </Button>
        {onPasteStep && (
          <PasteButton onPaste={onPasteStep} className="w-full sm:w-auto" />
        )}
      </div>
    </div>
  );
}
