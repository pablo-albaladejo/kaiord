/**
 * AltGr reports ctrlKey+altKey on Windows/Linux layouts (and the
 * "AltGraph" modifier state where supported). Characters typed with it
 * must dispatch as plain keys: neither Ctrl shortcuts (undo must not
 * fire) nor Alt shortcuts may claim them.
 */
export const isAltGraphEvent = (event: KeyboardEvent): boolean =>
  event.getModifierState?.("AltGraph") === true ||
  (event.ctrlKey && event.altKey);
