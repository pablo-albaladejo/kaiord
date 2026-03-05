import { expect, test } from "./fixtures/base";

/**
 * E2E: Settings Panel
 *
 * Tests for the Settings panel including AI providers,
 * Garmin credentials, and Lambda URL configuration.
 */

test.describe("Settings Panel", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("8.7: add provider, remove provider, set default", async ({ page }) => {
    // Open settings
    await page.getByRole("button", { name: /open settings/i }).click();
    await expect(page.getByText("Settings")).toBeVisible({ timeout: 5000 });

    // Should start with "No providers configured"
    await expect(page.getByText("No providers configured")).toBeVisible();

    // Add first provider (Anthropic)
    await page.getByPlaceholder("e.g., My Claude").fill("My Claude");
    await page.getByPlaceholder("sk-...").fill("sk-ant-key-1");
    await page.getByRole("button", { name: /add provider/i }).click();

    // First provider should be default automatically
    await expect(page.getByText("My Claude")).toBeVisible();
    await expect(page.getByText("Default")).toBeVisible();

    // Add second provider (OpenAI)
    const providerSelect = page.locator("select").first();
    await providerSelect.selectOption("openai");
    await page.getByPlaceholder("e.g., My Claude").fill("My GPT");
    await page.getByPlaceholder("sk-...").fill("sk-openai-key-1");
    await page.getByRole("button", { name: /add provider/i }).click();

    // Second provider should be visible but not default
    await expect(page.getByText("My GPT")).toBeVisible();

    // Set second as default
    await page.getByRole("button", { name: /set default/i }).click();

    // Remove the first provider
    const removeButtons = page.getByRole("button", { name: /remove/i });
    await removeButtons.first().click();

    // Should only have GPT remaining
    await expect(page.getByText("My GPT")).toBeVisible();
    await expect(page.getByText("My Claude")).not.toBeVisible();
  });

  test("8.8: configure Garmin credentials and Lambda URL", async ({ page }) => {
    // Open settings
    await page.getByRole("button", { name: /open settings/i }).click();

    // Switch to Garmin tab
    await page
      .getByRole("button", { name: /garmin/i })
      .first()
      .click();

    // Fill email and password
    const emailInput = page.getByPlaceholder("your@email.com");
    await emailInput.fill("user@garmin.com");

    const passwordInput = page.getByPlaceholder("Your Garmin password");
    await passwordInput.fill("my-password");

    // Change Lambda URL
    const lambdaInput = page.getByPlaceholder("https://api.kaiord.com/push");
    await lambdaInput.clear();
    await lambdaInput.fill("https://my-lambda.amazonaws.com/push");

    // Verify values are set
    await expect(emailInput).toHaveValue("user@garmin.com");
    await expect(passwordInput).toHaveValue("my-password");
    await expect(lambdaInput).toHaveValue(
      "https://my-lambda.amazonaws.com/push"
    );

    // Reset Lambda URL
    await page.getByRole("button", { name: /reset to default/i }).click();

    // Lambda URL should be reset
    await expect(lambdaInput).toHaveValue("https://api.kaiord.com/push");
  });
});
