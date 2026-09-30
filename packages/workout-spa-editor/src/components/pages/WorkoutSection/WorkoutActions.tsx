import { Trash2 } from "lucide-react";

import { useTranslate } from "../../../i18n/use-translate";
import type { KRD } from "../../../types/krd";
import { Button } from "../../atoms/Button/Button";
import { SaveButton } from "../../molecules/SaveButton/SaveButton";
import { SaveToLibraryButton } from "../../molecules/SaveToLibraryButton/SaveToLibraryButton";
import { useDiscardConfirmation } from "./use-discard-confirmation";

type WorkoutActionsProps = Readonly<{
  krd: KRD;
  /** The profile owning the persisted record the editor shows, if any. */
  ownerProfileId?: string;
  /** Defaults to the editor's discard confirmation (`useDiscardConfirmation`). */
  onDiscard?: () => void;
}>;

/**
 * Keep · Download · Discard. Sending lives in `EditorStateRibbon`: exactly
 * one control on this screen can reach the watch, and it is not here.
 * Undo/redo moved up beside the title, where the thing they act on is.
 */
export function WorkoutActions({
  krd,
  ownerProfileId,
  onDiscard,
}: WorkoutActionsProps) {
  const t = useTranslate("editor");
  const confirmDiscard = useDiscardConfirmation();
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <SaveToLibraryButton workout={krd} />
      <SaveButton workout={krd} ownerProfileId={ownerProfileId} />
      <span className="hidden flex-1 sm:block" />
      <Button
        variant="tertiary"
        size="sm"
        onClick={onDiscard ?? confirmDiscard}
        aria-label={t("actions.discardAria")}
        data-testid="discard-workout-button"
        className="text-ink-muted hover:text-[var(--danger-text)]"
      >
        <Trash2 className="mr-2 h-4 w-4" />
        {t("actions.discard")}
      </Button>
    </div>
  );
}
