/**
 * Modal / dialog selectors
 *
 * Hooks for the editor's confirmation-modal slice and the create-block
 * dialog open/close state. UI-level transient state that is held in the
 * store so unrelated components can drive it.
 */

import { useWorkoutStore } from "../workout-store";

export const useIsModalOpen = () =>
  useWorkoutStore((state) => state.isModalOpen);

export const useModalConfig = () =>
  useWorkoutStore((state) => state.modalConfig);

export const useShowConfirmationModal = () =>
  useWorkoutStore((state) => state.showConfirmationModal);

export const useHideConfirmationModal = () =>
  useWorkoutStore((state) => state.hideConfirmationModal);

export const useCreateBlockDialogOpen = () =>
  useWorkoutStore((state) => state.createBlockDialogOpen);

export const useOpenCreateBlockDialog = () =>
  useWorkoutStore((state) => state.openCreateBlockDialog);

export const useCloseCreateBlockDialog = () =>
  useWorkoutStore((state) => state.closeCreateBlockDialog);
