import { useCallback, useState } from "react";
import { createToastItem, createVariantToast } from "./useToast.helpers";
import type { ToastItem, ToastOptions } from "./useToast.types";

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

  const success = useCallback(createVariantToast(toast, "success"), [toast]);
  const error = useCallback(createVariantToast(toast, "error"), [toast]);
  const warning = useCallback(createVariantToast(toast, "warning"), [toast]);
  const info = useCallback(createVariantToast(toast, "info"), [toast]);

  return { toasts, toast, success, error, warning, info, dismiss, dismissAll };
};
