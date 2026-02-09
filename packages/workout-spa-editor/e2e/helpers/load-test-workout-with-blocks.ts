import { expect } from "@playwright/test";
import { buildRepetitionSteps } from "./build-repetition-steps";
import type { Page } from "@playwright/test";

export type RepetitionBlock = {
  repeatCount: number;
  sport?: "cycling" | "running";
  durationSeconds?: number;
  targetWatts?: number;
  targetPace?: number;
};

/**
 * Load a test workout containing repetition blocks.
 *
 * Useful for testing block-level actions like delete confirmation.
 */
export async function loadTestWorkoutWithBlocks(
  page: Page,
  workoutName: string,
  blocks: RepetitionBlock[]
) {
  const fileInput = page.locator('input[type="file"]');
  const sport = blocks[0]?.sport ?? "cycling";
  const steps = blocks.map(buildRepetitionSteps);

  const testWorkout = {
    version: "1.0",
    type: "structured_workout",
    metadata: { created: new Date().toISOString(), sport },
    extensions: {
      structured_workout: { name: workoutName, sport, steps },
    },
  };

  const fileName = workoutName.toLowerCase().replace(/\s+/g, "-");
  await fileInput.setInputFiles({
    name: `${fileName}.krd`,
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(testWorkout)),
  });

  await expect(page.getByText(workoutName)).toBeVisible({
    timeout: 10000,
  });
  await expect(page.getByTestId("repetition-block-card").first()).toBeVisible({
    timeout: 5000,
  });
}
