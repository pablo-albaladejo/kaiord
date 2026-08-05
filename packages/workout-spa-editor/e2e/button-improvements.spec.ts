import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures/base";
import { seedEmptyWorkout } from "./helpers/seed-empty-workout";

/**
 * E2E contract for the editor's action row after the verb cut.
 *
 * Seven verbs became three; the row under the canvas carries exactly the
 * ones that end the task — Keep in library · Download a file · Discard
 * workout — and the send lives on the EditorStateRibbon, not here. Labels
 * are sentence-cased V2 copy, asserted EXACTLY: the old title-case
 * capitalization suite pinned a style this design retired, and a looser
 * regex would let either style through.
 *
 * The predecessor of this file asserted pixel geometry of the previous
 * button row behind `if (boundingBox)` guards, which pass silently when a
 * button is missing. Every assertion here is unconditional.
 */

// WCAG-ish tap floor and the asserted mobile viewport width.
const MIN_TAP_HEIGHT_PX = 32;
const MOBILE_VIEWPORT_WIDTH_PX = 375;

const WORKOUT = {
  version: "1.0",
  type: "structured_workout",
  metadata: { created: new Date().toISOString(), sport: "cycling" },
  extensions: {
    structured_workout: {
      name: "Action Row Workout",
      sport: "cycling",
      steps: [
        {
          stepIndex: 0,
          durationType: "time",
          duration: { type: "time", seconds: 300 },
          targetType: "power",
          target: { type: "power", value: { unit: "watts", value: 200 } },
          intensity: "active",
        },
      ],
    },
  },
};

const loadWorkout = async (page: Page) => {
  await page.goto("/workout/new?source=scratch");
  await seedEmptyWorkout(page);
  await page.locator('input[type="file"]').setInputFiles({
    name: "action-row.krd",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(WORKOUT)),
  });
  await expect(page.getByText("Action Row Workout")).toBeVisible({
    timeout: 10000,
  });
  await expect(page.getByTestId("workout-section")).toBeVisible();
};

const actionRow = (page: Page) => ({
  keep: page.getByRole("button", { name: "Keep in library" }),
  download: page.getByRole("button", { name: "Download a file" }),
  discard: page.getByTestId("discard-workout-button"),
});

test.describe("Editor action row — the three verbs", () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test("carries exactly Keep, Download and Discard, sentence-cased", async ({
    page,
  }) => {
    await loadWorkout(page);
    const { keep, download, discard } = actionRow(page);

    await expect(keep).toBeVisible();
    await expect(download).toBeVisible();
    await expect(discard).toBeVisible();
    await expect(discard).toHaveText(/Discard workout/);

    // The retired verbs stay retired — everywhere, not just here.
    for (const gone of [
      /^Save Workout$/i,
      /^Save to Library$/i,
      /^Accept Workout$/i,
      /^Push to Garmin$/i,
    ]) {
      await expect(page.getByRole("button", { name: gone })).toHaveCount(0);
    }
  });

  test("sends from the ribbon only: the row cannot reach the watch", async ({
    page,
  }) => {
    await loadWorkout(page);

    // Without the bridge the ribbon may name its broken gate, but no send
    // control renders anywhere — one path to the watch, currently closed.
    await expect(page.getByTestId("send-to-garmin-button")).toHaveCount(0);
  });

  test("lays the three out on one row on desktop, Discard pushed right", async ({
    page,
  }) => {
    await loadWorkout(page);
    const { keep, download, discard } = actionRow(page);

    const keepBox = await keep.boundingBox();
    const downloadBox = await download.boundingBox();
    const discardBox = await discard.boundingBox();
    expect(keepBox).not.toBeNull();
    expect(downloadBox).not.toBeNull();
    expect(discardBox).not.toBeNull();

    // One row: vertical centers within a button's height of each other.
    const centers = [keepBox!, downloadBox!, discardBox!].map(
      (b) => b.y + b.height / 2
    );
    expect(Math.max(...centers) - Math.min(...centers)).toBeLessThan(
      keepBox!.height
    );

    // Keep → Download reading order; Discard parked at the far edge.
    expect(downloadBox!.x).toBeGreaterThan(keepBox!.x);
    expect(discardBox!.x).toBeGreaterThan(downloadBox!.x + downloadBox!.width);
  });
});

test.describe("Editor action row — mobile", () => {
  test.use({ viewport: { width: MOBILE_VIEWPORT_WIDTH_PX, height: 812 } });

  test("keeps every verb reachable and tappable at 375px", async ({
    page,
  }) => {
    await loadWorkout(page);
    const { keep, download, discard } = actionRow(page);

    for (const button of [keep, download, discard]) {
      await expect(button).toBeVisible();
      const box = await button.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.height).toBeGreaterThanOrEqual(MIN_TAP_HEIGHT_PX);
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(MOBILE_VIEWPORT_WIDTH_PX);
    }
  });
});
