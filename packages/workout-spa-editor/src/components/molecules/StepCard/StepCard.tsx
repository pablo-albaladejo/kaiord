import { forwardRef, type HTMLAttributes } from "react";
import { SelectionIndicator } from "../SelectionIndicator";
import { useStepCardData } from "./use-step-card-data";
import { useStepCardHandlers } from "./use-step-card-handlers";
import type { DragHandleProps, StepCardProps } from "./StepCard.types";

export type { DragHandleProps, StepCardProps };

type HtmlDivProps = HTMLAttributes<HTMLDivElement>;

/** Extract only native HTML div props from StepCardProps. */
/* eslint-disable @typescript-eslint/no-unused-vars */
function getHtmlProps(props: StepCardProps): HtmlDivProps {
  const {
    step,
    visualIndex,
    isSelected,
    isMultiSelected,
    onSelect,
    onToggleMultiSelect,
    onDelete,
    onDuplicate,
    onCopy,
    isDragging,
    dragHandleProps,
    className,
    ...rest
  } = props;
  return rest;
}
/* eslint-enable @typescript-eslint/no-unused-vars */

export const StepCard = forwardRef<HTMLDivElement, StepCardProps>(
  (props, ref) => {
    const { step, onSelect, onToggleMultiSelect } = props;
    const { selected, label, classes, content } = useStepCardData(props);
    const handlers = useStepCardHandlers({
      step,
      onSelect,
      onToggleMultiSelect,
    });

    return (
      <div
        ref={ref}
        className={classes}
        onClick={handlers.handleClick}
        onMouseDown={handlers.handleMouseDown}
        role="button"
        tabIndex={0}
        onKeyDown={handlers.handleKeyDown}
        aria-label={label}
        aria-selected={selected}
        data-testid="step-card"
        data-selected={selected ? "true" : "false"}
        {...getHtmlProps(props)}
      >
        <SelectionIndicator selected={selected} />
        {content}
      </div>
    );
  }
);
StepCard.displayName = "StepCard";
