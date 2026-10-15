import type { Locator, Page } from "@playwright/test";

import { expect, test } from "./fixtures/base";

/**
 * E2E: the AI settings page leads with the athlete's assistant, keeps the
 * accounts compact, and hides the per-task models until they matter.
 *
 * Every provider host is blocked, so a key cannot be checked and is saved
 * "not checked" — no key here is real and nothing reaches a provider.
 */

const PROVIDER_HOSTS = [
  "**/api.anthropic.com/**",
  "**/api.openai.com/**",
  "**/generativelanguage.googleapis.com/**",
];

async function blockProviders(page: Page) {
  for (const host of PROVIDER_HOSTS) {
    await page.route(host, (route) => route.abort());
  }
}

async function addAccount(
  settings: Locator,
  type: string,
  key: string,
  label = ""
) {
  await settings.getByRole("button", { name: "Add account" }).click();
  await settings
    .getByLabel("Provider", { exact: true })
    .selectOption({ value: type });
  if (label) await settings.getByLabel("Label (optional)").fill(label);
  await settings.getByPlaceholder("sk-...").fill(key);
  await settings.getByRole("button", { name: "Save account" }).click();
  await expect(settings.getByPlaceholder("sk-...")).toHaveCount(0);
}

// Layout boxes are fractional; half a pixel is rounding, not overflow.
const SUBPIXEL = 0.5;

const accountsOf = (settings: Locator) =>
  settings.getByRole("list", { name: "AI accounts" });

test.describe("AI settings layout", () => {
  test("leads with the assistant, numbers unlabelled accounts and saves instructions on blur", async ({
    page,
  }) => {
    await blockProviders(page);
    await page.goto("/settings/ai");
    const settings = page.getByTestId("settings-page");
    const accounts = accountsOf(settings);

    await addAccount(settings, "anthropic", "sk-ant-fake-1111");
    await addAccount(settings, "anthropic", "sk-ant-fake-2222");
    await expect(accounts.getByTestId("account-label")).toHaveText([
      "Anthropic",
      "Anthropic 2",
    ]);

    // The add form reopens blank: first type, no note from the last add.
    await settings.getByRole("button", { name: "Add account" }).click();
    await expect(settings.getByLabel("Provider", { exact: true })).toHaveValue(
      "anthropic"
    );
    await expect(settings.getByText(/could not be checked/)).toHaveCount(0);
    await settings.getByRole("button", { name: "Cancel" }).click();

    // The assistant card names the athlete, the model, its account and key.
    await expect(
      settings.getByRole("heading", { name: /^Your assistant \(for .+\)$/ })
    ).toBeVisible();
    await expect(settings.getByTestId("assistant-model")).toHaveText(
      "Claude Sonnet 5"
    );
    await expect(
      settings.getByText("on Anthropic", { exact: true })
    ).toBeVisible();
    await expect(settings.getByText("No AI use yet this month.")).toBeVisible();

    // Per-task models stay folded until a task has its own.
    const advanced = settings.getByTestId("advanced-models");
    await expect(advanced).not.toHaveAttribute("open", "");
    await advanced.getByText(/^Advanced: model per task \(for .+\)$/).click();
    const lab = advanced.getByLabel("Lab extraction");
    await lab.selectOption({ label: "Claude Opus 5 · Anthropic 2" });
    // The select shows the stored choice once the write has landed.
    await expect(lab.locator("option:checked")).toHaveText(
      "Claude Opus 5 · Anthropic 2"
    );
    await page.reload();
    await expect(settings.getByTestId("advanced-models")).toHaveAttribute(
      "open",
      ""
    );

    // Instructions are written once the field is left, and say so.
    const prompt = settings.getByLabel(/additional instructions/i);
    await prompt.fill("Recovering from a knee injury");
    await settings.getByRole("heading", { name: "AI accounts" }).click();
    await expect(settings.getByText("Saved ✓")).toBeVisible();
    await page.reload();
    await expect(settings.getByLabel(/additional instructions/i)).toHaveValue(
      "Recovering from a knee injury"
    );

    // Renaming lives in the row's overflow menu.
    await accounts
      .getByRole("button", { name: "More actions for Anthropic 2" })
      .click();
    await page.getByRole("menuitem", { name: "Rename" }).click();
    await accounts.getByLabel("Label").fill("Work");
    await accounts.getByRole("button", { name: "Save" }).click();
    await expect(accounts.getByText("Work", { exact: true })).toBeVisible();

    // The settings index names the main model.
    await page.goto("/settings");
    await expect(page.getByTestId("settings-row-ai")).toContainText(
      "Claude Sonnet 5"
    );
  });

  test("keeps every account row inside a phone-width screen", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await blockProviders(page);
    await page.goto("/settings/ai");
    const settings = page.getByTestId("settings-page");
    await addAccount(settings, "anthropic", "sk-ant-fake-1111", "Mi Claude");
    await addAccount(settings, "openai", "sk-gpt-fake-2222", "Mi GPT");

    const rows = accountsOf(settings).getByRole("listitem");
    await expect(rows).toHaveCount(2);
    for (const row of await rows.all()) {
      const box = (await row.boundingBox())!;
      for (const part of await row.locator("span, button").all()) {
        const partBox = (await part.boundingBox())!;
        expect(partBox.x).toBeGreaterThanOrEqual(box.x);
        expect(partBox.x + partBox.width).toBeLessThanOrEqual(
          box.x + box.width + SUBPIXEL
        );
      }
    }
  });
});
