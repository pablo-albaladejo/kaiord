import { useCallback } from "react";

import { useTranslate } from "../../i18n/use-translate";
import { useShowConfirmationModal } from "../../store/selectors";

export type EditsGuard = { isDirty: boolean; discard: () => void };

/**
 * Runs `then` right away when the draft is clean; otherwise asks first and,
 * on confirm, reloads the saved copy before running it. Shared by the
 * editor's Discard button (no `then`) and its in-app Back.
 */
export function useConfirmDiscardEdits({ isDirty, discard }: EditsGuard) {
  const t = useTranslate("editor");
  const showConfirmationModal = useShowConfirmationModal();
  const title = t("edits.discardTitle");
  const message = t("edits.discardMessage");
  const confirmLabel = t("edits.discardConfirm");
  const cancelLabel = t("edits.keepEditing");

  return useCallback(
    (then?: () => void) => {
      if (!isDirty) return then?.();
      showConfirmationModal({
        title,
        message,
        confirmLabel,
        cancelLabel,
        variant: "destructive",
        onConfirm: () => {
          discard();
          then?.();
        },
      });
    },
    [
      isDirty,
      discard,
      showConfirmationModal,
      title,
      message,
      confirmLabel,
      cancelLabel,
    ]
  );
}
