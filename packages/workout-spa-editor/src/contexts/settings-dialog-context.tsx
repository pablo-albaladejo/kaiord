import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type SettingsDialogState = {
  open: boolean;
  show: () => void;
  hide: () => void;
  toggle: () => void;
};

const SettingsDialogContext = createContext<SettingsDialogState | null>(null);

export const SettingsDialogProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [open, setOpen] = useState(false);
  const show = useCallback(() => setOpen(true), []);
  const hide = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((prev) => !prev), []);

  const value = useMemo(
    () => ({ open, show, hide, toggle }),
    [open, show, hide, toggle]
  );

  return (
    <SettingsDialogContext.Provider value={value}>
      {children}
    </SettingsDialogContext.Provider>
  );
};

export const useSettingsDialog = (): SettingsDialogState => {
  const ctx = useContext(SettingsDialogContext);
  if (!ctx) {
    throw new Error(
      "useSettingsDialog must be used within SettingsDialogProvider"
    );
  }
  return ctx;
};
