/**
 * Copy/Paste E2E Tests
 *
 * Tests copy/paste functionality including:
 * - Button clicks (shows toast notifications)
 * - Keyboard shortcuts (Ctrl+C, Ctrl+V) - now also shows toast notifications
 * - Notifications
 *
 * Both keyboard shortcuts and UI buttons now use the toast-enabled hooks
 * (useCopyStep/usePasteStep), so all operations show toast notifications.
 *
 * Requirements:
 * - 39.2: Copy/paste step functionality
 * - 29: Keyboard shortcuts
 */

import { expect, test } from "./fixtures/base";
import { loadTestWorkout } from "./helpers/load-test-workout";

test.describe("Copy/Paste Functionality", () => {
  test.beforeEach(async ({ page }) => {
    // Skip on mobile projects - CopyButton uses absolute positioning (right-28)
    // that places it off-screen on small viewports (< 500px)
    test.skip(
      test.info().project.name.startsWith("Mobile"),
      "Copy-paste buttons not accessible on mobile viewports"
    );

    // Clear localStorage before navigation to start fresh
    await page.addInitScript(() => localStorage.clear());
    await page.goto("/");

    // Load a test workout
    await loadTestWorkout(page, "Copy Paste Test");
  });

  test.describe("Copy Button", () => {
    test("should copy step using copy button", async ({ page }) => {
      // Act - Click copy button on first step
      const firstStep = page.locator('[data-testid="step-card"]').first();
      await firstStep.locator('[data-testid="copy-step-button"]').click();

      // Assert - Success notification appears
      // Use .first() because Radix Toast renders text in both the visible
      // toast element and an ARIA live region, causing strict mode violations
      await expect(
        page.getByText(/step copied to clipboard/i).first()
      ).toBeVisible();
    });

    test("should copy repetition block using copy button", async ({ page }) => {
      // Note: This test requires a workout with repetition blocks
      // Skip for now as loadTestWorkout doesn't create blocks
      test.skip();

      // Act - Click copy button on repetition block
      const block = page.locator('[data-testid="repetition-block"]').first();
      await block.locator('[data-testid="copy-step-button"]').click();

      // Assert - Success notification appears
      await expect(
        page.getByText(/repetition block copied to clipboard/i).first()
      ).toBeVisible();
    });
  });

  test.describe("Paste Button", () => {
    test("should paste step using paste button", async ({ page }) => {
      // Arrange - Copy a step using the copy button (which shows toast)
      const initialStepCount = await page
        .locator('[data-testid="step-card"]')
        .count();

      const firstStep = page.locator('[data-testid="step-card"]').first();
      await firstStep.locator('[data-testid="copy-step-button"]').click();
      await expect(
        page.getByText(/step copied to clipboard/i).first()
      ).toBeVisible();

      // Act - Click paste button
      await page.locator('[data-testid="paste-step-button"]').click();

      // Assert - New step appears with success notification
      await expect(
        page.getByText(/step pasted successfully/i).first()
      ).toBeVisible();

      const newStepCount = await page
        .locator('[data-testid="step-card"]')
        .count();
      expect(newStepCount).toBe(initialStepCount + 1);
    });

    test("should show error when pasting with empty clipboard", async ({
      page,
    }) => {
      // Act - Click paste button without copying first
      await page.locator('[data-testid="paste-step-button"]').click();

      // Assert - Error notification appears
      await expect(
        page
          .getByText(
            /no content in clipboard|no valid step|clipboard does not contain/i
          )
          .first()
      ).toBeVisible();
    });
  });

  test.describe("Keyboard Shortcuts", () => {
    test("should copy step using Ctrl+C", async ({ page }) => {
      // Arrange - Select a step by clicking it
      const firstStep = page.locator('[data-testid="step-card"]').first();
      await firstStep.click();

      // Verify step is selected
      await expect(firstStep).toHaveAttribute("data-selected", "true");

      // Act - Press Ctrl+C (now shows toast via useCopyStep hook)
      await page.keyboard.press("Control+c");

      // Assert - Toast notification appears
      await expect(
        page.getByText(/step copied to clipboard/i).first()
      ).toBeVisible();
    });

    test("should copy step using Cmd+C on Mac", async ({
      page,
      browserName,
    }) => {
      // Skip on non-webkit browsers (Mac simulation)
      if (browserName !== "webkit") {
        test.skip();
      }

      // Arrange - Select a step
      const firstStep = page.locator('[data-testid="step-card"]').first();
      await firstStep.click();
      await expect(firstStep).toHaveAttribute("data-selected", "true");

      // Act - Press Cmd+C (now shows toast via useCopyStep hook)
      await page.keyboard.press("Meta+c");

      // Assert - Toast notification appears
      await expect(
        page.getByText(/step copied to clipboard/i).first()
      ).toBeVisible();
    });

    test("should paste step using Ctrl+V", async ({ page }) => {
      // Arrange - Copy a step using button (to ensure clipboard has data)
      const initialStepCount = await page
        .locator('[data-testid="step-card"]')
        .count();

      const firstStep = page.locator('[data-testid="step-card"]').first();
      await firstStep.locator('[data-testid="copy-step-button"]').click();
      await expect(
        page.getByText(/step copied to clipboard/i).first()
      ).toBeVisible();

      // Select the step so Ctrl+V knows where to paste
      await firstStep.click();
      await expect(firstStep).toHaveAttribute("data-selected", "true");

      // Act - Press Ctrl+V (now shows toast via usePasteStep hook)
      await page.keyboard.press("Control+v");

      // Assert - Toast notification and new step appear
      await expect(
        page.getByText(/step pasted successfully/i).first()
      ).toBeVisible();

      await expect(page.locator('[data-testid="step-card"]')).toHaveCount(
        initialStepCount + 1,
        { timeout: 5000 }
      );
    });

    test("should paste step using Cmd+V on Mac", async ({
      page,
      browserName,
    }) => {
      // Skip on non-webkit browsers (Mac simulation)
      if (browserName !== "webkit") {
        test.skip();
      }

      // Arrange - Copy a step using button
      const initialStepCount = await page
        .locator('[data-testid="step-card"]')
        .count();

      const firstStep = page.locator('[data-testid="step-card"]').first();
      await firstStep.locator('[data-testid="copy-step-button"]').click();
      await expect(
        page.getByText(/step copied to clipboard/i).first()
      ).toBeVisible();

      // Select the step for paste position
      await firstStep.click();
      await expect(firstStep).toHaveAttribute("data-selected", "true");

      // Act - Press Cmd+V (now shows toast via usePasteStep hook)
      await page.keyboard.press("Meta+v");

      // Assert - Toast notification and new step appear
      await expect(
        page.getByText(/step pasted successfully/i).first()
      ).toBeVisible();

      await expect(page.locator('[data-testid="step-card"]')).toHaveCount(
        initialStepCount + 1,
        { timeout: 5000 }
      );
    });
  });

  test.describe("Step Index Recalculation", () => {
    test("should recalculate step indices after paste", async ({ page }) => {
      // Arrange - Copy first step using button
      const firstStep = page.locator('[data-testid="step-card"]').first();
      await firstStep.locator('[data-testid="copy-step-button"]').click();
      await expect(
        page.getByText(/step copied to clipboard/i).first()
      ).toBeVisible();

      // Act - Paste step using button
      await page.locator('[data-testid="paste-step-button"]').click();
      await expect(
        page.getByText(/step pasted successfully/i).first()
      ).toBeVisible();

      // Assert - All steps have sequential indices
      const steps = page.locator('[data-testid="step-card"]');
      const stepCount = await steps.count();

      for (let i = 0; i < stepCount; i++) {
        const stepCard = steps.nth(i);
        // Verify step number is displayed correctly (1-indexed for display)
        await expect(stepCard.getByText(`Step ${i + 1}`)).toBeVisible();
      }
    });
  });

  test.describe("Cross-Browser Compatibility", () => {
    test("should work in Chromium", async ({ page, browserName }) => {
      test.skip(browserName !== "chromium");

      // Arrange
      const initialStepCount = await page
        .locator('[data-testid="step-card"]')
        .count();

      // Act - Copy using button, paste using button
      const firstStep = page.locator('[data-testid="step-card"]').first();
      await firstStep.locator('[data-testid="copy-step-button"]').click();
      await expect(
        page.getByText(/step copied to clipboard/i).first()
      ).toBeVisible();

      await page.locator('[data-testid="paste-step-button"]').click();

      // Assert - Step pasted successfully
      await expect(
        page.getByText(/step pasted successfully/i).first()
      ).toBeVisible();
      await expect(page.locator('[data-testid="step-card"]')).toHaveCount(
        initialStepCount + 1
      );
    });

    test("should work in Firefox", async ({ page, browserName }) => {
      test.skip(browserName !== "firefox");

      // Arrange
      const initialStepCount = await page
        .locator('[data-testid="step-card"]')
        .count();

      // Act - Copy using button, paste using button
      const firstStep = page.locator('[data-testid="step-card"]').first();
      await firstStep.locator('[data-testid="copy-step-button"]').click();
      await expect(
        page.getByText(/step copied to clipboard/i).first()
      ).toBeVisible();

      await page.locator('[data-testid="paste-step-button"]').click();

      // Assert - Step pasted successfully
      await expect(
        page.getByText(/step pasted successfully/i).first()
      ).toBeVisible();
      await expect(page.locator('[data-testid="step-card"]')).toHaveCount(
        initialStepCount + 1
      );
    });

    test("should work in WebKit", async ({ page, browserName }) => {
      test.skip(browserName !== "webkit");

      // Arrange
      const initialStepCount = await page
        .locator('[data-testid="step-card"]')
        .count();

      // Act - Copy using button, paste using button
      const firstStep = page.locator('[data-testid="step-card"]').first();
      await firstStep.locator('[data-testid="copy-step-button"]').click();
      await expect(
        page.getByText(/step copied to clipboard/i).first()
      ).toBeVisible();

      await page.locator('[data-testid="paste-step-button"]').click();

      // Assert - Step pasted successfully
      await expect(
        page.getByText(/step pasted successfully/i).first()
      ).toBeVisible();
      await expect(page.locator('[data-testid="step-card"]')).toHaveCount(
        initialStepCount + 1
      );
    });
  });

  test.describe("Notifications", () => {
    test("should show notification when copying step", async ({ page }) => {
      // Act - Use copy button (which shows toast)
      const firstStep = page.locator('[data-testid="step-card"]').first();
      await firstStep.locator('[data-testid="copy-step-button"]').click();

      // Assert - Use .first() to avoid strict mode violation from ARIA live region
      const notification = page.getByText(/step copied to clipboard/i).first();
      await expect(notification).toBeVisible();

      // Notification should disappear after timeout
      await expect(notification).not.toBeVisible({ timeout: 10000 });
    });

    test("should show notification when pasting step", async ({ page }) => {
      // Arrange - Copy using button
      const firstStep = page.locator('[data-testid="step-card"]').first();
      await firstStep.locator('[data-testid="copy-step-button"]').click();
      await expect(
        page.getByText(/step copied to clipboard/i).first()
      ).toBeVisible();

      // Act - Paste using button (which shows toast)
      await page.locator('[data-testid="paste-step-button"]').click();

      // Assert
      const notification = page.getByText(/step pasted successfully/i).first();
      await expect(notification).toBeVisible();

      // Notification should disappear after timeout
      await expect(notification).not.toBeVisible({ timeout: 10000 });
    });

    test("should show error notification when clipboard is empty", async ({
      page,
      browserName,
    }) => {
      // navigator.clipboard.writeText only works in Chromium
      test.skip(browserName !== "chromium");

      // Clear clipboard to ensure it's empty
      await page.evaluate(() => navigator.clipboard.writeText(""));

      // Act - Try to paste without copying (use button which shows toast)
      await page.locator('[data-testid="paste-step-button"]').click();

      // Assert
      const notification = page
        .getByText(
          /no content in clipboard|no valid step|clipboard does not contain/i
        )
        .first();
      await expect(notification).toBeVisible();
    });
  });
});
