import { useRef } from "react";

import { useTranslate } from "../../../i18n/use-translate";
import type { Profile } from "../../../types/profile";
import { ConfirmationModal } from "../../molecules/ConfirmationModal";
import { useProfileDelete } from "./hooks/useProfileDelete";

type DeleteAthleteDialogProps = {
  /** The athlete to delete; null keeps the dialog closed. */
  profile: Profile | null;
  onDone: () => void;
  /** Takes the focus once the deleted athlete's row is gone. */
  onDeleted: () => void;
};

/* Deleting an athlete cascades to everything recorded for them, so it is
   confirmed first. A failed delete toasts and leaves the dialog open. The
   delete button that opened it is gone afterwards, so the focus goes to
   `onDeleted` instead of falling back to the page body. */
export function DeleteAthleteDialog({
  profile,
  onDone,
  onDeleted,
}: DeleteAthleteDialogProps) {
  const t = useTranslate("athlete");
  const deleted = useRef(false);
  const { confirmDelete } = useProfileDelete({
    setDeleteConfirmId: (id) => {
      if (id !== null) return;
      deleted.current = true;
      onDone();
    },
  });
  const name = profile?.name ?? "";

  return (
    <ConfirmationModal
      isOpen={profile !== null}
      title={t("athletes.deleteTitle", { name })}
      message={t("athletes.deleteBody")}
      confirmLabel={t("athletes.confirmDelete")}
      cancelLabel={t("athletes.cancel")}
      onConfirm={() => confirmDelete(profile?.id ?? null)}
      onCancel={onDone}
      variant="destructive"
      onCloseAutoFocus={(event) => {
        if (!deleted.current) return;
        deleted.current = false;
        event.preventDefault();
        onDeleted();
      }}
    />
  );
}
