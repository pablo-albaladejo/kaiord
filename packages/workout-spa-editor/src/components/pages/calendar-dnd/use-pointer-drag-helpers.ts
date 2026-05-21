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

export const readDayFromPoint = (x: number, y: number): string | null => {
  if (typeof document === "undefined") return null;
  const el = document.elementFromPoint(x, y);
  if (!el) return null;
  const dayEl = (el as Element).closest<HTMLElement>("[data-day]");
  return dayEl?.dataset.day ?? null;
};
