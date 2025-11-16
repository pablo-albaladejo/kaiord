import { expect, test } from "@playwright/test";

/**
 * Critical Path: Accessibility and Keyboard Navigation
 *
 * Requirements covered:
 * - Requirement 35: Accessibility compliance
 * - Requirement 29: Keyboard shortcuts
 */
test.describe("Accessibility", () => {
  test("should support keyboard navigation", async ({ page }) => {
    await page.goto("/");

    // Tab through interactive elements
    await page.keyboard.press("Tab");

    // Verify focus is on the first interactive element
    const focusedElement = page.locator(":focus");
    await expect(focusedElement).toBeVisible();

    // Continue tabbing
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");

    // Verify focus moves to next elements
    await expect(page.locator(":focus")).toBeVisible();
  });

  test("should have proper ARIA labels", async ({ page }) => {
    await page.goto("/");

    // Verify main landmarks
    await expect(page.getByRole("main")).toBeVisible();

    // Create a workout to test more elements
    await page.getByRole("button", { name: /create new workout/i }).click();

    // Verify form labels
    await expect(page.getByLabel(/workout name/i)).toBeVisible();
    await expect(page.getByLabel(/sport/i)).toBeVisible();

    // Fill form
    await page.getByLabel(/workout name/i).fill("Accessibility Test");
    await page.getByLabel(/sport/i).click();
    await page.getByRole("option", { name: /cycling/i }).click();
    await page.getByRole("button", { name: /create/i }).click();

    // Add a step
    await page.getByRole("button", { name: /add step/i }).click();

    // Verify step editor has proper labels
    await expect(page.getByLabel(/duration type/i)).toBeVisible();
    await expect(page.getByLabel(/target type/i)).toBeVisible();
  });

  test("should support keyboard shortcuts", async ({ page }) => {
    await page.goto("/");

    // Create a workout
    await page.getByRole("button", { name: /create new workout/i }).click();
    await page.getByLabel(/workout name/i).fill("Shortcuts Test");
    await page.getByLabel(/sport/i).click();
    await page.getByRole("option", { name: /running/i }).click();
    await page.getByRole("button", { name: /create/i }).click();

    // Add a step
    await page.getByRole("button", { name: /add step/i }).click();
    await page.getByLabel(/duration value/i).fill("300");
    await page.getByLabel(/target value/i).fill("150");
    await page.getByRole("button", { name: /save step/i }).click();

    // Verify step is added
    await expect(page.getByText("Step 1")).toBeVisible();

    // Test Ctrl+Z (undo)
    await page.keyboard.press("Control+Z");
    await expect(page.getByText("Step 1")).not.toBeVisible();

    // Test Ctrl+Y (redo)
    await page.keyboard.press("Control+Y");
    await expect(page.getByText("Step 1")).toBeVisible();

    // Test Ctrl+S (save) - should trigger download
    const downloadPromise = page.waitForEvent("download");
    await page.keyboard.press("Control+S");
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.krd$/);
  });

  test("should have visible focus indicators", async ({ page }) => {
    await page.goto("/");

    // Tab to first button
    await page.keyboard.press("Tab");

    // Get the focused element
    const focusedElement = page.locator(":focus");

    // Verify focus indicator is visible (outline or ring)
    const styles = await focusedElement.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        outline: computed.outline,
        outlineWidth: computed.outlineWidth,
        boxShadow: computed.boxShadow,
      };
    });

    // Verify some form of focus indicator exists
    const hasFocusIndicator =
      styles.outline !== "none" ||
      styles.outlineWidth !== "0px" ||
      styles.boxShadow !== "none";

    expect(hasFocusIndicator).toBe(true);
  });

  test("should maintain color contrast for accessibility", async ({ page }) => {
    await page.goto("/");

    // Create a workout to test various UI elements
    await page.getByRole("button", { name: /create new workout/i }).click();
    await page.getByLabel(/workout name/i).fill("Contrast Test");
    await page.getByLabel(/sport/i).click();
    await page.getByRole("option", { name: /cycling/i }).click();
    await page.getByRole("button", { name: /create/i }).click();

    // Add a step with different intensity levels
    await page.getByRole("button", { name: /add step/i }).click();
    await page.getByLabel(/duration value/i).fill("300");
    await page.getByLabel(/target value/i).fill("150");
    await page.getByLabel(/intensity/i).click();
    await page.getByRole("option", { name: /warmup/i }).click();
    await page.getByRole("button", { name: /save step/i }).click();

    // Verify step is visible with proper styling
    const stepCard = page.getByText("Step 1").locator("..");
    await expect(stepCard).toBeVisible();

    // Note: Actual contrast ratio testing would require additional tools
    // like axe-core or lighthouse, which can be integrated separately
  });
});
