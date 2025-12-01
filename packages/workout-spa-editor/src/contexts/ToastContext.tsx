import { createContext, useContext, type ReactNode } from "react";
import { useToast } from "../hooks/useToast";
import type { ToastOptions } from "../hooks/useToast.types";

type ToastContextType = ReturnType<typeof useToast>;

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastContextProvider({ children }: { children: ReactNode }) {
  const toast = useToast();

  return (
    <ToastContext.Provider value={toast}>{children}</ToastContext.Provider>
  );
}

export function useToastContext() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToastContext must be used within ToastContextProvider");
  }
  return context;
}

export type { ToastOptions };
