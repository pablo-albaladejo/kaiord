/**
 * Copy/Paste E2E Tests
 *
 * Tests copy/paste functionality including:
 * - Button clicks
 * - Keyboard shortcuts (Ctrl+C, Ctrl+V)
 * - Cross-browser compatibility
 * - Notifications
 *
 * Requirements:
 * - 39.2: Copy/paste step functionality
 * - 29: Keyboard shortcuts
 */

import { expect, test } from "@playwright/test";

test.describe("Copy/Paste Functionality", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");

    // Wait for app to load
    await page.waitForSelector('[data-testid="workout-editor"]', {
      state: "visible",
    });
  });

  test.describe("Copy Button", () => {
    test("should copy step using copy button", async ({ page }) => {
      // Arrange - Load a workout with steps
      await page.getByRole("button", { name: /load workout/i }).click();
      await page.waitForSelector('[data-testid="step-card"]', {
        state: "visible",
      });

      // Act - Click copy button on first step
      const firstStep = page.locator('[data-testid="step-card"]').first();
      await firstStep.locator('[data-testid="copy-step-button"]').click();

      // Assert - Success notification appears
      await expect(page.getByText(/step copied to clipboard/i)).toBeVisible();
    });

    test("should copy repetition block using copy button", async ({ page }) => {
      // Arrange - Load a workout with repetition blocks
      await page.getByRole("button", { name: /load workout/i }).click();
      await page.waitForSelector('[data-testid="repetition-block"]', {
        state: "visible",
      });

      // Act - Click copy button on repetition block
      const block = page.locator('[data-testid="repetition-block"]').first();
      await block.locator('[data-testid="copy-step-button"]').click();

      // Assert - Success notification appears
      await expect(
        page.getByText(/repetition block copied to clipboard/i)
      ).toBeVisible();
    });
  });

  test.describe("Paste Button", () => {
    test("should paste step using paste button", async ({ page }) => {
      // Arrange - Load workout and copy a step
      await page.getByRole("button", { name: /load workout/i }).click();
      await page.waitForSelector('[data-testid="step-card"]', {
        state: "visible",
      });

      const initialStepCount = await page
        .locator('[data-testid="step-card"]')
        .count();

      const firstStep = page.locator('[data-testid="step-card"]').first();
      await firstStep.locator('[data-testid="copy-step-button"]').click();
      await page.waitForSelector("text=/step copied to clipboard/i");

      // Act - Click paste button
      await page.getByRole("button", { name: /paste step/i }).click();

      // Assert - New step appears
      await expect(page.getByText(/step pasted successfully/i)).toBeVisible();

      const newStepCount = await page
        .locator('[data-testid="step-card"]')
        .count();
      expect(newStepCount).toBe(initialStepCount + 1);
    });

    test("should show error when pasting with empty clipboard", async ({
      page,
    }) => {
      // Arrange - Load workout without copying
      await page.getByRole("button", { name: /load workout/i }).click();
      await page.waitForSelector('[data-testid="step-card"]', {
        state: "visible",
      });

      // Act - Click paste button without copying first
      await page.getByRole("button", { name: /paste step/i }).click();

      // Assert - Error notification appears
      await expect(
        page.getByText(/no content in clipboard|no valid step/i)
      ).toBeVisible();
    });
  });

  test.describe("Keyboard Shortcuts", () => {
    test("should copy step using Ctrl+C", async ({ page }) => {
      // Arrange - Load workout and select a step
      await page.getByRole("button", { name: /load workout/i }).click();
      await page.waitForSelector('[data-testid="step-card"]', {
        state: "visible",
      });

      const firstStep = page.locator('[data-testid="step-card"]').first();
      await firstStep.click();

      // Act - Press Ctrl+C
      await page.keyboard.press("Control+c");

      // Assert - Success notification appears
      await expect(page.getByText(/step copied to clipboard/i)).toBeVisible();
    });

    test("should copy step using Cmd+C on Mac", async ({
      page,
      browserName,
    }) => {
      // Skip on non-webkit browsers (Mac simulation)
      if (browserName !== "webkit") {
        test.skip();
      }

      // Arrange - Load workout and select a step
      await page.getByRole("button", { name: /load workout/i }).click();
      await page.waitForSelector('[data-testid="step-card"]', {
        state: "visible",
      });

      const firstStep = page.locator('[data-testid="step-card"]').first();
      await firstStep.click();

      // Act - Press Cmd+C
      await page.keyboard.press("Meta+c");

      // Assert - Success notification appears
      await expect(page.getByText(/step copied to clipboard/i)).toBeVisible();
    });

    test("should paste step using Ctrl+V", async ({ page }) => {
      // Arrange - Load workout, copy a step
      await page.getByRole("button", { name: /load workout/i }).click();
      await page.waitForSelector('[data-testid="step-card"]', {
        state: "visible",
      });

      const initialStepCount = await page
        .locator('[data-testid="step-card"]')
        .count();

      const firstStep = page.locator('[data-testid="step-card"]').first();
      await firstStep.click();
      await page.keyboard.press("Control+c");
      await page.waitForSelector("text=/step copied to clipboard/i");

      // Act - Press Ctrl+V
      await page.keyboard.press("Control+v");

      // Assert - New step appears
      await expect(page.getByText(/step pasted successfully/i)).toBeVisible();

      const newStepCount = await page
        .locator('[data-testid="step-card"]')
        .count();
      expect(newStepCount).toBe(initialStepCount + 1);
    });

    test("should paste step using Cmd+V on Mac", async ({
      page,
      browserName,
    }) => {
      // Skip on non-webkit browsers (Mac simulation)
      if (browserName !== "webkit") {
        test.skip();
      }

      // Arrange - Load workout, copy a step
      await page.getByRole("button", { name: /load workout/i }).click();
      await page.waitForSelector('[data-testid="step-card"]', {
        state: "visible",
      });

      const initialStepCount = await page
        .locator('[data-testid="step-card"]')
        .count();

      const firstStep = page.locator('[data-testid="step-card"]').first();
      await firstStep.click();
      await page.keyboard.press("Meta+c");
      await page.waitForSelector("text=/step copied to clipboard/i");

      // Act - Press Cmd+V
      await page.keyboard.press("Meta+v");

      // Assert - New step appears
      await expect(page.getByText(/step pasted successfully/i)).toBeVisible();

      const newStepCount = await page
        .locator('[data-testid="step-card"]')
        .count();
      expect(newStepCount).toBe(initialStepCount + 1);
    });
  });

  test.describe("Step Index Recalculation", () => {
    test("should recalculate step indices after paste", async ({ page }) => {
      // Arrange - Load workout with 3 steps
      await page.getByRole("button", { name: /load workout/i }).click();
      await page.waitForSelector('[data-testid="step-card"]', {
        state: "visible",
      });

      // Copy first step
      const firstStep = page.locator('[data-testid="step-card"]').first();
      await firstStep.click();
      await page.keyboard.press("Control+c");
      await page.waitForSelector("text=/step copied to clipboard/i");

      // Act - Paste step
      await page.keyboard.press("Control+v");
      await page.waitForSelector("text=/step pasted successfully/i");

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
      await page.getByRole("button", { name: /load workout/i }).click();
      await page.waitForSelector('[data-testid="step-card"]', {
        state: "visible",
      });

      // Act - Copy and paste
      const firstStep = page.locator('[data-testid="step-card"]').first();
      await firstStep.click();
      await page.keyboard.press("Control+c");
      await page.keyboard.press("Control+v");

      // Assert
      await expect(page.getByText(/step pasted successfully/i)).toBeVisible();
    });

    test("should work in Firefox", async ({ page, browserName }) => {
      test.skip(browserName !== "firefox");

      // Arrange
      await page.getByRole("button", { name: /load workout/i }).click();
      await page.waitForSelector('[data-testid="step-card"]', {
        state: "visible",
      });

      // Act - Copy and paste
      const firstStep = page.locator('[data-testid="step-card"]').first();
      await firstStep.click();
      await page.keyboard.press("Control+c");
      await page.keyboard.press("Control+v");

      // Assert
      await expect(page.getByText(/step pasted successfully/i)).toBeVisible();
    });

    test("should work in WebKit", async ({ page, browserName }) => {
      test.skip(browserName !== "webkit");

      // Arrange
      await page.getByRole("button", { name: /load workout/i }).click();
      await page.waitForSelector('[data-testid="step-card"]', {
        state: "visible",
      });

      // Act - Copy and paste
      const firstStep = page.locator('[data-testid="step-card"]').first();
      await firstStep.click();
      await page.keyboard.press("Meta+c");
      await page.keyboard.press("Meta+v");

      // Assert
      await expect(page.getByText(/step pasted successfully/i)).toBeVisible();
    });
  });

  test.describe("Notifications", () => {
    test("should show notification when copying step", async ({ page }) => {
      // Arrange
      await page.getByRole("button", { name: /load workout/i }).click();
      await page.waitForSelector('[data-testid="step-card"]', {
        state: "visible",
      });

      // Act
      const firstStep = page.locator('[data-testid="step-card"]').first();
      await firstStep.locator('[data-testid="copy-step-button"]').click();

      // Assert
      const notification = page.getByText(/step copied to clipboard/i);
      await expect(notification).toBeVisible();

      // Notification should disappear after timeout
      await expect(notification).not.toBeVisible({ timeout: 5000 });
    });

    test("should show notification when pasting step", async ({ page }) => {
      // Arrange
      await page.getByRole("button", { name: /load workout/i }).click();
      await page.waitForSelector('[data-testid="step-card"]', {
        state: "visible",
      });

      const firstStep = page.locator('[data-testid="step-card"]').first();
      await firstStep.click();
      await page.keyboard.press("Control+c");
      await page.waitForSelector("text=/step copied to clipboard/i");

      // Act
      await page.keyboard.press("Control+v");

      // Assert
      const notification = page.getByText(/step pasted successfully/i);
      await expect(notification).toBeVisible();

      // Notification should disappear after timeout
      await expect(notification).not.toBeVisible({ timeout: 5000 });
    });

    test("should show error notification when clipboard is empty", async ({
      page,
    }) => {
      // Arrange
      await page.getByRole("button", { name: /load workout/i }).click();
      await page.waitForSelector('[data-testid="step-card"]', {
        state: "visible",
      });

      // Act - Try to paste without copying
      await page.keyboard.press("Control+v");

      // Assert
      const notification = page.getByText(
        /no content in clipboard|no valid step/i
      );
      await expect(notification).toBeVisible();
    });
  });
});
