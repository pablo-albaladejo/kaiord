import type { ButtonSize, ButtonVariant } from "./Button";

export const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 disabled:bg-primary-300",
  secondary:
    "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 disabled:bg-gray-100 disabled:text-gray-400 dark:disabled:bg-gray-900 dark:disabled:text-gray-600",
  tertiary:
    "bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-primary-500 dark:text-gray-200 dark:hover:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-600",
  danger:
    "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:bg-red-300",
};

export const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-2.5 text-sm min-h-[44px] min-w-[44px]", // WCAG 2.1 AA touch target
  md: "px-4 py-2.5 text-base min-h-[44px] min-w-[44px]", // WCAG 2.1 AA touch target
  lg: "px-6 py-3 text-lg min-h-[48px] min-w-[48px]", // Larger for better UX
};
