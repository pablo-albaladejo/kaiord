/**
 * TCX import keeps repetition blocks.
 *
 * `@kaiord/tcx` used to drop every `Repeat_t` (only a console warning), so
 * `WorkoutRepeatBlocks.tcx` opened in the editor as its warm-up and cool-down
 * alone. This imports the fixture through the editor's file input and asserts
 * the 5× block renders with its two steps, against the workspace build of
 * `@kaiord/tcx` the dev server serves.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { expect, test } from "./fixtures/base";

const IMPORT_TIMEOUT_MS = 15_000;
const FIXTURE = "WorkoutRepeatBlocks.tcx";
// Warm-up, the block's two steps, cool-down.
const STEP_CARDS = 4;

const fixture = (): Buffer =>
  readFileSync(
    fileURLToPath(
      new URL(`../../../test-fixtures/tcx/${FIXTURE}`, import.meta.url)
    )
  );

test.describe("TCX import with repetition blocks", () => {
  test("should render the Repeat_t of WorkoutRepeatBlocks.tcx as a repetition block", async ({
    page,
  }) => {
    // Arrange
    await page.goto("/workout/new?action=import");
    const input = page.getByTestId("file-upload-input");

    // Act
    await input.setInputFiles({
      name: FIXTURE,
      mimeType: "application/octet-stream",
      buffer: fixture(),
    });

    // Assert
    const block = page.getByTestId("repetition-block-card");
    await expect(block).toHaveCount(1, { timeout: IMPORT_TIMEOUT_MS });
    await expect(block.getByText("Repeat 5×")).toBeVisible();
    await expect(block.getByText("2 steps")).toBeVisible();
    await expect(block.getByTestId("step-card")).toHaveCount(2);
    await expect(page.getByTestId("step-card")).toHaveCount(STEP_CARDS);
  });
});
