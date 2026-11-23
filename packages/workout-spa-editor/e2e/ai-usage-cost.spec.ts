import type { Page, Route } from "@playwright/test";

import { expect, test } from "./fixtures/base";
import { LLM_CYCLING_RESPONSE } from "./fixtures/llm-responses";
import { fulfillLlm } from "./fixtures/llm-sse";
import { openHeaderAction } from "./helpers/mobile-menu";

/**
 * E2E: the cost the athlete sees is priced at the model's own prices and
 * counts every attempt the Provider billed. The Provider is stubbed: every
 * request reports 100 input and 200 output tokens, so one attempt on Claude
 * Sonnet 5 ($2 input, $10 output per million) costs $0.0022.
 */

const LLM_ROUTES = [
  "**/api.anthropic.com/**",
  "**/api.openai.com/**",
  "**/generativelanguage.googleapis.com/**",
];

// A reply with the right shape but no steps: it fails validation, the
// runtime retries, and the Provider billed it all the same.
const INVALID_RESPONSE = {
  ...LLM_CYCLING_RESPONSE,
  content: [{ type: "text", text: JSON.stringify({ sport: "cycling" }) }],
};

const ATTEMPT_USD = 0.0022;
const DIGITS = 10;

type UsageRow = {
  cost: number;
  requestCount?: number;
  failedRequests?: number;
  modelId?: string;
  createdAt: string;
};

/**
 * Answers every Provider call. After `fail(n)`, the next `n` calls answer
 * INVALID_RESPONSE: saving an account checks its key with a call of its own,
 * so the failures are armed only once the account is saved.
 */
async function stubProvider(
  page: Page
): Promise<{ fail: (n: number) => void }> {
  let failing = 0;
  const answer = (route: Route) => {
    const invalid = failing > 0;
    if (invalid) failing -= 1;
    return fulfillLlm(route, invalid ? INVALID_RESPONSE : LLM_CYCLING_RESPONSE);
  };
  for (const pattern of LLM_ROUTES) await page.route(pattern, answer);
  return {
    fail: (n) => {
      failing = n;
    },
  };
}

async function addProvider(page: Page): Promise<void> {
  await openHeaderAction(page, /open settings/i);
  await page.getByTestId("settings-row-ai").click();
  const settings = page.getByTestId("settings-page");
  await settings.getByRole("button", { name: "Add account" }).click();
  await settings
    .getByLabel("Provider", { exact: true })
    .selectOption("anthropic");
  await settings.getByPlaceholder("sk-...").fill("sk-ant-fake-for-e2e");
  await settings.getByRole("button", { name: "Save account" }).click();
  await expect(settings.getByPlaceholder("sk-...")).toHaveCount(0);
}

const usageRows = (page: Page): Promise<UsageRow[]> =>
  page.evaluate(async () => {
    const db = (window as unknown as Record<string, unknown>).__KAIORD_DB__ as {
      table: (n: string) => { toArray: () => Promise<UsageRow[]> };
    };
    const rows = await db.table("usageEvents").toArray();
    return rows.sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
  });

/** Generates one workout and waits until its run is in the usage log. */
async function generateWorkout(page: Page, runsAfter: number): Promise<void> {
  await page.goto("/workout/new?source=scratch");
  const banner = page.getByRole("button", { name: /generate with ai/i });
  const description = page.getByLabel("Workout description");
  // The banner remembers whether it was open, so open it only when closed.
  await expect(async () => {
    if ((await banner.first().getAttribute("aria-expanded")) !== "true")
      await banner.first().click();
    await expect(description).toBeVisible({ timeout: 1_000 });
  }).toPass();
  await description.fill("45 minutes sweet spot cycling, warmup and cooldown");
  await page
    .getByRole("button", { name: /generate workout/i })
    .first()
    .click();
  await expect
    .poll(async () => (await usageRows(page)).length, { timeout: 15_000 })
    .toBe(runsAfter);
}

test.describe("AI usage cost", () => {
  test("counts a failed attempt, so that run costs more than a clean one", async ({
    page,
  }) => {
    const provider = await stubProvider(page);
    await page.goto("/workout/new?source=scratch");
    await addProvider(page);

    provider.fail(1);
    await generateWorkout(page, 1);
    await generateWorkout(page, 2);

    const [retried, clean] = await usageRows(page);
    expect(retried).toMatchObject({
      modelId: "claude-sonnet-5",
      requestCount: 2,
      failedRequests: 1,
    });
    expect(retried!.cost).toBeCloseTo(2 * ATTEMPT_USD, DIGITS);
    expect(clean).toMatchObject({ requestCount: 1, failedRequests: 0 });
    expect(clean!.cost).toBeCloseTo(ATTEMPT_USD, DIGITS);
    expect(retried!.cost).toBeGreaterThan(clean!.cost);
  });

  test("shows the cost by model with the prices it was computed from", async ({
    page,
  }) => {
    const provider = await stubProvider(page);
    await page.goto("/workout/new?source=scratch");
    await addProvider(page);
    provider.fail(1);
    await generateWorkout(page, 1);

    await page.goto("/settings/ai?section=usage");
    const row = page.getByTestId("usage-model-anthropic-claude-sonnet-5");
    await expect(row).toContainText("Claude Sonnet 5");
    await expect(row).toContainText("$0.0044");
    await expect(row).toContainText(
      "$2.00 input · $10.00 output · $0.20 cached input per million tokens"
    );
    await expect(page.getByTestId("usage-cost-basis")).toContainText(
      "every attempt the Provider billed"
    );
  });
});
