export type Position = { top: number; left: number };
export type Side = "top" | "right" | "bottom" | "left";
export type Align = "start" | "center" | "end";

const SIDE_OFFSET = 5;

/** Gap kept between a clamped bubble and the edge of the screen. */
const VIEWPORT_MARGIN = 8;

/**
 * Keeps the bubble inside the viewport horizontally.
 *
 * Without this, `side: "right"` on a narrow screen places the bubble past the
 * right edge. That widens the document, and a document wider than the screen
 * makes Chrome grow the layout viewport away from the visual viewport, so the
 * page can be panned sideways and every coordinate the page reports is offset
 * from the coordinate the browser hit-tests.
 *
 * Measured against `documentElement.clientWidth`, not `window.innerWidth`:
 * once the layout viewport has grown, `innerWidth` reports the grown value and
 * would keep re-admitting the overflow that caused it. `clientWidth` stays at
 * the real screen width.
 */
const clampLeft = (left: number, width: number): number => {
  if (typeof document === "undefined") return left;
  const viewport = document.documentElement.clientWidth || window.innerWidth;
  const max = viewport - width - VIEWPORT_MARGIN;
  if (max <= VIEWPORT_MARGIN) return VIEWPORT_MARGIN;
  return Math.min(Math.max(left, VIEWPORT_MARGIN), max);
};

export const computeTooltipPosition = (
  triggerRect: DOMRect,
  tooltipRect: DOMRect,
  side: Side,
  align: Align
): Position => {
  let top = 0;
  let left = 0;
  if (side === "top") {
    top = triggerRect.top - tooltipRect.height - SIDE_OFFSET;
  } else if (side === "bottom") {
    top = triggerRect.bottom + SIDE_OFFSET;
  } else if (side === "left") {
    left = triggerRect.left - tooltipRect.width - SIDE_OFFSET;
  } else {
    left = triggerRect.right + SIDE_OFFSET;
  }
  if (side === "top" || side === "bottom") {
    if (align === "start") left = triggerRect.left;
    else if (align === "end") left = triggerRect.right - tooltipRect.width;
    else left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
  } else {
    if (align === "start") top = triggerRect.top;
    else if (align === "end") top = triggerRect.bottom - tooltipRect.height;
    else top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
  }
  return {
    top: top + window.scrollY,
    left: clampLeft(left, tooltipRect.width) + window.scrollX,
  };
};
