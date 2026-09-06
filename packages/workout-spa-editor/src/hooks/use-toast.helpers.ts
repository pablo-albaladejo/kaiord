import type { ToastItem, ToastOptions } from "./use-toast.types";

/**
 * Generate a unique ID for a toast
 */
export const generateToastId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

/**
 * Create a new toast item
 */
export const createToastItem = (options: ToastOptions): ToastItem => {
  return {
    id: generateToastId(),
    title: options.title,
    description: options.description,
    variant: options.variant || "info",
    action: options.action,
    duration: options.duration,
    open: true,
  };
};
