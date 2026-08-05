import type { RepetitionBlock } from "../../../types/krd";

/** Build an accessible label for a block card. */
export function buildBlockLabel(block: RepetitionBlock): string {
  return `Repeat block ${block.repeatCount}×`;
}

/**
 * Build CSS class string for the RepetitionBlockCard.
 */
export function buildBlockClasses(
  isDragging: boolean,
  className: string
): string {
  // A repetition is a grouping, not a training zone, so it carries no hue of
  // its own: an elevated surface and a hairline say "these belong together"
  // without competing with the steps inside it, which are the only coloured
  // objects on the screen.
  // `focus-visible:` ring matches StepCard so programmatic focus moves
  // (§7/§8) are visually consistent across item types.
  // `motion-reduce:` disables the color transition when the user has
  // `prefers-reduced-motion: reduce` set.
  const baseClasses =
    "rounded-xl border border-edge-soft bg-surface-elevated p-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)] motion-reduce:transition-none";
  const draggingClasses = isDragging ? "cursor-grabbing" : "";
  return [baseClasses, draggingClasses, className].filter(Boolean).join(" ");
}

/**
 * Determine if a click event originated from a control element.
 *
 * Radix dropdown menu items render through a Portal to `document.body`,
 * so `target` sits outside the block card's DOM subtree even though React's
 * synthetic event still bubbles the click up to the card's onClick. Without
 * the `[role="menuitem"]` check, selecting any block-actions-menu item (Edit
 * Count, Add Step, Ungroup, Delete) also fires the card's own block-select
 * handler.
 */
export function isControlClick(target: HTMLElement): boolean {
  return !!target.closest(
    "button, input, [role='menuitem'], [data-testid='step-card']"
  );
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
