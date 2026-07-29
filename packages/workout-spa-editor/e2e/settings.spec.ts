import { expect, test } from "./fixtures/base";
import { openHeaderAction } from "./helpers/mobile-menu";

/**
 * E2E: Settings Panel
 *
 * Tests for the Settings panel including AI providers
 * and Garmin extension status.
 */

test.describe("Settings Panel", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
    });
    await page.goto("/workout/new?source=scratch");
  });

  test("8.7: add provider, remove provider, set default", async ({ page }) => {
    // Open the grouped settings index, then enter the AI Provider section.
    await openHeaderAction(page, /open settings/i);
    await page.waitForURL(/\/settings$/);
    await page.getByTestId("settings-row-provider").click();
    await page.waitForURL(/\/settings\/ai/);
    const settingsPage = page.getByTestId("settings-page");
    await expect(settingsPage).toBeVisible({ timeout: 5000 });

    // Should start with "No providers configured"
    await expect(
      settingsPage.getByText("No providers configured")
    ).toBeVisible();

    // Add first provider (Anthropic)
    await settingsPage.getByPlaceholder("e.g., My Claude").fill("My Claude");
    await settingsPage.getByPlaceholder("sk-...").fill("sk-ant-key-1");
    await settingsPage.getByRole("button", { name: /add provider/i }).click();

    // First provider should be default automatically
    await expect(
      settingsPage.getByText("My Claude", { exact: true })
    ).toBeVisible();
    await expect(settingsPage.getByText("Default")).toBeVisible();

    // Add second provider (OpenAI)
    const providerSelect = settingsPage.locator("select").first();
    await providerSelect.selectOption({ value: "openai" });
    await settingsPage.getByPlaceholder("e.g., My Claude").fill("My GPT");
    await settingsPage.getByPlaceholder("sk-...").fill("sk-openai-key-1");
    await settingsPage.getByRole("button", { name: /add provider/i }).click();

    // Second provider should be visible but not default
    await expect(settingsPage.getByText("My GPT")).toBeVisible();

    // Set second as default
    await settingsPage.getByRole("button", { name: /set default/i }).click();

    // Wait for the flip to fully settle. The two-step persistence
    // (Claude flips off, then GPT flips on) is observable from the
    // DOM as: Claude row now exposes its own Set Default button AND
    // GPT no longer does. Gating here guarantees both puts have
    // committed before the following remove fires.
    const claudeRow = settingsPage
      .locator("div.rounded-lg.border")
      .filter({ hasText: "My Claude" });
    await expect(
      claudeRow.getByRole("button", { name: /set default/i })
    ).toBeVisible();

    // Remove Claude through its own row's Remove button — robust to
    // row-order changes because we located by row content.
    await claudeRow.getByRole("button", { name: /^remove$/i }).click();

    // Should only have GPT remaining
    await expect(
      settingsPage.getByText("My Claude", { exact: true })
    ).not.toBeVisible();
    await expect(settingsPage.getByText("My GPT")).toBeVisible();
  });

  test("8.8: Connections is reachable from the settings index", async ({
    page,
  }) => {
    // Arrange
    await openHeaderAction(page, /open settings/i);
    await page.waitForURL(/\/settings$/);

    // Act
    await page.getByTestId("settings-row-connections").click();

    // Assert
    await page.waitForURL(/\/settings\/connections$/);
    await expect(page.getByTestId("settings-panel-connections")).toBeVisible();
  });

  // Entering at the OLD url is the assertion. Navigating to
  // /settings/connections and checking it renders would pass with the
  // redirect deleted.
  test.describe("retired sections", () => {
    for (const retired of ["extensions", "data-hub"]) {
      test(`8.9: /settings/${retired} lands on Connections`, async ({
        page,
      }) => {
        // Arrange

        // Act
        await page.goto(`/settings/${retired}`);

        // Assert
        await expect(page).toHaveURL(/\/settings\/connections$/, {
          timeout: 8000,
        });
        await expect(
          page.getByTestId("settings-panel-connections")
        ).toBeVisible();
      });
    }

    test("8.10: the settings index no longer offers the retired rows", async ({
      page,
    }) => {
      // Arrange
      await openHeaderAction(page, /open settings/i);

      // Act
      await page.waitForURL(/\/settings$/);

      // Assert
      await expect(page.getByTestId("settings-group-list")).toBeVisible();
      await expect(page.getByTestId("settings-row-extensions")).toHaveCount(0);
      await expect(page.getByTestId("settings-row-dataHub")).toHaveCount(0);
    });
  });
});
