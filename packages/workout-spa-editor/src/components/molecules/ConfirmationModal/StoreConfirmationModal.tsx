/**
 * Store-connected ConfirmationModal
 *
 * Reads modal state from the workout store and renders
 * the ConfirmationModal when the store's isModalOpen is true.
 */

import { ConfirmationModal } from "./ConfirmationModal";
import {
  useHideConfirmationModal,
  useIsModalOpen,
  useModalConfig,
} from "../../../store/workout-store-selectors";

export function StoreConfirmationModal() {
  const isModalOpen = useIsModalOpen();
  const modalConfig = useModalConfig();
  const hideConfirmationModal = useHideConfirmationModal();

  if (!modalConfig) {
    return null;
  }

  return (
    <ConfirmationModal
      isOpen={isModalOpen}
      title={modalConfig.title}
      message={modalConfig.message}
      confirmLabel={modalConfig.confirmLabel}
      cancelLabel={modalConfig.cancelLabel}
      onConfirm={() => {
        modalConfig.onConfirm();
        hideConfirmationModal();
      }}
      onCancel={modalConfig.onCancel ?? hideConfirmationModal}
      variant={modalConfig.variant}
    />
  );
}
