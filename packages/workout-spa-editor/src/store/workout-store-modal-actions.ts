/**
 * Modal Store Actions
 *
 * Actions for managing modal state in the workout store.
 * Requirements: 6.1
 */

import type { StateCreator } from "zustand";
import type { ModalConfig, WorkoutStore } from "./workout-store-types";

export type ModalActions = {
  showConfirmationModal: (config: ModalConfig) => void;
  hideConfirmationModal: () => void;
};

export const createModalActions = (
  set: Parameters<StateCreator<WorkoutStore>>[0]
): ModalActions => ({
  showConfirmationModal: (config: ModalConfig) => {
    set({
      isModalOpen: true,
      modalConfig: config,
    });
  },

  hideConfirmationModal: () => {
    set({
      isModalOpen: false,
      modalConfig: null,
    });
  },
});
