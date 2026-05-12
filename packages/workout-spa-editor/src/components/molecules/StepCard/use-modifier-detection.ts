/**
 * Detect Control/Meta modifier keys on a mouse event.
 *
 * Reads `ctrlKey`/`metaKey` directly on the synthetic event — every
 * caller (real DOM events, jsdom synthetic events, and the
 * KeyboardEvent that `handleKeyDown` casts to a MouseEvent) exposes
 * these properties.
 */
export function isModifierKeyPressed(e: React.MouseEvent): boolean {
  return e.ctrlKey || e.metaKey;
}
