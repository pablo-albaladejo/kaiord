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
  // Selection is marked in ink, not in colour: the only hue a step may carry
  // is the training zone of its own intensity bar.
  const baseClasses =
    "rounded-xl border transition-colors duration-200 cursor-pointer relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)] motion-reduce:transition-none";
  const selectedClasses = isSelected
    ? "border-edge-strong bg-surface-elevated ring-1 ring-[var(--focus-ring)]"
    : "border-edge-soft bg-surface hover:bg-surface-elevated";
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
