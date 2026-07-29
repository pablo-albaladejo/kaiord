/**
 * `useAnchoredPosition` — places a coach mark beside its anchor using the same
 * `computeTooltipPosition` math the `Tooltip` atom uses, so a mark and a
 * tooltip on the same element land in the same place.
 *
 * Both rects are measured live: the mark's own size decides `top`/`left` for
 * the `top`/`left` sides, so the effect must run after the mark has painted.
 */

import { useCallback, useLayoutEffect, useState } from "react";

import {
  type Align,
  computeTooltipPosition,
  type Position,
  type Side,
} from "../../components/atoms/Tooltip/compute-position";

export const useAnchoredPosition = (
  anchor: HTMLElement | null,
  mark: HTMLElement | null,
  side: Side,
  align: Align
): Position | null => {
  const [position, setPosition] = useState<Position | null>(null);

  const measure = useCallback(() => {
    if (!anchor || !mark) {
      setPosition(null);
      return;
    }
    setPosition(
      computeTooltipPosition(
        anchor.getBoundingClientRect(),
        mark.getBoundingClientRect(),
        side,
        align
      )
    );
  }, [anchor, mark, side, align]);

  useLayoutEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    // Capture phase: the editor list scrolls inside its own container, so a
    // bubbling listener on `window` would never hear it.
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [measure]);

  return position;
};
