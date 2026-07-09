import { Trash2 } from "lucide-react";

import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import { useTranslate } from "../../../i18n/use-translate";
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
  const t = useTranslate("editor");
  // Restore the policy-gated push: GarminPushButton resolves export
  // policies by profile, so without the active profile id it always
  // renders null (AC-5 gating was dead after the redesign).
  const activeProfileId = useActiveProfileLive()?.id ?? undefined;
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
      <GarminPushButton profileId={activeProfileId} />
      <Button
        variant="tertiary"
        onClick={onDiscard}
        aria-label={t("actions.discardAria")}
        data-testid="discard-workout-button"
        className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
      >
        <Trash2 className="mr-2 h-4 w-4" />
        {t("actions.discard")}
      </Button>
    </div>
  );
}
