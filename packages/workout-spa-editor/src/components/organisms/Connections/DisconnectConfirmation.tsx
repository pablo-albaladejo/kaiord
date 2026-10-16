import { useTranslate } from "../../../i18n/use-translate";
import { ConfirmationModal } from "../../molecules/ConfirmationModal";

type DisconnectConfirmationProps = {
  isOpen: boolean;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
};

/* Shared destructive "Disconnect" confirmation for connection rows. */
export function DisconnectConfirmation({
  isOpen,
  message,
  onCancel,
  onConfirm,
}: DisconnectConfirmationProps) {
  const t = useTranslate("connections");
  return (
    <ConfirmationModal
      isOpen={isOpen}
      title={t("manage.disconnect")}
      message={message}
      confirmLabel={t("manage.disconnect")}
      cancelLabel={t("manage.cancel")}
      variant="destructive"
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
