import { expect, test } from "./fixtures/base";

/**
 * E2E Tests: Modal Interactions
 *
 * Requirements covered:
 * - Requirement 6.1: Display modal dialog instead of browser alert
 * - Requirement 6.3: Trap keyboard focus within modal
 * - Requirement 6.5: Allow Escape key to dismiss modal
 * - Requirement 6.6: Prevent background interaction
 * - Requirement 6.9: Adapt to mobile screens
 *
 * Tests the modal dialog behavior for confirmation actions.
 */

test.describe("Modal Interactions", () => {
  test.beforeEach(async ({ page }) => {
    // Skip onboarding tutorial for all tests
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem("workout-spa-onboarding-completed", "true");
    });
  });

  test("should display confirmation modal instead of browser alert when deleting block", async ({
    page,
  }) => {
    // Requirement 6.1: Display modal dialog instead of browser alert
    await page.goto("/");

    // Load a workout with a repetition block
    const fileInput = page.getByTestId("file-upload-input");
    const testWorkout = {
      version: "1.0",
      type: "structured_workout",
      metadata: {
        created: new Date().toISOString(),
        sport: "cycling",
      },
      extensions: {
        structured_workout: {
          name: "Modal Test",
          sport: "cycling",
          steps: [
            {
              repeatCount: 3,
              steps: [
                {
                  stepIndex: 0,
                  durationType: "time",
                  duration: { type: "time", seconds: 60 },
                  targetType: "power",
                  target: {
                    type: "power",
                    value: { unit: "watts", value: 200 },
                  },
                  intensity: "active",
                },
              ],
            },
          ],
        },
      },
    };

    await fileInput.setInputFiles({
      name: "modal-test.krd",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(testWorkout)),
    });

    // Wait for workout to load
    await expect(page.getByText("Modal Test")).toBeVisible({
      timeout: 10000,
    });

    // Set up dialog listener to catch any browser alerts (should not happen)
    let browserAlertShown = false;
    page.on("dialog", () => {
      browserAlertShown = true;
    });

    // Open context menu and click delete
    await page.getByTestId("block-actions-trigger").click();
    await page.getByRole("menuitem", { name: /delete/i }).click();

    // Verify modal appears (not browser alert)
    await expect(
      page.getByRole("dialog").or(page.getByTestId("modal-backdrop"))
    ).toBeVisible({ timeout: 5000 });

    // Verify no browser alert was shown
    expect(browserAlertShown).toBe(false);

    // Verify modal content
    await expect(
      page.getByText(/are you sure you want to delete/i)
    ).toBeVisible();
  });

  test("should dismiss modal when Escape key is pressed", async ({ page }) => {
    // Requirement 6.5: Allow Escape key to dismiss modal
    await page.goto("/");

    // Load a workout with a repetition block
    const fileInput = page.getByTestId("file-upload-input");
    const testWorkout = {
      version: "1.0",
      type: "structured_workout",
      metadata: {
        created: new Date().toISOString(),
        sport: "running",
      },
      extensions: {
        structured_workout: {
          name: "Escape Test",
          sport: "running",
          steps: [
            {
              repeatCount: 2,
              steps: [
                {
                  stepIndex: 0,
                  durationType: "time",
                  duration: { type: "time", seconds: 90 },
                  targetType: "pace",
                  target: {
                    type: "pace",
                    value: { unit: "min_per_km", value: 5.0 },
                  },
                  intensity: "active",
                },
              ],
            },
          ],
        },
      },
    };

    await fileInput.setInputFiles({
      name: "escape-test.krd",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(testWorkout)),
    });

    // Wait for workout to load
    await expect(page.getByText("Escape Test")).toBeVisible({
      timeout: 10000,
    });

    // Verify block exists
    await expect(page.getByText("Repeat Block")).toBeVisible();

    // Open context menu and click delete to show modal
    await page.getByTestId("block-actions-trigger").click();
    await page.getByRole("menuitem", { name: /delete/i }).click();

    // Verify modal is visible
    await expect(
      page.getByRole("dialog").or(page.getByTestId("modal-backdrop"))
    ).toBeVisible({ timeout: 5000 });

    // Press Escape key
    await page.keyboard.press("Escape");

    // Verify modal is dismissed
    await expect(
      page.getByRole("dialog").or(page.getByTestId("modal-backdrop"))
    ).not.toBeVisible({ timeout: 5000 });

    // Verify block was NOT deleted (action was cancelled)
    await expect(page.getByText("Repeat Block")).toBeVisible();
  });

  test("should dismiss modal when backdrop is clicked", async ({ page }) => {
    // Requirement 6.5: Allow backdrop click to dismiss modal
    await page.goto("/");

    // Load a workout with a repetition block
    const fileInput = page.getByTestId("file-upload-input");
    const testWorkout = {
      version: "1.0",
      type: "structured_workout",
      metadata: {
        created: new Date().toISOString(),
        sport: "cycling",
      },
      extensions: {
        structured_workout: {
          name: "Backdrop Test",
          sport: "cycling",
          steps: [
            {
              repeatCount: 4,
              steps: [
                {
                  stepIndex: 0,
                  durationType: "time",
                  duration: { type: "time", seconds: 120 },
                  targetType: "power",
                  target: {
                    type: "power",
                    value: { unit: "watts", value: 250 },
                  },
                  intensity: "active",
                },
              ],
            },
          ],
        },
      },
    };

    await fileInput.setInputFiles({
      name: "backdrop-test.krd",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(testWorkout)),
    });

    // Wait for workout to load
    await expect(page.getByText("Backdrop Test")).toBeVisible({
      timeout: 10000,
    });

    // Verify block exists
    await expect(page.getByText("Repeat Block")).toBeVisible();

    // Open context menu and click delete to show modal
    await page.getByTestId("block-actions-trigger").click();
    await page.getByRole("menuitem", { name: /delete/i }).click();

    // Verify modal is visible
    const backdrop = page.getByTestId("modal-backdrop");
    await expect(backdrop).toBeVisible({ timeout: 5000 });

    // Click backdrop
    await backdrop.click({ position: { x: 10, y: 10 } });

    // Verify modal is dismissed
    await expect(backdrop).not.toBeVisible({ timeout: 5000 });

    // Verify block was NOT deleted (action was cancelled)
    await expect(page.getByText("Repeat Block")).toBeVisible();
  });

  test("should trap focus within modal", async ({ page }) => {
    // Requirement 6.3: Trap keyboard focus within modal
    await page.goto("/");

    // Load a workout with a repetition block
    const fileInput = page.getByTestId("file-upload-input");
    const testWorkout = {
      version: "1.0",
      type: "structured_workout",
      metadata: {
        created: new Date().toISOString(),
        sport: "running",
      },
      extensions: {
        structured_workout: {
          name: "Focus Trap Test",
          sport: "running",
          steps: [
            {
              repeatCount: 3,
              steps: [
                {
                  stepIndex: 0,
                  durationType: "time",
                  duration: { type: "time", seconds: 60 },
                  targetType: "pace",
                  target: {
                    type: "pace",
                    value: { unit: "min_per_km", value: 4.5 },
                  },
                  intensity: "active",
                },
              ],
            },
          ],
        },
      },
    };

    await fileInput.setInputFiles({
      name: "focus-trap-test.krd",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(testWorkout)),
    });

    // Wait for workout to load
    await expect(page.getByText("Focus Trap Test")).toBeVisible({
      timeout: 10000,
    });

    // Open context menu and click delete to show modal
    await page.getByTestId("block-actions-trigger").click();
    await page.getByRole("menuitem", { name: /delete/i }).click();

    // Verify modal is visible
    await expect(
      page.getByRole("dialog").or(page.getByTestId("modal-backdrop"))
    ).toBeVisible({ timeout: 5000 });

    // Get all focusable elements in the modal
    const cancelButton = page.getByRole("button", { name: /cancel/i });
    const confirmButton = page.getByRole("button", { name: /delete/i });
    const closeButton = page.getByRole("button", { name: /close/i });

    // Tab through modal elements
    await page.keyboard.press("Tab");
    await expect(cancelButton.or(confirmButton).or(closeButton)).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(cancelButton.or(confirmButton).or(closeButton)).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(cancelButton.or(confirmButton).or(closeButton)).toBeFocused();

    // Tab again should cycle back to first element (focus trap)
    await page.keyboard.press("Tab");
    await expect(cancelButton.or(confirmButton).or(closeButton)).toBeFocused();

    // Verify focus stays within modal (not on background elements)
    const backgroundElement = page.getByTestId("workout-section");
    await expect(backgroundElement).not.toBeFocused();
  });

  test("should prevent background interaction when modal is open", async ({
    page,
  }) => {
    // Requirement 6.6: Prevent interaction with background content
    await page.goto("/");

    // Load a workout with multiple blocks
    const fileInput = page.getByTestId("file-upload-input");
    const testWorkout = {
      version: "1.0",
      type: "structured_workout",
      metadata: {
        created: new Date().toISOString(),
        sport: "cycling",
      },
      extensions: {
        structured_workout: {
          name: "Background Block Test",
          sport: "cycling",
          steps: [
            {
              repeatCount: 2,
              steps: [
                {
                  stepIndex: 0,
                  durationType: "time",
                  duration: { type: "time", seconds: 60 },
                  targetType: "power",
                  target: {
                    type: "power",
                    value: { unit: "watts", value: 200 },
                  },
                  intensity: "active",
                },
              ],
            },
            {
              repeatCount: 3,
              steps: [
                {
                  stepIndex: 1,
                  durationType: "time",
                  duration: { type: "time", seconds: 90 },
                  targetType: "power",
                  target: {
                    type: "power",
                    value: { unit: "watts", value: 250 },
                  },
                  intensity: "active",
                },
              ],
            },
          ],
        },
      },
    };

    await fileInput.setInputFiles({
      name: "background-block-test.krd",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(testWorkout)),
    });

    // Wait for workout to load
    await expect(page.getByText("Background Block Test")).toBeVisible({
      timeout: 10000,
    });

    // Verify both blocks exist
    const blocks = page.locator('[data-testid="repetition-block-card"]');
    await expect(blocks).toHaveCount(2);

    // Open modal for first block
    await blocks.first().getByTestId("block-actions-trigger").click();
    await page.getByRole("menuitem", { name: /delete/i }).click();

    // Verify modal is visible
    await expect(page.getByTestId("modal-backdrop")).toBeVisible({
      timeout: 5000,
    });

    // Try to interact with second block (should be blocked)
    const secondBlock = blocks.nth(1);
    await secondBlock.click({ force: true });

    // Verify modal is still visible (interaction was blocked)
    await expect(page.getByTestId("modal-backdrop")).toBeVisible();

    // Verify second block is not selected/focused
    await expect(secondBlock).not.toHaveAttribute("data-selected", "true");

    // Cancel modal
    await page.getByRole("button", { name: /cancel/i }).click();

    // Verify modal is dismissed
    await expect(page.getByTestId("modal-backdrop")).not.toBeVisible({
      timeout: 5000,
    });

    // Now interaction should work
    await secondBlock.click();
    await page.waitForTimeout(300);

    // Verify second block can now be interacted with
    await expect(secondBlock).toBeVisible();
  });
});

