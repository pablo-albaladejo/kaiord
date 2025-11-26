/**
 * Thumbnail Generation Utility
 *
 * Generates a thumbnail preview of a workout for the library.
 *
 * Requirements:
 * - Requirement 17.3: Generate thumbnail preview of the workout
 */

import type { KRD } from "../../../types/krd";

/**
 * Generate a thumbnail preview of the workout
 *
 * Creates a simple visual representation of the workout structure
 * as a base64-encoded PNG image.
 */
export async function generateThumbnail(workout: KRD): Promise<string> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  // Set canvas size
  const width = 300;
  const height = 150;
  canvas.width = width;
  canvas.height = height;

  // Background
  ctx.fillStyle = "#f3f4f6";
  ctx.fillRect(0, 0, width, height);

  // Get workout steps
  const steps = workout.extensions?.workout?.steps || [];

  if (steps.length === 0) {
    // Empty workout - show placeholder
    ctx.fillStyle = "#9ca3af";
    ctx.font = "14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Empty Workout", width / 2, height / 2);
    return canvas.toDataURL("image/png");
  }

  // Calculate total duration for scaling
  let totalDuration = 0;
  const stepDurations: number[] = [];

  for (const step of steps) {
    if ("repeatCount" in step) {
      // Repetition block
      const blockDuration = step.steps.reduce((sum, s) => {
        if (s.duration.type === "time") {
          return sum + s.duration.seconds;
        }
        return sum + 300; // Default 5 minutes for non-time durations
      }, 0);
      const duration = blockDuration * step.repeatCount;
      stepDurations.push(duration);
      totalDuration += duration;
    } else if (step.duration.type === "time") {
      stepDurations.push(step.duration.seconds);
      totalDuration += step.duration.seconds;
    } else {
      // Default duration for non-time steps
      stepDurations.push(300);
      totalDuration += 300;
    }
  }

  // Draw workout bars
  const padding = 10;
  const barHeight = height - 2 * padding;
  const availableWidth = width - 2 * padding;

  let currentX = padding;

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const duration = stepDurations[i];
    const barWidth = (duration / totalDuration) * availableWidth;

    // Determine color based on intensity or target
    let color = "#3b82f6"; // Default blue

    if ("repeatCount" in step) {
      color = "#8b5cf6"; // Purple for repetition blocks
    } else {
      const intensity = step.intensity;
      if (intensity === "warmup") {
        color = "#10b981"; // Green
      } else if (intensity === "cooldown") {
        color = "#06b6d4"; // Cyan
      } else if (intensity === "rest") {
        color = "#6b7280"; // Gray
      } else if (intensity === "active") {
        // Color based on target type
        if (step.targetType === "power") {
          color = "#ef4444"; // Red for power
        } else if (step.targetType === "heart_rate") {
          color = "#f59e0b"; // Orange for HR
        }
      }
    }

    // Draw bar
    ctx.fillStyle = color;
    ctx.fillRect(currentX, padding, barWidth, barHeight);

    // Draw border
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1;
    ctx.strokeRect(currentX, padding, barWidth, barHeight);

    currentX += barWidth;
  }

  // Convert to base64
  return canvas.toDataURL("image/png");
}
