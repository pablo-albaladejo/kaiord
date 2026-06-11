import { useCallback, useState } from "react";

import { createToastItem } from "./use-toast.helpers";
import type { ToastItem, ToastOptions } from "./use-toast.types";

export type { ToastItem, ToastOptions };

/**
 * useToast Hook
 *
 * Requirement 39: Visual feedback for user actions
 * - Manages toast notification state
 * - Provides methods to show/dismiss toasts
 * - Generates unique IDs for each toast
 * - Handles auto-dismiss timing
 */
export const useToast = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((options: ToastOptions) => {
    const newToast = createToastItem(options);
    setToasts((prev) => [...prev, newToast]);
    return newToast.id;
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, open: false } : t))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 200);
  }, []);

  const dismissAll = useCallback(() => {
    setToasts((prev) => prev.map((t) => ({ ...t, open: false })));
    setTimeout(() => setToasts([]), 200);
  }, []);

  // Variant helpers: inline forms so exhaustive-deps can verify deps
  // statically. Each forwards to `toast` with the variant baked in.
  const success = useCallback(
    (
      title: string,
      description?: string,
      options?: Omit<ToastOptions, "title" | "description" | "variant">
    ) => toast({ title, description, variant: "success", ...options }),
    [toast]
  );
  const error = useCallback(
    (
      title: string,
      description?: string,
      options?: Omit<ToastOptions, "title" | "description" | "variant">
    ) => toast({ title, description, variant: "error", ...options }),
    [toast]
  );
  const warning = useCallback(
    (
      title: string,
      description?: string,
      options?: Omit<ToastOptions, "title" | "description" | "variant">
    ) => toast({ title, description, variant: "warning", ...options }),
    [toast]
  );
  const info = useCallback(
    (
      title: string,
      description?: string,
      options?: Omit<ToastOptions, "title" | "description" | "variant">
    ) => toast({ title, description, variant: "info", ...options }),
    [toast]
  );

  return { toasts, toast, success, error, warning, info, dismiss, dismissAll };
};
