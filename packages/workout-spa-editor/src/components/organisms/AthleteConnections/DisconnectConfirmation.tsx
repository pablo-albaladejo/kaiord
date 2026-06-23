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
  return (
    <ConfirmationModal
      isOpen={isOpen}
      title="Disconnect"
      message={message}
      confirmLabel="Disconnect"
      cancelLabel="Cancel"
      variant="destructive"
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
