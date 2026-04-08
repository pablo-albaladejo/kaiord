import { expect, test } from "./fixtures/base";

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
    await page.goto("/");
  });

  test("8.7: add provider, remove provider, set default", async ({ page }) => {
    // Open settings
    await page.getByRole("button", { name: /open settings/i }).click();
    const dialog = page.getByRole("dialog", { name: "Settings" });
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Should start with "No providers configured"
    await expect(dialog.getByText("No providers configured")).toBeVisible();

    // Add first provider (Anthropic)
    await dialog.getByPlaceholder("e.g., My Claude").fill("My Claude");
    await dialog.getByPlaceholder("sk-...").fill("sk-ant-key-1");
    await dialog.getByRole("button", { name: /add provider/i }).click();

    // First provider should be default automatically
    await expect(dialog.getByText("My Claude", { exact: true })).toBeVisible();
    await expect(dialog.getByText("Default")).toBeVisible();

    // Add second provider (OpenAI)
    const providerSelect = dialog.locator("select").first();
    await providerSelect.selectOption({ value: "openai" });
    await dialog.getByPlaceholder("e.g., My Claude").fill("My GPT");
    await dialog.getByPlaceholder("sk-...").fill("sk-openai-key-1");
    await dialog.getByRole("button", { name: /add provider/i }).click();

    // Second provider should be visible but not default
    await expect(dialog.getByText("My GPT")).toBeVisible();

    // Set second as default
    await dialog.getByRole("button", { name: /set default/i }).click();

    // Remove the first provider
    const removeButtons = dialog.getByRole("button", { name: /remove/i });
    await removeButtons.first().click();

    // Should only have GPT remaining
    await expect(dialog.getByText("My GPT")).toBeVisible();
    await expect(
      dialog.getByText("My Claude", { exact: true })
    ).not.toBeVisible();
  });

  test("8.8: Garmin tab shows extension status", async ({ page }) => {
    // Open settings
    await page.getByRole("button", { name: /open settings/i }).click();
    const dialog = page.getByRole("dialog", { name: "Settings" });
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Switch to Garmin tab
    await dialog.getByRole("tab", { name: /garmin/i }).click();

    // Should show extension status (not installed in e2e context)
    await expect(
      dialog.getByRole("heading", { name: /Garmin Bridge Extension/i }),
    ).toBeVisible();
    await expect(
      dialog.getByText(/not detected|installed AND enabled/i)
    ).toBeVisible();

    // Should have a refresh button
    await expect(
      dialog.getByRole("button", { name: /refresh status/i })
    ).toBeVisible();
  });
});
