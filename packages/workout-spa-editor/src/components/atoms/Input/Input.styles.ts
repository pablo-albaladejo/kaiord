import type { InputSize } from "./Input.types";

export const sizeClasses: Record<InputSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-5 py-3 text-lg",
};

export const baseInputClasses =
  "w-full rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

export const normalStateClasses =
  "border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-primary-400 dark:focus:ring-primary-400";

export const errorStateClasses =
  "border-red-500 bg-red-50 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500 dark:border-red-400 dark:bg-red-900/20 dark:text-red-100 dark:placeholder-red-400 dark:focus:border-red-400 dark:focus:ring-red-400";

export const labelClasses =
  "mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300";

export const helperTextClasses =
  "mt-1 text-sm text-gray-500 dark:text-gray-400";

export const errorTextClasses = "mt-1 text-sm text-red-600 dark:text-red-400";
