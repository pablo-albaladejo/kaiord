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
      localStorage.setItem("workout-spa-onboarding-completed", "true");
    });
    await page.goto("/workout/new?source=scratch");
  });

  test("8.7: add provider, remove provider, set default", async ({ page }) => {
    // Open the grouped settings index, then enter the AI Provider section.
    await openHeaderAction(page, /open settings/i);
    await page.waitForURL(/\/settings$/);
    await page.getByTestId("settings-row-Provider").click();
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

  test("8.8: Extensions tab shows bridge status", async ({ page }) => {
    // Post-redesign, Settings is a grouped list; the Extensions view is
    // its own route. Navigate to it via the grouped-list row.
    await openHeaderAction(page, /open settings/i);
    await page.waitForURL(/\/settings$/);
    await page.getByTestId("settings-row-Extensions").click();
    await page.waitForURL(/\/settings\/extensions$/);

    const extensionsPanel = page.getByTestId("settings-panel-extensions");
    await expect(extensionsPanel).toBeVisible();

    // Should show both bridges in the status table
    await expect(
      extensionsPanel.getByText("Garmin Connect", { exact: true })
    ).toBeVisible();
    await expect(
      extensionsPanel.getByText("Train2Go", { exact: true })
    ).toBeVisible();

    // Should have a refresh button
    await expect(
      extensionsPanel.getByRole("button", { name: /refresh status/i })
    ).toBeVisible();
  });
});
