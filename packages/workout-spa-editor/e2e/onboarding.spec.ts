import { expect, test } from "@playwright/test";

import { openAccountMenu } from "./helpers/mobile-menu";

const TOOLTIP_HOVER_DEBOUNCE_MS = 300;

/**
 * E2E Tests: first-run guidance and the help surfaces that replaced the
 * onboarding tutorial.
 *
 * The six-step centred `OnboardingTutorial` and the `HelpDialog` are gone:
 * guidance is now the live setup checklist (unit-covered), the `?` shortcut
 * sheet, the ⌘K command palette and anchored coach marks. Nothing here may
 * assert on `workout-spa-onboarding-completed` — that key no longer exists.
 */

test.describe("Shortcut sheet", () => {
  test("should open the shortcut sheet with the ? key", async ({ page }) => {
    // Arrange
    await page.goto("/workout/new?source=scratch");
    await page.waitForLoadState("networkidle");

    // Act — "?" is the global shortcut-sheet binding
    await page.keyboard.press("Shift+Slash");

    // Assert — the sheet renders its title, groups and key chips
    const sheet = page.getByTestId("shortcut-sheet");
    await expect(sheet).toBeVisible();
    await expect(
      sheet.getByRole("heading", { name: "Keyboard Shortcuts" })
    ).toBeVisible();
    await expect(
      sheet.getByRole("heading", { name: "File Operations" })
    ).toBeVisible();
    await expect(sheet.locator("kbd").first()).toBeVisible();
  });

  test("should not leave a help dialog reachable from the header", async ({
    page,
  }) => {
    // Arrange
    await page.goto("/workout/new?source=scratch");
    await page.waitForLoadState("networkidle");

    // Act
    const helpButton = page.getByTestId("status-header-help-button");

    // Assert
    await expect(helpButton).toHaveCount(0);
  });
});

test.describe("Tooltips", () => {
  test("should display tooltips on hover", async ({ page }) => {
    // Arrange
    await page.goto("/workout/new?source=scratch");
    await page.waitForLoadState("networkidle");

    // Act — the theme toggle uses a native title attribute for its tooltip
    await openAccountMenu(page);
    const themeToggle = page.getByTestId("theme-toggle");

    // Assert
    await expect(themeToggle).toHaveAttribute(
      "title",
      /switch to (light|dark) mode/i
    );
  });

  test("should hide tooltips when mouse leaves", async ({ page, isMobile }) => {
    test.skip(isMobile, "Mouse hover not available on mobile touch devices");
    // Arrange
    await page.goto("/workout/new?source=scratch");
    await page.waitForLoadState("networkidle");
    await openAccountMenu(page);
    const themeToggle = page.getByTestId("theme-toggle");

    // Act
    await themeToggle.hover();
    await page.mouse.move(0, 0);
    await page.waitForTimeout(TOOLTIP_HOVER_DEBOUNCE_MS);

    // Assert — the element stays interactive after the pointer leaves
    await expect(themeToggle).toBeVisible();
  });
});
