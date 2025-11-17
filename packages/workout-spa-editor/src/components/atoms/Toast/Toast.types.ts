import type { ReactNode } from "react";

/**
 * Toast variant types
 */
export type ToastVariant = "success" | "error" | "warning" | "info";

/**
 * Toast component props
 */
export type ToastProps = {
  title: string;
  description?: string;
  variant?: ToastVariant;
  action?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  duration?: number;
};
