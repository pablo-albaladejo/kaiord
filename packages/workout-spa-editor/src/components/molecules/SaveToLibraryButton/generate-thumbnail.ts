/**
 * Thumbnail Generation Utility
 *
 * Generates a thumbnail preview of a workout for the library.
 *
 * Requirements:
 * - Requirement 17.3: Generate thumbnail preview of the workout
 */

import { drawWorkoutBars } from "./thumbnail/bar-renderer";
import {
  createCanvas,
  drawBackground,
  drawPlaceholder,
  getCanvasContext,
} from "./thumbnail/canvas-setup";
import { calculateStepDurations } from "./thumbnail/duration-calculator";
import type { KRD } from "../../../types/krd";

const THUMBNAIL_CONFIG = {
  width: 300,
  height: 150,
  padding: 10,
};

/**
 * Generate a thumbnail preview of the workout
 *
 * Creates a simple visual representation of the workout structure
 * as a base64-encoded PNG image.
 */
export async function generateThumbnail(workout: KRD): Promise<string> {
  const canvas = createCanvas(THUMBNAIL_CONFIG);
  const ctx = getCanvasContext(canvas);

  drawBackground(ctx, THUMBNAIL_CONFIG.width, THUMBNAIL_CONFIG.height);

  // Get workout steps
  const workoutData = workout.extensions?.structured_workout;
  if (
    !workoutData ||
    typeof workoutData !== "object" ||
    !("steps" in workoutData) ||
    !Array.isArray(workoutData.steps)
  ) {
    drawPlaceholder(
      ctx,
      THUMBNAIL_CONFIG.width,
      THUMBNAIL_CONFIG.height,
      "Empty Workout"
    );
    return canvas.toDataURL("image/png");
  }

  const steps = workoutData.steps;
  if (steps.length === 0) {
    drawPlaceholder(
      ctx,
      THUMBNAIL_CONFIG.width,
      THUMBNAIL_CONFIG.height,
      "Empty Workout"
    );
    return canvas.toDataURL("image/png");
  }

  // Calculate durations
  const { durations, total } = calculateStepDurations(steps);

  // Draw workout bars
  drawWorkoutBars(
    ctx,
    steps,
    durations,
    total,
    THUMBNAIL_CONFIG.width,
    THUMBNAIL_CONFIG.height,
    THUMBNAIL_CONFIG.padding
  );

  return canvas.toDataURL("image/png");
}
