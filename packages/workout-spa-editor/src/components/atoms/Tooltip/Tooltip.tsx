import { type ReactNode, useId } from "react";
import { createPortal } from "react-dom";

import { type Align, type Side } from "./compute-position";
import { useTooltipState } from "./use-tooltip-state";

export type TooltipProps = {
  children: ReactNode;
  content: ReactNode;
  side?: Side;
  align?: Align;
  delayDuration?: number;
  disabled?: boolean;
};

export const Tooltip = ({
  children,
  content,
  side = "top",
  align = "center",
  delayDuration = 200,
  disabled = false,
}: TooltipProps) => {
  const id = useId();
  const tooltipId = `tooltip-${id}`;
  const { open, position, triggerRef, tooltipRef, handleShow, handleHide } =
    useTooltipState(delayDuration, side, align);

  if (disabled) return <>{children}</>;

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={handleShow}
        onMouseLeave={handleHide}
        onFocus={handleShow}
        onBlur={handleHide}
        aria-describedby={open ? tooltipId : undefined}
        style={{ display: "contents" }}
      >
        {children}
      </span>
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={tooltipRef}
            id={tooltipId}
            role="tooltip"
            data-side={side}
            data-align={align}
            style={{
              position: "absolute",
              top: position?.top ?? 0,
              left: position?.left ?? 0,
              visibility: position ? "visible" : "hidden",
              pointerEvents: "none",
              zIndex: 50,
            }}
            className="overflow-hidden rounded-md bg-gray-900 px-3 py-1.5 text-sm text-white shadow-md dark:bg-gray-50 dark:text-gray-900"
          >
            {content}
          </div>,
          document.body
        )}
    </>
  );
};
