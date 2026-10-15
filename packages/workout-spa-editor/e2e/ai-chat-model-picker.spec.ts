import type { Locator, Page } from "@playwright/test";

import { expect, test } from "./fixtures/base";

/**
 * E2E: the chat model picker shows what the conversation runs.
 *
 * Every provider host is blocked, so keys are saved "unverified" and a sent
 * message fails locally — no key here is real and nothing reaches a provider.
 * The chat choice is per conversation: it never writes the athlete's `chat`
 * model binding.
 */

const PROVIDER_HOSTS = [
  "**/api.anthropic.com/**",
  "**/api.openai.com/**",
  "**/generativelanguage.googleapis.com/**",
];

type Row = { purpose?: string; modelId?: string; providerId?: string };

const storedRows = (page: Page, store: string): Promise<Row[]> =>
  page.evaluate(
    (name) =>
      new Promise<Row[]>((resolve, reject) => {
        const open = indexedDB.open("kaiord-spa");
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          const rows = db.transaction(name).objectStore(name).getAll();
          rows.onerror = () => reject(rows.error);
          rows.onsuccess = () => {
            db.close();
            resolve(rows.result as Row[]);
          };
        };
      }),
    store
  );

const shown = (select: Locator) =>
  select.evaluate(
    (el) => (el as HTMLSelectElement).selectedOptions[0]?.textContent ?? ""
  );

async function addProvider(settings: Locator, type: string, label: string) {
  await settings.locator("select").first().selectOption({ value: type });
  await settings.getByPlaceholder("e.g., My Claude").fill(label);
  await settings.getByPlaceholder("sk-...").fill(`sk-${type}-fake-1234`);
  await settings.getByRole("button", { name: /add provider/i }).click();
  await expect(settings.getByPlaceholder("sk-...")).toHaveValue("");
}

test.describe("Chat model picker", () => {
  test("follows the main model until the conversation picks its own", async ({
    page,
  }) => {
    for (const host of PROVIDER_HOSTS) {
      await page.route(host, (route) => route.abort());
    }
    await page.goto("/settings/ai");
    const settings = page.getByTestId("settings-page");
    await addProvider(settings, "anthropic", "Mi Claude");
    await addProvider(settings, "openai", "Mi GPT");
    await settings
      .getByLabel("Main model")
      .selectOption({ label: "gpt-5-mini · Mi GPT" });
    await expect
      .poll(async () => (await storedRows(page, "aiModelBindings")).length)
      .toBe(1);

    await page.goto("/chat");
    const picker = page.getByTestId("chat-model-select");
    await expect
      .poll(() => shown(picker))
      .toBe("Same as main model (gpt-5-mini · Mi GPT)");

    // A draft's choice is provider and model together, and stays off the
    // athlete's settings.
    await picker.selectOption({ label: "o3 · Mi GPT" });
    await expect.poll(() => shown(picker)).toBe("o3 · Mi GPT");
    const bindings = await storedRows(page, "aiModelBindings");
    expect(bindings.map((b) => b.purpose)).toEqual(["default"]);

    // The first message stamps the choice on the conversation.
    await page.getByLabel("Message").fill("How was my week?");
    await page.getByRole("button", { name: "Send" }).click();
    await expect
      .poll(async () => (await storedRows(page, "chatConversations"))[0])
      .toMatchObject({ modelId: "o3" });
    await expect.poll(() => shown(picker)).toBe("o3 · Mi GPT");

    // "Same as main model" clears the conversation's own model.
    await picker.selectOption({ index: 0 });
    await expect
      .poll(() => shown(picker))
      .toBe("Same as main model (gpt-5-mini · Mi GPT)");
    const [conversation] = await storedRows(page, "chatConversations");
    expect(conversation?.modelId).toBeUndefined();
  });
});
