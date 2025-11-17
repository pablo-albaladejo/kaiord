import type { ToastVariant } from "./Toast.types";

/**
 * Variant styles for toast notifications
 */
export const variantStyles: Record<ToastVariant, string> = {
  success:
    "border-green-500 bg-green-50 text-green-900 dark:bg-green-900/20 dark:text-green-100",
  error:
    "border-red-500 bg-red-50 text-red-900 dark:bg-red-900/20 dark:text-red-100",
  warning:
    "border-yellow-500 bg-yellow-50 text-yellow-900 dark:bg-yellow-900/20 dark:text-yellow-100",
  info: "border-blue-500 bg-blue-50 text-blue-900 dark:bg-blue-900/20 dark:text-blue-100",
};

/**
 * Base toast styles
 */
export const baseToastStyles = `
  group pointer-events-auto relative flex w-full items-center justify-between
  space-x-4 overflow-hidden rounded-lg border-2 p-4 pr-8 shadow-lg
  transition-all data-[swipe=cancel]:translate-x-0
  data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)]
  data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]
  data-[swipe=move]:transition-none
  data-[state=open]:animate-in data-[state=closed]:animate-out
  data-[swipe=end]:animate-out data-[state=closed]:fade-out-80
  data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full
  data-[state=open]:sm:slide-in-from-bottom-full
`;
