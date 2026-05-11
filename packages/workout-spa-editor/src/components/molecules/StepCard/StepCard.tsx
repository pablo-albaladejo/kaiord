import { forwardRef, type HTMLAttributes } from "react";

import { useFocusRegistration } from "../../../hooks/focus/use-focus-registration";
import { mergeRefs } from "../../../lib/merge-refs";
import { SelectionIndicator } from "../SelectionIndicator";
import type { DragHandleProps, StepCardProps } from "./StepCard.types";
import { useStepCardData } from "./use-step-card-data";
import { useStepCardHandlers } from "./use-step-card-handlers";

export type { DragHandleProps, StepCardProps };

const OWN_PROP_KEYS = new Set([
  "step",
  "visualIndex",
  "isSelected",
  "isMultiSelected",
  "onSelect",
  "onToggleMultiSelect",
  "onDelete",
  "onDuplicate",
  "onCopy",
  "isDragging",
  "dragHandleProps",
  "className",
]);

function extractHtmlProps(
  props: StepCardProps
): HTMLAttributes<HTMLDivElement> {
  return Object.fromEntries(
    Object.entries(props).filter(([k]) => !OWN_PROP_KEYS.has(k))
  ) as HTMLAttributes<HTMLDivElement>;
}

export const StepCard = forwardRef<HTMLDivElement, StepCardProps>(
  (props, ref) => {
    const { step, onSelect, onToggleMultiSelect } = props;
    const { selected, label, classes, content } = useStepCardData(props);
    const handlers = useStepCardHandlers({
      step,
      onSelect,
      onToggleMultiSelect,
    });

    // Self-register with the focus registry (§8.2) so the post-commit
    // `useFocusAfterAction` hook can resolve `step.id → HTMLElement`.
    const registration = useFocusRegistration<HTMLDivElement>(
      (step as { id?: string }).id
    );

    return (
      <div
        ref={mergeRefs(ref, registration.ref)}
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
        {...extractHtmlProps(props)}
      >
        <SelectionIndicator selected={selected} />
        {content}
      </div>
    );
  }
);
StepCard.displayName = "StepCard";
