export type Position = { top: number; left: number };
export type Side = "top" | "right" | "bottom" | "left";
export type Align = "start" | "center" | "end";

const SIDE_OFFSET = 5;

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
  return { top: top + window.scrollY, left: left + window.scrollX };
};
