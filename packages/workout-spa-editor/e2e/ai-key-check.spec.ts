import { mockLlmFailure } from "./fixtures/api-mocks";
import { expect, test } from "./fixtures/base";
import { seedAiProvider } from "./helpers/seed-ai-provider";
import { clearDexie } from "./helpers/seed-dexie";
import { waitForDexieReady } from "./helpers/wait-for-dexie-ready";

/**
 * E2E: a provider key the provider rejects.
 *
 * Every provider call is answered locally with a 401, the response a real
 * provider gives a wrong key. Nothing here reaches a real endpoint.
 */

const UNAUTHORIZED = {
  status: 401,
  body: JSON.stringify({
    type: "error",
    error: { type: "authentication_error", message: "invalid x-api-key" },
  }),
};

test.describe("AI provider key check", () => {
  test("rejects a key the provider refuses and does not save it", async ({
    page,
  }) => {
    await mockLlmFailure(page, UNAUTHORIZED);
    await page.goto("/settings/ai");
    const settingsPage = page.getByTestId("settings-page");
    await expect(settingsPage).toBeVisible();

    await settingsPage.getByPlaceholder("e.g., My Claude").fill("Wrong key");
    await settingsPage.getByPlaceholder("sk-...").fill("sk-ant-wrong");
    await settingsPage.getByRole("button", { name: /add provider/i }).click();

    await expect(settingsPage.getByRole("alert")).toContainText(
      "The provider rejected this key"
    );
    await expect(
      settingsPage.getByText("No providers configured")
    ).toBeVisible();
    await expect(settingsPage.getByPlaceholder("sk-...")).toHaveValue(
      "sk-ant-wrong"
    );
  });

  test("chat surfaces a rejected key without an uncaught page error", async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await page.goto("/calendar");
    await waitForDexieReady(page);
    await clearDexie(page);
    await seedAiProvider(page);
    await mockLlmFailure(page, UNAUTHORIZED);

    await page.goto("/chat");
    await page.getByLabel("Message").fill("How was my week?");
    await page.getByRole("button", { name: "Send" }).click();

    await expect(
      page.getByText("Authentication failed — check your API key in settings.")
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();
    // An unhandled rejection is reported after the microtask checkpoint;
    // one macrotask round-trip guarantees it would have fired by now.
    await page.evaluate(() => new Promise((r) => setTimeout(r, 0)));
    expect(pageErrors).toEqual([]);
  });
});
