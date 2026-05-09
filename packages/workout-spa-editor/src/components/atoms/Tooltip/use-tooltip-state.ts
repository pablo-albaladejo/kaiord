import { useCallback, useEffect, useRef, useState } from "react";

import {
  type Align,
  computeTooltipPosition,
  type Position,
  type Side,
} from "./compute-position";

export const useTooltipState = (
  delayDuration: number,
  side: Side,
  align: Align
) => {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<Position | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleShow = useCallback(() => {
    clearTimer();
    if (delayDuration <= 0) {
      setOpen(true);
      return;
    }
    timerRef.current = setTimeout(() => setOpen(true), delayDuration);
  }, [clearTimer, delayDuration]);

  const handleHide = useCallback(() => {
    clearTimer();
    setOpen(false);
  }, [clearTimer]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  useEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }
    const trigger = triggerRef.current;
    const tooltip = tooltipRef.current;
    if (!trigger || !tooltip) return;
    setPosition(
      computeTooltipPosition(
        trigger.getBoundingClientRect(),
        tooltip.getBoundingClientRect(),
        side,
        align
      )
    );
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleHide();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, side, align, handleHide]);

  return { open, position, triggerRef, tooltipRef, handleShow, handleHide };
};
