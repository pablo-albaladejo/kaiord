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

async function setMainModel(page: Page, label: string, modelId: string) {
  await page.goto("/settings/ai");
  await page
    .getByTestId("settings-page")
    .getByLabel("Main model")
    .selectOption({ label });
  await expect
    .poll(async () => (await storedRows(page, "aiModelBindings"))[0]?.modelId)
    .toBe(modelId);
}

async function setUpTwoAccounts(page: Page) {
  for (const host of PROVIDER_HOSTS) {
    await page.route(host, (route) => route.abort());
  }
  await page.goto("/settings/ai");
  const settings = page.getByTestId("settings-page");
  await addProvider(settings, "anthropic", "Mi Claude");
  await addProvider(settings, "openai", "Mi GPT");
  await setMainModel(page, "gpt-5-mini · Mi GPT", "gpt-5-mini");
}

test.describe("Chat model picker", () => {
  test("a conversation that follows the main model keeps following it", async ({
    page,
  }) => {
    await setUpTwoAccounts(page);
    await page.goto("/chat");
    const picker = page.getByTestId("chat-model-select");
    await expect
      .poll(() => shown(picker))
      .toBe("Same as main model (gpt-5-mini · Mi GPT)");

    // Sending from a following draft pins nothing on the conversation.
    await page.getByLabel("Message").fill("Plan my week");
    await page.getByRole("button", { name: "Send" }).click();
    await expect
      .poll(async () => (await storedRows(page, "chatConversations")).length)
      .toBe(1);
    const [row] = await storedRows(page, "chatConversations");
    expect(row?.modelId).toBeUndefined();
    expect(row?.providerId).toBeUndefined();
    await expect(page).toHaveURL(/\/chat\/.+/);
    const conversationUrl = page.url();
    await expect
      .poll(() => shown(picker))
      .toBe("Same as main model (gpt-5-mini · Mi GPT)");

    // A new main model in settings is what that conversation now runs.
    await setMainModel(page, "claude-sonnet-5 · Mi Claude", "claude-sonnet-5");
    await page.goto(conversationUrl);
    await expect
      .poll(() => shown(page.getByTestId("chat-model-select")))
      .toBe("Same as main model (claude-sonnet-5 · Mi Claude)");
  });

  test("follows the main model until the conversation picks its own", async ({
    page,
  }) => {
    await setUpTwoAccounts(page);

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

    // A new conversation does not inherit the previous draft's choice.
    await page.getByRole("button", { name: "+ New conversation" }).click();
    await expect
      .poll(() => shown(picker))
      .toBe("Same as main model (gpt-5-mini · Mi GPT)");
    await page.getByText("How was my week?").first().click();
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
