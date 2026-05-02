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

  // TODO(fix-coaching-dialog-rules-of-hooks-followup): rewrite as
  // inline functions per the lint rule's preferred shape; the current
  // `createVariantToast(toast, "...")` form passes a function whose
  // dependencies the linter cannot infer.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const success = useCallback(createVariantToast(toast, "success"), [toast]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const error = useCallback(createVariantToast(toast, "error"), [toast]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const warning = useCallback(createVariantToast(toast, "warning"), [toast]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const info = useCallback(createVariantToast(toast, "info"), [toast]);

  return { toasts, toast, success, error, warning, info, dismiss, dismissAll };
};
