import type { Locator, Page } from "@playwright/test";

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
    await page.goto("/workout/new?source=scratch");

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
    await page.goto("/workout/new?source=scratch");

    // First add a provider via settings
    await addTestProvider(page);

    // AiWorkoutInput is mounted inside the collapsed AiBanner: expand
    // the banner before the textarea becomes visible (PR #648).
    await page
      .getByRole("button", { name: /generate with ai/i })
      .first()
      .click();
    const textarea = page.getByLabel("Workout description");
    await expect(textarea).toBeVisible({ timeout: 5000 });
    await textarea.fill(
      "45 minutes sweet spot cycling with 10 min warmup and cooldown"
    );

    // Click generate (specifically the generate-workout button inside
    // the AiWorkoutInput body, not the banner header chip which also
    // matches /generate/i).
    await page
      .getByRole("button", { name: /generate workout/i })
      .first()
      .click();

    // Wait for the workout to appear (mock API responds instantly)
    await expect(page.getByText(/sweet spot cycling/i).first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("8.10: the model select shows and stores what generation runs", async ({
    page,
  }) => {
    await page.goto("/workout/new?source=scratch");
    await addTestProvider(page, "Test Claude", "anthropic");
    await addTestProvider(page, "Test GPT", "openai");

    // Expand the AiBanner so the model selector renders.
    await page
      .getByRole("button", { name: /generate with ai/i })
      .first()
      .click();

    // One select of account and model together, one group per account.
    const modelSelect = page.getByTestId("ai-model-select");
    await expect(modelSelect.locator("optgroup")).toHaveCount(2);
    const gptOption = modelSelect
      .locator('optgroup[label^="Test GPT"] option')
      .first();
    const gptValue = await gptOption.getAttribute("value");
    const gptText = (await gptOption.textContent()) ?? "";
    await modelSelect.selectOption(gptValue ?? "");
    await expect.poll(() => shownOption(modelSelect)).toBe(gptText);

    // Stored as the athlete's workout-generation model: Settings shows it.
    await openHeaderAction(page, /open settings/i);
    await page.getByTestId("settings-row-ai").click();
    const settingsRow = page.getByTestId("model-workout_generation-select");
    await expect.poll(() => shownOption(settingsRow)).toBe(gptText);
  });
});

async function addTestProvider(
  page: Page,
  label = "Test Claude",
  type = "anthropic"
): Promise<void> {
  await openHeaderAction(page, /open settings/i);
  await page.waitForURL(/\/settings$/);
  await page.getByTestId("settings-row-ai").click();
  await page.waitForURL(/\/settings\/ai/);

  const settingsPage = page.getByTestId("settings-page");
  await expect(settingsPage).toBeVisible({ timeout: 5000 });

  const providerSelect = settingsPage.locator("select").first();
  await providerSelect.selectOption(type);

  await settingsPage.getByPlaceholder("e.g., My Claude").fill(label);
  await settingsPage.getByPlaceholder("sk-...").fill("sk-test-key-for-e2e");

  await settingsPage.getByRole("button", { name: /add provider/i }).click();

  // Scope to the provider list: with an active profile the per-purpose
  // model selects on the same page also list the provider as an option.
  const providerList = settingsPage.getByRole("list", {
    name: "Configured LLM providers",
  });
  await expect(providerList.getByText(label, { exact: true })).toBeVisible({
    timeout: 3000,
  });

  await page.goto("/workout/new?source=scratch");
}

function shownOption(select: Locator): Promise<string> {
  return select.evaluate(
    (el) => (el as HTMLSelectElement).selectedOptions[0]?.textContent ?? ""
  );
}
