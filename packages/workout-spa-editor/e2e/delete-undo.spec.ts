import { expect, test } from "@playwright/test";

/**
 * E2E Tests: Delete with Undo Flow
 *
 * Requirements covered:
 * - Requirement 39.3.1: Display notification with undo option for 5 seconds
 * - Requirement 39.3.2: Restore deleted step to original position on undo
 * - Requirement 39.3.3: Permanently delete step after notification dismisses
 * - Requirement 39.3.4: Show separate notifications for multiple deletions
 */
test.describe("Delete with Undo Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");

    // Load a test workout with multiple steps
    const fileInput = page.locator('input[type="file"]');
    const testWorkout = {
      version: "1.0",
      type: "workout",
      metadata: {
        created: new Date().toISOString(),
        sport: "cycling",
      },
      extensions: {
        workout: {
          name: "Delete Undo Test",
          sport: "cycling",
          steps: [
            {
              stepIndex: 0,
              durationType: "time",
              duration: { type: "time", seconds: 300 },
              targetType: "power",
              target: {
                type: "power",
                value: { unit: "watts", value: 200 },
              },
              intensity: "warmup",
            },
            {
              stepIndex: 1,
              durationType: "time",
              duration: { type: "time", seconds: 600 },
              targetType: "power",
              target: {
                type: "power",
                value: { unit: "watts", value: 250 },
              },
              intensity: "active",
            },
            {
              stepIndex: 2,
              durationType: "time",
              duration: { type: "time", seconds: 300 },
              targetType: "power",
              target: {
                type: "power",
                value: { unit: "watts", value: 150 },
              },
              intensity: "cooldown",
            },
          ],
        },
      },
    };

    await fileInput.setInputFiles({
      name: "delete-undo-test.krd",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(testWorkout)),
    });

    // Wait for workout to load
    await expect(page.getByText("Delete Undo Test")).toBeVisible({
      timeout: 10000,
    });
  });

  test("should show undo notification when step is deleted", async ({
    page,
  }) => {
    // Requirement 39.3.1: Display notification with undo option for 5 seconds

    // Verify initial state - 3 steps
    const stepCards = page.locator('[data-testid="step-card"]');
    await expect(stepCards).toHaveCount(3);

    // Delete the second step
    const secondStepCard = stepCards.nth(1);
    const deleteButton = secondStepCard.getByTestId("delete-step-button");
    await deleteButton.click();

    // Confirm deletion in dialog
    await page.getByTestId("confirm-delete-button").click();

    // Verify undo notification appears
    const toast = page
      .locator('[role="status"]')
      .filter({ hasText: "Step deleted" });
    await expect(toast).toBeVisible({ timeout: 2000 });

    // Verify undo button is present in the notification
    const undoButton = page.getByTestId("undo-delete-button");
    await expect(undoButton).toBeVisible();

    // Verify step was deleted (should have 2 steps now)
    await expect(stepCards).toHaveCount(2);
  });

  test("should restore deleted step when undo button is clicked", async ({
    page,
  }) => {
    // Requirement 39.3.2: Restore deleted step to original position on undo

    const stepCards = page.locator('[data-testid="step-card"]');
    await expect(stepCards).toHaveCount(3);

    // Get the content of the second step before deletion
    const secondStepCard = stepCards.nth(1);
    const stepContent = await secondStepCard.textContent();

    // Delete the second step
    const deleteButton = secondStepCard.getByTestId("delete-step-button");
    await deleteButton.click();
    await page.getByTestId("confirm-delete-button").click();

    // Verify step was deleted
    await expect(stepCards).toHaveCount(2);

    // Click undo button in the notification
    const toast = page
      .locator('[role="status"]')
      .filter({ hasText: "Step deleted" });
    const undoButton = page.getByTestId("undo-delete-button");
    await undoButton.click();

    // Verify step was restored
    await expect(stepCards).toHaveCount(3, { timeout: 2000 });

    // Verify the restored step is at the original position (index 1)
    const restoredStep = stepCards.nth(1);
    const restoredContent = await restoredStep.textContent();
    expect(restoredContent).toBe(stepContent);

    // Verify the notification is dismissed after undo
    await expect(toast).not.toBeVisible({ timeout: 1000 });
  });

  test("should auto-dismiss notification after 5 seconds", async ({ page }) => {
    // Requirement 39.3.3: Permanently delete step after notification dismisses

    const stepCards = page.locator('[data-testid="step-card"]');
    await expect(stepCards).toHaveCount(3);

    // Delete the second step
    const secondStepCard = stepCards.nth(1);
    const deleteButton = secondStepCard.getByTestId("delete-step-button");
    await deleteButton.click();
    await page.getByTestId("confirm-delete-button").click();

    // Verify notification appears
    const toast = page
      .locator('[role="status"]')
      .filter({ hasText: "Step deleted" });
    await expect(toast).toBeVisible();

    // Wait for notification to auto-dismiss (5 seconds + buffer)
    await expect(toast).not.toBeVisible({ timeout: 6000 });

    // Verify step remains deleted (cannot be undone after auto-dismiss)
    await expect(stepCards).toHaveCount(2);
  });

  test("should show separate notifications for multiple deletions", async ({
    page,
  }) => {
    // Requirement 39.3.4: Show separate notifications for multiple deletions

    const stepCards = page.locator('[data-testid="step-card"]');
    await expect(stepCards).toHaveCount(3);

    // Delete the first step
    const firstStepCard = stepCards.nth(0);
    const firstDeleteButton = firstStepCard.getByTestId("delete-step-button");
    await firstDeleteButton.click();
    await page.getByTestId("confirm-delete-button").click();

    // Verify first notification appears
    const toasts = page
      .locator('[role="status"]')
      .filter({ hasText: "Step deleted" });
    await expect(toasts.first()).toBeVisible();

    // Wait a moment for the first deletion to complete
    await page.waitForTimeout(500);

    // Delete another step (now at index 0 after first deletion)
    const secondDeleteButton = stepCards
      .nth(0)
      .getByTestId("delete-step-button");
    await secondDeleteButton.click();
    await page.getByTestId("confirm-delete-button").click();

    // Verify second notification appears
    // Both notifications should be visible simultaneously
    await expect(toasts).toHaveCount(2, { timeout: 2000 });

    // Verify both undo buttons are present
    const undoButtons = page.getByTestId("undo-delete-button");
    await expect(undoButtons).toHaveCount(2);

    // Verify only 1 step remains
    await expect(stepCards).toHaveCount(1);
  });

  test("should handle undo correctly with step reindexing", async ({
    page,
  }) => {
    // Test that undo works correctly when step indices change after deletion

    const stepCards = page.locator('[data-testid="step-card"]');
    await expect(stepCards).toHaveCount(3);

    // Delete the first step (index 0)
    const firstStepCard = stepCards.nth(0);
    const deleteButton = firstStepCard.getByTestId("delete-step-button");
    await deleteButton.click();
    await page.getByTestId("confirm-delete-button").click();

    // Verify step was deleted (2 steps remain)
    await expect(stepCards).toHaveCount(2);

    // The remaining steps should now be at indices 0 and 1
    // Original step 2 (250W) should now be at index 0
    // Original step 3 (150W) should now be at index 1

    // Click undo
    const undoButton = page.getByTestId("undo-delete-button");
    await undoButton.click();

    // Verify all 3 steps are restored
    await expect(stepCards).toHaveCount(3, { timeout: 2000 });

    // Verify the first step (200W warmup) is back at index 0
    const restoredFirstStep = stepCards.nth(0);
    await expect(restoredFirstStep).toContainText("200");
    await expect(restoredFirstStep).toContainText("warmup");
  });

  test("should keep undo option available when performing other actions", async ({
    page,
  }) => {
    // Requirement 39.3.5: Keep undo option available when performing other actions

    const stepCards = page.locator('[data-testid="step-card"]');
    await expect(stepCards).toHaveCount(3);

    // Delete a step
    const secondStepCard = stepCards.nth(1);
    const deleteButton = secondStepCard.getByTestId("delete-step-button");
    await deleteButton.click();
    await page.getByTestId("confirm-delete-button").click();

    // Verify notification appears
    const toast = page
      .locator('[role="status"]')
      .filter({ hasText: "Step deleted" });
    await expect(toast).toBeVisible();

    // Perform another action - select a different step
    const firstStepCard = stepCards.nth(0);
    await firstStepCard.click();

    // Verify notification is still visible
    await expect(toast).toBeVisible();

    // Verify undo button is still clickable
    const undoButton = page.getByTestId("undo-delete-button");
    await expect(undoButton).toBeVisible();
    await undoButton.click();

    // Verify step was restored
    await expect(stepCards).toHaveCount(3, { timeout: 2000 });
  });
});
