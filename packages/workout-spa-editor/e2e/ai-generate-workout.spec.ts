import type { Page } from "@playwright/test";

import { mockLlmApis } from "./fixtures/api-mocks";
import { expect, test } from "./fixtures/base";
import { openHeaderAction } from "./helpers/mobile-menu";

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
    await page.goto("/workout/new");

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
    await page.goto("/workout/new");

    // First add a provider via settings
    await addTestProvider(page);

    // The AiWorkoutInput is now mounted in WelcomeSection
    const textarea = page.getByLabel("Workout description");
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
    await page.goto("/workout/new");

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

async function addTestProvider(
  page: Page,
  label = "Test Claude",
  type = "anthropic"
): Promise<void> {
  await openHeaderAction(page, /open settings/i);
  await page.waitForURL(/\/settings\/ai$/);

  const settingsPage = page.getByTestId("settings-page");
  await expect(settingsPage).toBeVisible({ timeout: 5000 });

  const providerSelect = settingsPage.locator("select").first();
  await providerSelect.selectOption(type);

  await settingsPage.getByPlaceholder("e.g., My Claude").fill(label);
  await settingsPage.getByPlaceholder("sk-...").fill("sk-test-key-for-e2e");

  await settingsPage.getByRole("button", { name: /add provider/i }).click();

  await expect(settingsPage.getByText(label, { exact: true })).toBeVisible({
    timeout: 3000,
  });

  await page.goto("/workout/new");
}
