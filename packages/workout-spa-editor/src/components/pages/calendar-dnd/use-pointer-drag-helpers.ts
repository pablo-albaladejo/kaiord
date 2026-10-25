/**
 * Pure DOM/viewport helpers for `usePointerDrag`. Extracted so the hook
 * file stays under the per-file line cap.
 */

export const TOUCH_HOLD_MS = 200;
const MIN_VIEWPORT_PX_QUERY = "(min-width: 768px)";

export const isDesktopViewport = (): boolean => {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia(MIN_VIEWPORT_PX_QUERY).matches;
};

export const readDayElementFromPoint = (
  x: number,
  y: number
): HTMLElement | null => {
  if (typeof document === "undefined") return null;
  const el = document.elementFromPoint(x, y);
  return el?.closest<HTMLElement>("[data-day]") ?? null;
};

export const readDayFromPoint = (x: number, y: number): string | null =>
  readDayElementFromPoint(x, y)?.dataset.day ?? null;
