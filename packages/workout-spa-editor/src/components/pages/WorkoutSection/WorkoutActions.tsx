import { Trash2 } from "lucide-react";
import { Button } from "../../atoms/Button/Button";
import { GarminPushButton } from "../../molecules/GarminPushButton";
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
    <div className="flex w-full flex-col flex-wrap gap-3 lg:w-auto lg:flex-row lg:items-start">
      <UndoRedoButtons
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={onUndo}
        onRedo={onRedo}
      />
      <SaveButton workout={krd} />
      <SaveToLibraryButton workout={krd} className="w-full lg:w-auto" />
      <GarminPushButton />
      <Button
        variant="tertiary"
        onClick={onDiscard}
        aria-label="Discard workout and return to welcome screen"
        data-testid="discard-workout-button"
        className="w-full text-red-600 hover:bg-red-50 hover:text-red-700 lg:w-auto dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Discard
      </Button>
    </div>
  );
}
