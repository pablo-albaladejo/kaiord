import type { Page, Route } from "@playwright/test";

import { expect, test } from "./fixtures/base";
import { llmSseBody } from "./fixtures/llm-sse";
import { HEALTH_SHARING_KEY } from "./helpers/health-sharing";
import { seedAiProvider } from "./helpers/seed-ai-provider";
import { clearDexie } from "./helpers/seed-dexie";
import { waitForDexieReady } from "./helpers/wait-for-dexie-ready";

/**
 * E2E: the first time health data would go to a Provider, the athlete
 * decides. The Provider is a local stub: its first answer asks for the
 * athlete's weight through `query_health`, its second reads the tool result
 * the App sent back. Nothing here reaches a real endpoint.
 */

const ANTHROPIC = "**/api.anthropic.com/**";
const REPLY = "Done reading.";
const WITHHELD = "chose not to share their health data";

const sse = (events: Array<[string, unknown]>) =>
  events
    .map(
      ([event, data]) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
    )
    .join("");

const askForWeight = () =>
  sse([
    [
      "message_start",
      {
        type: "message_start",
        message: {
          id: "msg_tool",
          type: "message",
          role: "assistant",
          model: "claude-sonnet-4-5-20241022",
          content: [],
          usage: { input_tokens: 10, output_tokens: 1 },
        },
      },
    ],
    [
      "content_block_start",
      {
        type: "content_block_start",
        index: 0,
        content_block: {
          type: "tool_use",
          id: "toolu_weight",
          name: "query_health",
          input: {},
        },
      },
    ],
    [
      "content_block_delta",
      {
        type: "content_block_delta",
        index: 0,
        delta: {
          type: "input_json_delta",
          partial_json: '{"metric":"weight"}',
        },
      },
    ],
    ["content_block_stop", { type: "content_block_stop", index: 0 }],
    [
      "message_delta",
      {
        type: "message_delta",
        delta: { stop_reason: "tool_use", stop_sequence: null },
        usage: { output_tokens: 5 },
      },
    ],
    ["message_stop", { type: "message_stop" }],
  ]);

/** Stubs the Provider and records every request body the App sends it. */
async function stubProvider(page: Page): Promise<string[]> {
  const bodies: string[] = [];
  await page.route(ANTHROPIC, (route: Route) => {
    const body = route.request().postData() ?? "";
    bodies.push(body);
    return route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      body: body.includes('"tool_result"')
        ? llmSseBody(route.request().url(), { content: [{ text: REPLY }] })
        : askForWeight(),
    });
  });
  return bodies;
}

async function openChatWithProvider(page: Page): Promise<string[]> {
  const bodies = await stubProvider(page);
  await page.goto("/calendar");
  await waitForDexieReady(page);
  await clearDexie(page);
  await seedAiProvider(page);
  await page.goto("/chat");
  return bodies;
}

type Body = {
  messages: Array<{ content: Array<{ type: string; content?: unknown }> }>;
};

/** What the App answered the Provider's tool call with. */
const toolResultOf = (body: string | undefined): string =>
  JSON.stringify(
    (JSON.parse(body ?? "{}") as Body).messages
      .flatMap((m) => m.content)
      .find((part) => part.type === "tool_result")?.content ?? null
  );

const storedAnswers = (page: Page) =>
  page.evaluate((key) => window.localStorage.getItem(key), HEALTH_SHARING_KEY);

test.describe("First-time health data notice", () => {
  test("asks before the first message goes, and never again once always allowed", async ({
    page,
  }) => {
    const bodies = await openChatWithProvider(page);

    await page.getByLabel("Message").fill("What do I weigh?");
    await page.getByRole("button", { name: "Send", exact: true }).click();

    const notice = page.getByTestId("health-sharing-notice");
    await expect(notice).toContainText("Send your health data to Anthropic?");
    await expect(notice).toContainText(
      "the assistant can read this health data and send it to Anthropic: sleep, resting heart rate, weight, HRV"
    );
    await expect(notice).toContainText("Kaiord never receives it.");
    expect(bodies).toHaveLength(0);

    await notice
      .getByRole("button", { name: "Always allow Anthropic" })
      .click();
    await expect(page.getByText(REPLY)).toBeVisible();
    expect(bodies).toHaveLength(2);
    expect(toolResultOf(bodies[1])).toContain("range_used");
    expect(toolResultOf(bodies[1])).not.toContain(WITHHELD);
    expect(JSON.parse((await storedAnswers(page)) ?? "{}")).toEqual({
      anthropic: "always",
    });

    const sentBefore = bodies.length;
    await page.getByLabel("Message").fill("And yesterday?");
    await page.getByRole("button", { name: "Send", exact: true }).click();
    // The tool call and its answer go, with no notice between them.
    await expect.poll(() => bodies.length).toBe(sentBefore + 2);
    await expect(notice).toHaveCount(0);

    await page.goto("/settings/privacy");
    const inventory = page.getByTestId("data-flow-inventory");
    await expect(inventory).toContainText("Where your data goes");
    await expect(inventory.getByLabel("Health data to Anthropic")).toHaveValue(
      "always"
    );
  });
});

test.describe("First-time health data notice, in Spanish", () => {
  test.use({ locale: "es-ES" });

  test("sends the message without the health data when the athlete says no", async ({
    page,
  }) => {
    const bodies = await openChatWithProvider(page);

    await page.getByLabel("Mensaje").fill("¿Cuánto peso?");
    await page.getByRole("button", { name: "Enviar", exact: true }).click();

    const notice = page.getByTestId("health-sharing-notice");
    await expect(notice).toContainText(
      "¿Enviar tus datos de salud a Anthropic?"
    );
    await expect(notice).toContainText(
      "el asistente puede leer estos datos de salud y enviarlos a Anthropic: sueño, frecuencia cardiaca en reposo, peso, VFC"
    );
    await expect(notice).toContainText(
      "El asistente responde sin tus datos de salud. Kaiord no volverá a preguntar por Anthropic."
    );
    expect(bodies).toHaveLength(0);

    await notice.getByRole("button", { name: "No enviar" }).click();
    await expect(page.getByText(REPLY)).toBeVisible();
    expect(bodies).toHaveLength(2);
    expect(toolResultOf(bodies[1])).toContain(WITHHELD);
    expect(toolResultOf(bodies[1])).not.toContain("range_used");
    expect(JSON.parse((await storedAnswers(page)) ?? "{}")).toEqual({
      anthropic: "never",
    });

    await page.goto("/settings/privacy");
    const inventory = page.getByTestId("data-flow-inventory");
    await expect(inventory).toContainText("Adónde van tus datos");
    await expect(
      inventory.getByLabel("Datos de salud para Anthropic")
    ).toHaveValue("never");
  });
});
