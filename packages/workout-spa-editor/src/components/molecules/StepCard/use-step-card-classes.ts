export function getStepCardClasses(
  isSelected: boolean,
  hasActions: boolean,
  hasDragHandle: boolean,
  className: string
): string {
  // `focus-visible:` ring is the visual signal for programmatic focus
  // moves set by `useFocusAfterAction` (§7/§8). `motion-reduce:` kills
  // the color transition when `prefers-reduced-motion: reduce` is on,
  // avoiding a flash for users with vestibular sensitivity.
  const baseClasses =
    "rounded-lg border-2 transition-colors duration-200 cursor-pointer hover:shadow-md relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 motion-reduce:transition-none";
  const selectedClasses = isSelected
    ? "border-primary-500 bg-primary-50 ring-2 ring-primary-200 dark:bg-primary-900/30 dark:ring-primary-800"
    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800";
  const paddingClasses = [
    hasActions ? "pb-12" : "pb-4",
    hasDragHandle ? "pl-10 pr-4 pt-4" : "px-4 pt-4",
  ]
    .filter(Boolean)
    .join(" ");

  return [baseClasses, selectedClasses, paddingClasses, className]
    .filter(Boolean)
    .join(" ");
}
