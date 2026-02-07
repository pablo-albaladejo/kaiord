import { Trash2 } from "lucide-react";
import { Button } from "../../atoms/Button/Button";
import { SaveButton } from "../../molecules/SaveButton/SaveButton";
import { SaveToLibraryButton } from "../../molecules/SaveToLibraryButton/SaveToLibraryButton";
import { UndoRedoButtons } from "../../molecules/UndoRedoButtons";
import type { KRD } from "../../../types/krd";

type WorkoutActionsProps = Readonly<{
  krd: KRD;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onDiscard: () => void;
}>;

export function WorkoutActions({
  krd,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onDiscard,
}: WorkoutActionsProps) {
  return (
    <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto">
      <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
        <UndoRedoButtons
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={onUndo}
          onRedo={onRedo}
        />
        <SaveButton workout={krd} />
        <SaveToLibraryButton workout={krd} className="w-full sm:w-auto" />
      </div>
      <Button
        variant="secondary"
        onClick={onDiscard}
        aria-label="Discard workout and return to welcome screen"
        data-testid="discard-workout-button"
        className="w-full border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 sm:w-auto dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Discard Workout
      </Button>
    </div>
  );
}
