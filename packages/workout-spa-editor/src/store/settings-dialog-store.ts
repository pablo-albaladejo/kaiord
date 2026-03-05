import { create } from "zustand";

type SettingsDialogStore = {
  open: boolean;
  show: () => void;
  hide: () => void;
  toggle: () => void;
};

export const useSettingsDialogStore = create<SettingsDialogStore>(
  (set) => ({
    open: false,
    show: () => set({ open: true }),
    hide: () => set({ open: false }),
    toggle: () => set((s) => ({ open: !s.open })),
  })
);
