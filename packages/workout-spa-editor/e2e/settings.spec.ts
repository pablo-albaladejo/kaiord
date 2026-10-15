import { mockLlmSuccess } from "./fixtures/api-mocks";
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
    // Adding a provider checks its key against the provider; answer locally.
    await mockLlmSuccess(page);
    await page.goto("/workout/new?source=scratch");
  });

  test("8.7: add provider, remove provider", async ({ page }) => {
    // Open the grouped settings index, then enter the AI Provider section.
    await openHeaderAction(page, /open settings/i);
    await page.waitForURL(/\/settings$/);
    await page.getByTestId("settings-row-ai").click();
    await page.waitForURL(/\/settings\/ai/);
    const settingsPage = page.getByTestId("settings-page");
    await expect(settingsPage).toBeVisible({ timeout: 5000 });
    // Provider names also appear in the options of the active profile's
    // per-purpose model selects, so every row assertion targets the list.
    const providers = settingsPage.getByRole("list", {
      name: "Configured LLM providers",
    });

    // Should start with "No providers configured"
    await expect(
      settingsPage.getByText("No providers configured")
    ).toBeVisible();

    // Add first provider (Anthropic)
    await settingsPage.getByPlaceholder("e.g., My Claude").fill("My Claude");
    await settingsPage.getByPlaceholder("sk-...").fill("sk-ant-key-1");
    await settingsPage.getByRole("button", { name: /add provider/i }).click();
    await expect(
      providers.getByText("My Claude", { exact: true })
    ).toBeVisible();

    // Add second provider (OpenAI)
    const providerSelect = settingsPage.locator("select").first();
    await providerSelect.selectOption({ value: "openai" });
    await settingsPage.getByPlaceholder("e.g., My Claude").fill("My GPT");
    await settingsPage.getByPlaceholder("sk-...").fill("sk-openai-key-1");
    await settingsPage.getByRole("button", { name: /add provider/i }).click();
    await expect(providers.getByText("My GPT")).toBeVisible();

    // Remove Claude through its own row, confirming in the dialog.
    const claudeRow = providers
      .getByRole("listitem")
      .filter({ hasText: "My Claude" });
    await claudeRow.getByRole("button", { name: /^remove$/i }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: /^remove$/i })
      .click();

    // Should only have GPT remaining
    await expect(
      providers.getByText("My Claude", { exact: true })
    ).not.toBeVisible();
    await expect(providers.getByText("My GPT")).toBeVisible();
  });

  // Connections left Settings for its own page (P-07): the account menu
  // reaches it, and the settings index no longer lists it.
  test("8.8: Connections is its own page, reached from the account menu", async ({
    page,
  }) => {
    // Arrange

    // Act
    await openHeaderAction(page, /open connections/i);

    // Assert
    await page.waitForURL(/#\/connections$/);
    await expect(page.getByTestId("connections-page")).toBeVisible();
    await expect(page.getByTestId("connections-scope")).toBeVisible();
  });

  // Entering at the OLD url is the assertion. Navigating to /connections and
  // checking it renders would pass with the redirect deleted.
  test.describe("retired sections", () => {
    for (const retired of ["connections", "extensions", "data-hub"]) {
      test(`8.9: /settings/${retired} lands on Connections`, async ({
        page,
      }) => {
        // Arrange

        // Act
        await page.goto(`/settings/${retired}`);

        // Assert
        await expect(page).toHaveURL(/#\/connections$/, { timeout: 8000 });
        await expect(page.getByTestId("connections-page")).toBeVisible();
      });
    }

    const moved = [
      { from: "preferences", to: /\/settings\/general$/, panel: "general" },
      { from: "usage", to: /\/settings\/ai\?section=usage$/, panel: "ai" },
      {
        from: "privacy?section=data-management",
        to: /\/settings\/data$/,
        panel: "data",
      },
    ];
    for (const { from, to, panel } of moved) {
      test(`8.11: /settings/${from} lands on its new page`, async ({
        page,
      }) => {
        // Arrange

        // Act
        await page.goto(`/settings/${from}`);

        // Assert
        await expect(page).toHaveURL(to, { timeout: 8000 });
        await expect(page.getByTestId(`settings-panel-${panel}`)).toBeVisible();
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
      await expect(page.getByTestId("settings-row-connections")).toHaveCount(0);
    });
  });
});
