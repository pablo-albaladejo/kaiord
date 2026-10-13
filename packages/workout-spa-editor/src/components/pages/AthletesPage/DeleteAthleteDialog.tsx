import { useTranslate } from "../../../i18n/use-translate";
import type { Profile } from "../../../types/profile";
import { ConfirmationModal } from "../../molecules/ConfirmationModal";
import { useProfileDelete } from "./hooks/useProfileDelete";

type DeleteAthleteDialogProps = {
  /** The athlete to delete; null keeps the dialog closed. */
  profile: Profile | null;
  onDone: () => void;
};

/* Deleting an athlete cascades to everything recorded for them, so it is
   confirmed first. A failed delete toasts and leaves the dialog open. */
export function DeleteAthleteDialog({
  profile,
  onDone,
}: DeleteAthleteDialogProps) {
  const t = useTranslate("athlete");
  const { confirmDelete } = useProfileDelete({
    setDeleteConfirmId: (id) => id === null && onDone(),
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
    />
  );
}
