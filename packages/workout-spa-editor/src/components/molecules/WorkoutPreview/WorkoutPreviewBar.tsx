/**
 * WorkoutPreviewBar Component
 *
 * Renders a single SVG rect bar in the workout preview chart.
 */

import React from "react";
import type { WorkoutPreviewBarProps } from "./workout-preview-types";

export const WorkoutPreviewBar: React.FC<WorkoutPreviewBarProps> = ({
  x,
  width,
  height,
  maxHeight,
  color,
  isSelected,
  onClick,
  ariaLabel,
}) => (
  <rect
    x={x}
    y={maxHeight - height}
    width={Math.max(width, 0)}
    height={height}
    fill={color}
    opacity={0.85}
    stroke={isSelected ? "#2563eb" : "transparent"}
    strokeWidth={isSelected ? 2 : 0}
    role="button"
    tabIndex={0}
    aria-label={ariaLabel}
    onClick={onClick}
    onKeyDown={(e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick();
      }
    }}
    className="cursor-pointer transition-opacity hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
  />
);