test.describe("Modal Interactions - Mobile Viewport", () => {
  test.use({
    viewport: { width: 375, height: 667 }, // iPhone SE size
  });

  test("should display modal appropriately on mobile viewport", async ({
    page,
  }) => {
    // Requirement 6.9: Adapt to mobile screens
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem("workout-spa-onboarding-completed", "true");
    });

    // Load a workout with a repetition block
    const fileInput = page.getByTestId("file-upload-input");
    const testWorkout = {
      version: "1.0",
      type: "structured_workout",
      metadata: {
        created: new Date().toISOString(),
        sport: "running",
      },
      extensions: {
        structured_workout: {
          name: "Mobile Modal Test",
          sport: "running",
          steps: [
            {
              repeatCount: 2,
              steps: [
                {
                  stepIndex: 0,
                  durationType: "time",
                  duration: { type: "time", seconds: 60 },
                  targetType: "pace",
                  target: {
                    type: "pace",
                    value: { unit: "min_per_km", value: 5.0 },
                  },
                  intensity: "active",
                },
              ],
            },
          ],
        },
      },
    };

    await fileInput.setInputFiles({
      name: "mobile-modal-test.krd",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(testWorkout)),
    });

    // Wait for workout to load
    await expect(page.getByText("Mobile Modal Test")).toBeVisible({
      timeout: 10000,
    });

    // Open context menu and click delete
    await page.getByTestId("block-actions-trigger").click();
    await page.getByRole("menuitem", { name: /delete/i }).click();

    // Verify modal is visible
    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Verify modal fits within viewport
    const modalBox = await modal.boundingBox();
    expect(modalBox).not.toBeNull();
    if (modalBox) {
      expect(modalBox.width).toBeLessThanOrEqual(375); // Fits within mobile width
      expect(modalBox.x).toBeGreaterThanOrEqual(0); // Not cut off on left
      expect(modalBox.x + modalBox.width).toBeLessThanOrEqual(375); // Not cut off on right
    }

    // Verify buttons are accessible on mobile
    const cancelButton = page.getByRole("button", { name: /cancel/i });
    const confirmButton = page.getByRole("button", { name: /delete/i });

    await expect(cancelButton).toBeVisible();
    await expect(confirmButton).toBeVisible();

    // Verify buttons are tappable (minimum 44x44 touch target)
    const cancelBox = await cancelButton.boundingBox();
    const confirmBox = await confirmButton.boundingBox();

    expect(cancelBox).not.toBeNull();
    expect(confirmBox).not.toBeNull();

    if (cancelBox && confirmBox) {
      // WCAG 2.1 AA recommends 44x44px minimum touch targets
      expect(cancelBox.height).toBeGreaterThanOrEqual(44);
      expect(confirmBox.height).toBeGreaterThanOrEqual(44);
    }

    // Test interaction on mobile
    await cancelButton.tap();

    // Verify modal is dismissed
    await expect(modal).not.toBeVisible({ timeout: 5000 });
  });

  test("should handle modal on tablet viewport", async ({ page }) => {
    // Test on tablet size (iPad Mini)
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem("workout-spa-onboarding-completed", "true");
    });

    // Load a workout with a repetition block
    const fileInput = page.getByTestId("file-upload-input");
    const testWorkout = {
      version: "1.0",
      type: "structured_workout",
      metadata: {
        created: new Date().toISOString(),
        sport: "cycling",
      },
      extensions: {
        structured_workout: {
          name: "Tablet Modal Test",
          sport: "cycling",
          steps: [
            {
              repeatCount: 3,
              steps: [
                {
                  stepIndex: 0,
                  durationType: "time",
                  duration: { type: "time", seconds: 120 },
                  targetType: "power",
                  target: {
                    type: "power",
                    value: { unit: "watts", value: 200 },
                  },
                  intensity: "active",
                },
              ],
            },
          ],
        },
      },
    };

    await fileInput.setInputFiles({
      name: "tablet-modal-test.krd",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(testWorkout)),
    });

    // Wait for workout to load
    await expect(page.getByText("Tablet Modal Test")).toBeVisible({
      timeout: 10000,
    });

    // Open context menu and click delete
    await page.getByTestId("block-actions-trigger").click();
    await page.getByRole("menuitem", { name: /delete/i }).click();

    // Verify modal is visible and properly sized for tablet
    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible({ timeout: 5000 });

    const modalBox = await modal.boundingBox();
    expect(modalBox).not.toBeNull();
    if (modalBox) {
      // Modal should be centered and not full width on tablet
      expect(modalBox.width).toBeLessThan(768);
      expect(modalBox.width).toBeGreaterThan(400); // Reasonable modal width
    }

    // Verify modal is centered
    if (modalBox) {
      const centerX = modalBox.x + modalBox.width / 2;
      expect(centerX).toBeCloseTo(768 / 2, 50); // Centered horizontally
    }
  });
});
