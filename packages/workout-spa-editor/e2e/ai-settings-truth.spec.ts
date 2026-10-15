import type { Locator, Page } from "@playwright/test";

import { expect, test } from "./fixtures/base";

/**
 * E2E: the AI settings page shows what actually runs.
 *
 * Every provider host is blocked, so a key cannot be checked and is saved
 * "unverified" — no key here is real and nothing reaches a provider.
 */

const PROVIDER_HOSTS = [
  "**/api.anthropic.com/**",
  "**/api.openai.com/**",
  "**/generativelanguage.googleapis.com/**",
];

type StoredBinding = { purpose: string; providerId: string; modelId: string };

const storedBindings = (page: Page): Promise<StoredBinding[]> =>
  page.evaluate(
    () =>
      new Promise<StoredBinding[]>((resolve, reject) => {
        const open = indexedDB.open("kaiord-spa");
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          const rows = db
            .transaction("aiModelBindings")
            .objectStore("aiModelBindings")
            .getAll();
          rows.onerror = () => reject(rows.error);
          rows.onsuccess = () => {
            db.close();
            resolve(rows.result as StoredBinding[]);
          };
        };
      })
  );

const shown = (select: Locator) =>
  select.evaluate(
    (el) => (el as HTMLSelectElement).selectedOptions[0]?.textContent ?? ""
  );

async function addProvider(
  settings: Locator,
  type: string,
  label: string,
  key: string
) {
  await settings.getByRole("button", { name: "Add account" }).click();
  await settings
    .getByLabel("Provider", { exact: true })
    .selectOption({ value: type });
  await settings.getByLabel("Label (optional)").fill(label);
  await settings.getByPlaceholder("sk-...").fill(key);
  await settings.getByRole("button", { name: "Save account" }).click();
  await expect(settings.getByPlaceholder("sk-...")).toHaveCount(0);
}

test.describe("AI settings truth", () => {
  test("shows the running model, one main model, a masked key and a confirmed removal", async ({
    page,
  }) => {
    for (const host of PROVIDER_HOSTS) {
      await page.route(host, (route) => route.abort());
    }
    await page.goto("/settings/ai");
    const settings = page.getByTestId("settings-page");
    const providers = settings.getByRole("list", {
      name: "AI accounts",
    });
    await addProvider(settings, "anthropic", "Mi Claude", "sk-ant-fake-1111");
    await addProvider(settings, "openai", "Mi GPT", "sk-gpt-fake-2222");
    const main = settings.getByLabel("Main model");
    const chat = settings.getByLabel("Chat", { exact: true });

    // What runs before any choice: the first account and its model.
    await expect.poll(() => shown(main)).toBe("Claude Sonnet 5 · Mi Claude");
    expect(await shown(chat)).toBe(
      "Same as main model (Claude Sonnet 5 · Mi Claude)"
    );
    await expect(providers.getByText("Default")).toHaveCount(0);
    await expect(
      providers.getByRole("button", { name: /set default/i })
    ).toHaveCount(0);

    // One select picks account and model together; nothing stores a blank model.
    await main.selectOption({ label: "GPT-5 mini · Mi GPT" });
    await expect
      .poll(() => shown(chat))
      .toBe("Same as main model (GPT-5 mini · Mi GPT)");
    await settings.getByText(/^Advanced: model per task/).click();
    await chat.selectOption({ label: "o3 · Mi GPT" });
    await expect.poll(() => shown(chat)).toBe("o3 · Mi GPT");
    const bindings = await storedBindings(page);
    expect(bindings.map((b) => [b.purpose, b.modelId]).sort()).toEqual([
      ["chat", "o3"],
      ["default", "gpt-5-mini"],
    ]);

    // The key is never put back into the page: last four only.
    const claudeRow = providers
      .getByRole("listitem")
      .filter({ hasText: "Mi Claude" });
    await expect(claudeRow.getByText("••••1111")).toBeVisible();
    await claudeRow.getByRole("button", { name: "Replace key" }).click();
    // While edited, the row holds only the key field: find it by position.
    const editing = providers.getByRole("listitem").first();
    await expect(editing.getByLabel("New API key")).toHaveValue("");
    expect(await page.content()).not.toContain("sk-ant-fake-1111");
    await editing.getByRole("button", { name: "Cancel" }).click();

    // Removing asks first, then takes the account's bindings with it.
    const gptRow = providers
      .getByRole("listitem")
      .filter({ hasText: "Mi GPT" });
    const removeGpt = async () => {
      await gptRow
        .getByRole("button", { name: "More actions for Mi GPT" })
        .click();
      await page.getByRole("menuitem", { name: "Remove" }).click();
    };
    await removeGpt();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText("Remove Mi GPT?");
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(gptRow).toBeVisible();
    await removeGpt();
    await dialog.getByRole("button", { name: "Remove" }).click();
    await expect(gptRow).toHaveCount(0);
    await expect.poll(() => storedBindings(page)).toEqual([]);
    await expect.poll(() => shown(main)).toBe("Claude Sonnet 5 · Mi Claude");
  });
});
