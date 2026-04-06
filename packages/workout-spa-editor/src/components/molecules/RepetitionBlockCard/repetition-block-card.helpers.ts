/**
 * Build CSS class string for the RepetitionBlockCard.
 */
export function buildBlockClasses(
  isDragging: boolean,
  className: string
): string {
  const baseClasses =
    "rounded-lg border-2 border-dashed border-primary-300 dark:border-primary-700 bg-primary-50/50 dark:bg-primary-950/20 p-4 transition-colors";
  const draggingClasses = isDragging ? "cursor-grabbing" : "";
  return [baseClasses, draggingClasses, className].filter(Boolean).join(" ");
}

/**
 * Determine if a click event originated from a control element.
 */
export function isControlClick(target: HTMLElement): boolean {
  return !!target.closest("button, input, [data-testid='step-card']");
}

/**
 * Determine if a keyboard event should trigger block deletion.
 */
export function isDeleteKey(event: React.KeyboardEvent): boolean {
  return event.key === "Delete" || event.key === "Backspace";
}

/**
 * Create a click handler for block selection.
 */
export function createBlockClickHandler(
  blockId: string | undefined,
  onBlockSelect?: (id: string) => void
): (e: React.MouseEvent<HTMLDivElement>) => void {
  return (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isControlClick(e.target as HTMLElement) && blockId && onBlockSelect)
      onBlockSelect(blockId);
  };
}

/**
 * Create a keydown handler for block deletion.
 */
export function createBlockKeyDownHandler(
  onDelete?: () => void,
  isEditingCount?: boolean
): (e: React.KeyboardEvent<HTMLDivElement>) => void {
  return (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isDeleteKey(e) || !onDelete || isEditingCount) return;
    if (e.currentTarget !== e.target) return;
    e.preventDefault();
    e.stopPropagation();
    onDelete();
  };
}
