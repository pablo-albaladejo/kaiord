import { Repeat } from "lucide-react";
import { Button } from "../../atoms/Button/Button";

type MultiSelectionHintProps = {
  selectedStepCount: number;
  onCreateRepetitionBlock: () => void;
};

export function MultiSelectionHint({
  selectedStepCount,
  onCreateRepetitionBlock,
}: MultiSelectionHintProps) {
  return (
    <div className="flex flex-col items-center gap-1 sm:flex-row sm:gap-2">
      <Button
        variant="primary"
        onClick={onCreateRepetitionBlock}
        aria-label="Create repetition block from selected steps"
        data-testid="create-repetition-block-button"
        className="w-full sm:w-auto"
      >
        <Repeat className="mr-2 h-4 w-4" aria-hidden="true" />
        Create Repetition Block ({selectedStepCount} steps)
      </Button>
      <span className="text-xs text-gray-500 dark:text-gray-400">
        or press{" "}
        <kbd className="rounded bg-gray-100 px-1 py-0.5 text-xs dark:bg-gray-700">
          Ctrl+G
        </kbd>
      </span>
    </div>
  );
}

export function SingleSelectionHint() {
  return (
    <p
      className="text-xs text-gray-500 dark:text-gray-400"
      data-testid="selection-hint"
    >
      Ctrl+click another step to create a repetition block
    </p>
  );
}
