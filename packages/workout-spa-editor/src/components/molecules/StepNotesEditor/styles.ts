/**
 * StepNotesEditor Styles
 */

export const getTextareaClasses = (isOverLimit: boolean) => {
  const baseClasses =
    "w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-800 dark:text-gray-100";

  const stateClasses = isOverLimit
    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
    : "border-gray-300 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600";

  return `${baseClasses} ${stateClasses}`;
};

export const getCharacterCountClasses = (isOverLimit: boolean) => {
  const baseClasses = "text-xs";
  const stateClasses = isOverLimit
    ? "font-semibold text-red-600 dark:text-red-400"
    : "text-gray-500 dark:text-gray-400";

  return `${baseClasses} ${stateClasses}`;
};
