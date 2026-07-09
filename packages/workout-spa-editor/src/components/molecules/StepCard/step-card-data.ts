import type { HTMLAttributes } from "react";

import { getTranslate, type Translate } from "../../../i18n/use-translate";
import { formatDuration } from "./format-duration";
import type { StepCardProps } from "./StepCard.types";
import { getStepCardClasses } from "./use-step-card-classes";

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

/** Filter out the StepCard's own props so the remainder can spread to a div. */
export function extractHtmlProps(
  props: StepCardProps
): HTMLAttributes<HTMLDivElement> {
  return Object.fromEntries(
    Object.entries(props).filter(([k]) => !OWN_PROP_KEYS.has(k))
  ) as HTMLAttributes<HTMLDivElement>;
}

/** Derive the StepCard's rendered data (label, classes, selection state). */
export function deriveStepCardData(
  props: StepCardProps,
  t: Translate = getTranslate("editor")
) {
  const {
    step,
    visualIndex,
    isSelected = false,
    isMultiSelected = false,
    onDelete,
    onDuplicate,
    onCopy,
    dragHandleProps,
    className = "",
  } = props;
  const selected = isSelected || isMultiSelected;
  const displayIndex = visualIndex ?? step.stepIndex;
  return {
    selected,
    displayIndex,
    intensity: step.intensity ?? "other",
    label: t("stepCard.ariaLabel", {
      n: displayIndex + 1,
      detail: step.name || formatDuration(step, t),
    }),
    classes: getStepCardClasses(
      selected,
      Boolean(onDelete || onDuplicate || onCopy),
      Boolean(dragHandleProps),
      className
    ),
  };
}
