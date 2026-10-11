/**
 * E2E: a runner types a session the way they say it — four times 3:00 at
 * 4:30/km — exports it to FIT and imports the file back. Every step must
 * come back with the same duration and the same pace, on the real path:
 * nothing is seeded, the steps are typed into the step editor.
 */

import { readFileSync } from "node:fs";

import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures/base";
import { seedEmptyWorkout } from "./helpers/seed-empty-workout";

const NAME = "E2E pace repeats";
const REPEATS = 4;
const DURATION = "3:00";
const PACE = "4:30";
/** How a step card writes 180 s. */
const CARD_DURATION = "3 min";

async function addPaceStep(page: Page, index: number): Promise<void> {
  const first = page.getByTestId("add-first-step-button");
  if (index === 0) await first.click();
  else await page.getByTestId("add-step-button").click();
  await page.getByText(`Step ${index + 1}`, { exact: true }).click();
  await page.getByLabel("Select duration type").selectOption("time");
  await page.getByLabel("Duration (mm:ss)").fill(DURATION);
  await page.getByLabel("Select target type").selectOption("pace");
  await page.getByLabel("Pace (min/km)").fill(PACE);
  await page.getByRole("button", { name: "Close the step form" }).click();
  await expect(page.getByTestId("step-editor")).toHaveCount(0);
}

async function exportFit(page: Page): Promise<Buffer> {
  await page.getByTestId("export-format-selector-button").click();
  await page.getByTestId("export-format-option-fit").click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: /download a file/i }).click();
  return readFileSync(await (await download).path());
}

test.describe("Pace typed in min/km", () => {
  test("should survive a FIT export and reimport with the same targets", async ({
    page,
  }) => {
    // Arrange
    await page.goto("/workout/new?source=scratch");
    await page.getByTestId("edit-metadata-button").click();
    await page.getByTestId("workout-name-input").fill(NAME);
    await page.getByTestId("workout-sport-select").selectOption("running");
    await page.getByTestId("save-metadata-button").click();
    for (let index = 0; index < REPEATS; index++) {
      await addPaceStep(page, index);
    }

    // Act
    const fit = await exportFit(page);
    await seedEmptyWorkout(page);
    await page.getByTestId("file-upload-input").setInputFiles({
      name: "pace-repeats.fit",
      mimeType: "application/octet-stream",
      buffer: fit,
    });

    // Assert
    const cards = page.getByTestId("step-card");
    await expect(cards).toHaveCount(REPEATS);
    for (let index = 0; index < REPEATS; index++) {
      await expect(cards.nth(index)).toContainText(CARD_DURATION);
      await expect(cards.nth(index)).toContainText(`${PACE} min/km`);
    }
    await cards.first().click();
    await expect(page.getByLabel("Duration (mm:ss)")).toHaveValue(DURATION);
    await expect(page.getByLabel("Pace (min/km)")).toHaveValue(PACE);
  });
});
