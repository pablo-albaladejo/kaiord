import {
  createBackupAction,
  disableSafeModeAction,
  enableSafeModeAction,
  restoreFromBackupAction,
} from "./actions/error-recovery-actions";
import type { WorkoutStore } from "./workout-store-types";
import type { StoreApi } from "zustand";

export const createRecoveryMethods = (
  set: StoreApi<WorkoutStore>["setState"],
  get: StoreApi<WorkoutStore>["getState"]
) => ({
  createBackup: () => set((state) => createBackupAction(state)),
  restoreFromBackup: () => {
    const result = restoreFromBackupAction(get());
    if (result.success) {
      set(result);
      return true;
    }
    return false;
  },
  enableSafeMode: () => set(enableSafeModeAction()),
  disableSafeMode: () => set(disableSafeModeAction()),
  hasBackup: () => get().lastBackup !== null,
});
