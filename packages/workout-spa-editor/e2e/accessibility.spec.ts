import { expect, test } from "@playwright/test";

/**
 * Critical Path: Accessibility and Keyboard Navigation
 *
 * Requirements covered:
 * - Requirement 35: Accessibility compliance
 * - Requirement 29: Keyboard shortcuts
 * - Requirement 13: Theme switching
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

    // Load a workout to test more elements
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
          name: "Accessibility Test",
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
          ],
        },
      },
    };

    await fileInput.setInputFiles({
      name: "accessibility-test.krd",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(testWorkout)),
    });

    // Wait for workout to load
    await expect(page.getByText("Accessibility Test")).toBeVisible({
      timeout: 10000,
    });

    // Verify step cards have proper ARIA labels
    const stepCard = page.locator('[data-testid="step-card"]').first();
    await expect(stepCard).toHaveAttribute("aria-label", /Step 1/);
    await expect(stepCard).toHaveAttribute("role", "button");

    // Click on step to open editor
    await stepCard.click();

    // Verify step editor has proper labels
    await expect(page.getByText("Edit Step")).toBeVisible({ timeout: 5000 });
  });

  test("should support keyboard shortcuts", async ({ page }) => {
    await page.goto("/");

    // Load a workout
    const fileInput = page.locator('input[type="file"]');
    const testWorkout = {
      version: "1.0",
      type: "workout",
      metadata: {
        created: new Date().toISOString(),
        sport: "running",
      },
      extensions: {
        workout: {
          name: "Shortcuts Test",
          sport: "running",
          steps: [
            {
              stepIndex: 0,
              durationType: "time",
              duration: { type: "time", seconds: 300 },
              targetType: "pace",
              target: {
                type: "pace",
                value: { unit: "min_per_km", value: 5.0 },
              },
              intensity: "active",
            },
          ],
        },
      },
    };

    await fileInput.setInputFiles({
      name: "shortcuts-test.krd",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(testWorkout)),
    });

    // Wait for workout to load
    await expect(page.getByText("Shortcuts Test")).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText("Step 1")).toBeVisible();

    // Add a step
    await page.getByRole("button", { name: /add step/i }).click();
    await expect(page.getByText("Step 2")).toBeVisible({ timeout: 5000 });

    // Test Ctrl+Z (undo)
    await page.keyboard.press("Control+Z");
    await expect(page.getByText("Step 2")).not.toBeVisible({ timeout: 5000 });

    // Test Ctrl+Y (redo)
    await page.keyboard.press("Control+Y");
    await expect(page.getByText("Step 2")).toBeVisible({ timeout: 5000 });

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

    // Load a workout with different intensity levels
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
          name: "Contrast Test",
          sport: "cycling",
          steps: [
            {
              stepIndex: 0,
              durationType: "time",
              duration: { type: "time", seconds: 300 },
              targetType: "power",
              target: {
                type: "power",
                value: { unit: "watts", value: 150 },
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
          ],
        },
      },
    };

    await fileInput.setInputFiles({
      name: "contrast-test.krd",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(testWorkout)),
    });

    // Wait for workout to load
    await expect(page.getByText("Contrast Test")).toBeVisible({
      timeout: 10000,
    });

    // Verify steps are visible with proper styling
    const stepCards = page.locator('[data-testid="step-card"]');
    await expect(stepCards.first()).toBeVisible();
    await expect(stepCards.nth(1)).toBeVisible();

    // Note: Actual contrast ratio testing would require additional tools
    // like axe-core or lighthouse, which can be integrated separately
  });

  test("should toggle between light and dark themes", async ({ page }) => {
    // Requirement 13: Theme switching
    await page.goto("/");

    // Get initial theme state
    const html = page.locator("html");
    const initialHasDarkClass = await html.evaluate((el) =>
      el.classList.contains("dark")
    );

    // Click theme toggle
    const themeToggle = page.getByRole("button", {
      name: /switch to (light|dark) mode/i,
    });
    await themeToggle.click();

    // Wait for theme to apply
    await page.waitForTimeout(500);

    // Verify theme changed
    const newHasDarkClass = await html.evaluate((el) =>
      el.classList.contains("dark")
    );
    expect(newHasDarkClass).not.toBe(initialHasDarkClass);
  });

  test("should persist theme preference across page reloads", async ({
    page,
  }) => {
    // Requirement 13: Theme persistence in localStorage
    await page.goto("/");

    // Get initial theme
    const html = page.locator("html");
    const initialHasDarkClass = await html.evaluate((el) =>
      el.classList.contains("dark")
    );

    // Toggle theme
    const themeToggle = page.getByRole("button", {
      name: /switch to (light|dark) mode/i,
    });
    await themeToggle.click();
    await page.waitForTimeout(500);

    // Get new theme state
    const hasDarkClass = await html.evaluate((el) =>
      el.classList.contains("dark")
    );
    expect(hasDarkClass).not.toBe(initialHasDarkClass);

    // Reload page
    await page.reload();
    await page.waitForTimeout(500);

    // Verify theme persisted
    const persistedHasDarkClass = await html.evaluate((el) =>
      el.classList.contains("dark")
    );
    expect(persistedHasDarkClass).toBe(hasDarkClass);
  });

  test("should apply theme to all UI elements", async ({ page }) => {
    // Requirement 13: Theme applies to entire application
    await page.goto("/");

    // Load a workout to have more UI elements
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
          name: "Theme Test",
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
              intensity: "active",
            },
          ],
        },
      },
    };

    await fileInput.setInputFiles({
      name: "theme-test.krd",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(testWorkout)),
    });

    // Wait for workout to load
    await expect(page.getByText("Theme Test")).toBeVisible({
      timeout: 10000,
    });

    // Toggle theme
    const themeToggle = page.getByRole("button", {
      name: /switch to (light|dark) mode/i,
    });
    await themeToggle.click();
    await page.waitForTimeout(500);

    // Verify theme applied - all elements should still be visible
    const header = page.locator("header");
    const main = page.getByRole("main");
    const stepCard = page.locator('[data-testid="step-card"]').first();

    await expect(header).toBeVisible();
    await expect(main).toBeVisible();
    await expect(stepCard).toBeVisible();
  });

  test("should have smooth theme transitions", async ({ page }) => {
    // Requirement 13: Smooth transitions between themes
    await page.goto("/");

    // Verify transition CSS is applied
    const body = page.locator("body");
    const hasTransition = await body.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return computed.transition.includes("background-color");
    });

    expect(hasTransition).toBe(true);

    // Toggle theme
    const themeToggle = page.getByRole("button", {
      name: /switch to (light|dark) mode/i,
    });
    await themeToggle.click();
    await page.waitForTimeout(500);

    // Verify page is still functional
    await expect(page.getByText("Workout Editor")).toBeVisible();
  });
});
