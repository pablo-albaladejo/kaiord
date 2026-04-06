import { Trash2 } from "lucide-react";

import type { KRD } from "../../../types/krd";
import { Button } from "../../atoms/Button/Button";
import { GarminPushButton } from "../../molecules/GarminPushButton";
import { SaveButton } from "../../molecules/SaveButton/SaveButton";
import { SaveToLibraryButton } from "../../molecules/SaveToLibraryButton/SaveToLibraryButton";
import { UndoRedoButtons } from "../../molecules/UndoRedoButtons";

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
    <div className="flex flex-wrap items-start gap-3">
      <UndoRedoButtons
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={onUndo}
        onRedo={onRedo}
      />
      <SaveButton workout={krd} />
      <SaveToLibraryButton workout={krd} />
      <GarminPushButton />
      <Button
        variant="tertiary"
        onClick={onDiscard}
        aria-label="Discard workout and return to welcome screen"
        data-testid="discard-workout-button"
        className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Discard
      </Button>
    </div>
  );
}
