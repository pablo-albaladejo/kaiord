import type { ToastVariant } from "../components/atoms/Toast";

/**
 * Toast item type
 */
export type ToastItem = {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  action?: React.ReactNode;
  duration?: number;
  open: boolean;
};

/**
 * Toast options for showing a toast
 */
export type ToastOptions = {
  title: string;
  description?: string;
  variant?: ToastVariant;
  action?: React.ReactNode;
  duration?: number;
};
