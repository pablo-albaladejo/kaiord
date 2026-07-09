import { forwardRef } from "react";

import { useFocusRegistration } from "../../../hooks/focus/use-focus-registration";
import { useTranslate } from "../../../i18n/use-translate";
import { mergeRefs } from "../../../lib/merge-refs";
import { SelectionIndicator } from "../SelectionIndicator";
import { DragHandle } from "./DragHandle";
import { deriveStepCardData, extractHtmlProps } from "./step-card-data";
import type { DragHandleProps, StepCardProps } from "./StepCard.types";
import { StepCardActions } from "./StepCardActions";
import { StepCardFooter } from "./StepCardFooter";
import { StepDetails } from "./StepDetails";
import { StepHeader } from "./StepHeader";
import { useStepCardHandlers } from "./use-step-card-handlers";

export type { DragHandleProps, StepCardProps };

export const StepCard = forwardRef<HTMLDivElement, StepCardProps>(
  (props, ref) => {
    const {
      step,
      onSelect,
      onToggleMultiSelect,
      onDelete,
      onDuplicate,
      onCopy,
      dragHandleProps,
      isDragging = false,
    } = props;
    const t = useTranslate("editor");
    const { selected, displayIndex, intensity, label, classes } =
      deriveStepCardData(props, t);
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
        {dragHandleProps && (
          <DragHandle isDragging={isDragging} {...dragHandleProps} />
        )}
        <StepCardActions
          stepIndex={step.stepIndex}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          onCopy={onCopy}
        />
        <StepHeader
          stepName={
            step.name || t("stepCard.stepFallback", { n: displayIndex + 1 })
          }
          intensity={intensity}
        />
        <StepDetails step={step} />
        <StepCardFooter step={step} />
      </div>
    );
  }
);
StepCard.displayName = "StepCard";
