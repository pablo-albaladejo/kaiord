/**
 * WorkoutPreview Component
 *
 * Renders a bar chart preview of the workout structure.
 * Each bar's width is proportional to duration and height to zone/intensity.
 */

import React, { useMemo } from "react";
import { flattenWorkoutSteps } from "./flatten-steps";
import { WorkoutPreviewBar } from "./WorkoutPreviewBar";
import type { PreviewBar } from "./workout-preview-types";
import type { WorkoutPreviewProps } from "./workout-preview-types";

const VIEWBOX_WIDTH = 1000;
const MIN_BAR_WIDTH = 3;
const BAR_GAP = 1;

type BarLayout = PreviewBar & { x: number; width: number };

function formatDuration(seconds: number): string {
  return seconds >= 60 ? `${Math.round(seconds / 60)}min` : `${seconds}s`;
}

function computeLayout(bars: PreviewBar[], totalDuration: number): BarLayout[] {
  const totalGap = BAR_GAP * Math.max(bars.length - 1, 0);
  const available = VIEWBOX_WIDTH - totalGap;

  // First pass: compute widths with MIN_BAR_WIDTH enforcement
  const widths = bars.map((bar) => {
    const raw = (bar.durationSeconds / totalDuration) * available;
    return Math.max(raw, MIN_BAR_WIDTH);
  });

  // Scale down if total exceeds available space
  const totalWidth = widths.reduce((s, w) => s + w, 0);
  const scale = totalWidth > available ? available / totalWidth : 1;

  let x = 0;
  return bars.map((bar, i) => {
    const width = widths[i] * scale;
    const layout = { ...bar, x, width };
    x += width + BAR_GAP;
    return layout;
  });
}

export const WorkoutPreview: React.FC<WorkoutPreviewProps> = ({
  workout,
  selectedStepId,
  onStepSelect,
  className = "",
  height = 80,
}) => {
  const layout = useMemo(() => {
    const bars = flattenWorkoutSteps(workout);
    const total = bars.reduce((s, b) => s + b.durationSeconds, 0);
    if (bars.length === 0 || total === 0) return [];
    return computeLayout(bars, total);
  }, [workout]);

  if (layout.length === 0) return null;

  return (
    <div
      className={`overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 ${className}`}
      role="region"
      aria-label="Workout preview"
      data-testid="workout-preview"
    >
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${height}`}
        preserveAspectRatio="none"
        role="group"
        aria-label="Workout step bars"
      >
        {layout.map((bar) => (
          <WorkoutPreviewBar
            key={bar.id}
            x={bar.x}
            width={bar.width}
            height={bar.normalizedHeight * height}
            maxHeight={height}
            color={bar.color}
            isSelected={bar.stepId === selectedStepId}
            onClick={() => onStepSelect?.(bar.stepId)}
            ariaLabel={`${bar.intensity ?? "step"} ${formatDuration(bar.durationSeconds)}`}
          />
        ))}
      </svg>
    </div>
  );
};
