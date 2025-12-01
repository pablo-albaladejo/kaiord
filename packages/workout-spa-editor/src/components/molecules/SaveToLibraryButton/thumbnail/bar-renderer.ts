/**
 * Bar Renderer
 *
 * Renders workout bars on the canvas.
 */

import { getStepColor } from "./step-colors";

export function drawWorkoutBars(
  ctx: CanvasRenderingContext2D,
  steps: unknown[],
  durations: number[],
  totalDuration: number,
  width: number,
  height: number,
  padding: number
): void {
  const barHeight = height - 2 * padding;
  const availableWidth = width - 2 * padding;
  let currentX = padding;

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const duration = durations[i];
    const barWidth = (duration / totalDuration) * availableWidth;
    const color = getStepColor(step);

    // Draw bar
    ctx.fillStyle = color;
    ctx.fillRect(currentX, padding, barWidth, barHeight);

    // Draw border
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1;
    ctx.strokeRect(currentX, padding, barWidth, barHeight);

    currentX += barWidth;
  }
}
