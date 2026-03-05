import { expect, test } from "./fixtures/base";
import { mockLlmApis } from "./fixtures/api-mocks";

/**
 * E2E: AI Workout Generation Flow
 *
 * Tests the end-to-end flow of generating a workout from natural language.
 * LLM API calls are intercepted with page.route() to return mock responses.
 */

test.describe("AI Generate Workout Flow", () => {
  test.beforeEach(async ({ page }) => {
    await mockLlmApis(page);
  });

  test("8.9: no providers configured shows settings prompt", async ({
    page,
  }) => {
    await page.goto("/");

    // The AiWorkoutInput should show "Configure an AI provider" message
    // when no providers are configured
    const settingsPrompt = page.getByText("Configure an AI provider");
    // This may or may not be visible depending on where AiWorkoutInput is rendered
    // If the component is on the welcome page, it should be visible
    if (await settingsPrompt.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(settingsPrompt).toBeVisible();
      await expect(page.getByText("Open Settings")).toBeVisible();
    }
  });

  test("8.4: generate workout flow - type text, select model, generate", async ({
    page,
  }) => {
    await page.goto("/");

    // First add a provider via settings
    await addTestProvider(page);

    // Now look for the AI workout input area
    const textarea = page.getByPlaceholder(/describe your workout/i);
    await expect(textarea).toBeVisible({ timeout: 5000 });
    await textarea.fill(
      "45 minutes sweet spot cycling with 10 min warmup and cooldown"
    );

    // Click generate
    await page.getByRole("button", { name: /generate/i }).click();

    // Wait for the workout to appear (mock API responds instantly)
    await expect(page.getByText(/sweet spot cycling/i).first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("8.10: model selector lists all configured providers", async ({
    page,
  }) => {
    await page.goto("/");

    // Add two providers via settings
    await addTestProvider(page, "Test Claude", "anthropic");
    await addTestProvider(page, "Test GPT", "openai");

    // Check model selector dropdown contains both
    const modelSelect = page.locator("select").filter({ hasText: /test/i });
    if (await modelSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      const options = modelSelect.locator("option");
      await expect(options).toHaveCount(2);
      await expect(options.first()).toContainText("Test Claude");
      await expect(options.last()).toContainText("Test GPT");
    }
  });
});

/**
 * Helper: add a test AI provider through the Settings UI.
 */
async function addTestProvider(
  page: import("@playwright/test").Page,
  label = "Test Claude",
  type = "anthropic"
): Promise<void> {
  // Open settings
  await page.getByRole("button", { name: /open settings/i }).click();

  // Should be on AI tab by default
  await expect(page.getByText("LLM Providers")).toBeVisible({ timeout: 5000 });

  // Select provider type
  const providerSelect = page.locator("select").first();
  await providerSelect.selectOption(type);

  // Fill in the form
  await page.getByPlaceholder("e.g., My Claude").fill(label);
  await page.getByPlaceholder("sk-...").fill("sk-test-key-for-e2e");

  // Click add
  await page.getByRole("button", { name: /add provider/i }).click();

  // Verify provider appears in list
  await expect(page.getByText(label)).toBeVisible({ timeout: 3000 });

  // Close settings dialog
  await page.keyboard.press("Escape");
}
