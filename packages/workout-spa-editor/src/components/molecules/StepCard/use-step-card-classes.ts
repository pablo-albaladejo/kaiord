export function getStepCardClasses(
  isSelected: boolean,
  hasActions: boolean,
  hasDragHandle: boolean,
  className: string
): string {
  const baseClasses =
    "rounded-lg border-2 transition-all duration-200 cursor-pointer hover:shadow-md relative";
  const selectedClasses = isSelected
    ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800";
  const paddingClasses = [
    hasActions ? "pb-12" : "pb-4",
    hasDragHandle ? "pl-10 pr-4 pt-4" : "p-4",
  ]
    .filter(Boolean)
    .join(" ");

  return [baseClasses, selectedClasses, paddingClasses, className]
    .filter(Boolean)
    .join(" ");
}
