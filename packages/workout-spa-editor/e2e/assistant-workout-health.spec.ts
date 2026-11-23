import type { Page, Route } from "@playwright/test";

import { expect, test } from "./fixtures/base";
import { llmSseBody } from "./fixtures/llm-sse";
import { E2E_DEFAULT_PROFILE_ID } from "./helpers/e2e-defaults";
import {
  answerHealthSharing,
  HEALTH_SHARING_KEY,
} from "./helpers/health-sharing";
import { countKaiordStore } from "./helpers/kaiord-idb";
import { clearDexie } from "./helpers/seed-dexie";
import { waitForDexieReady } from "./helpers/wait-for-dexie-ready";

/**
 * E2E: the chat runs on Anthropic and workouts are generated on OpenAI, two
 * local stubs. The assistant reads the athlete's HRV, then calls
 * `create_workout` with a description quoting it. That description is
 * health data: it reaches OpenAI only under OpenAI's own answer. Nothing
 * here reaches a real endpoint.
 */

const ANTHROPIC = "**/api.anthropic.com/**";
const OPENAI = "**/api.openai.com/**";
const CLAUDE = "claude-sonnet-4-5-20241022";
const REPLY = "I could not create it.";
const DESCRIPTION = "Easy 40 min run, your HRV of 48 ms asks for an easy day";

type Block = { id: string; name: string; input: Record<string, string> };

const toolUse = ({ id, name, input }: Block) =>
  [
    [
      "message_start",
      {
        type: "message_start",
        message: {
          id: `msg_${id}`,
          type: "message",
          role: "assistant",
          model: CLAUDE,
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
        content_block: { type: "tool_use", id, name, input: {} },
      },
    ],
    [
      "content_block_delta",
      {
        type: "content_block_delta",
        index: 0,
        delta: {
          type: "input_json_delta",
          partial_json: JSON.stringify(input),
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
  ]
    .map(
      ([event, data]) =>
        `event: ${event as string}\ndata: ${JSON.stringify(data)}\n\n`
    )
    .join("");

const READ_HRV: Block = {
  id: "toolu_hrv",
  name: "query_health",
  input: { metric: "hrv" },
};
const CREATE: Block = {
  id: "toolu_workout",
  name: "create_workout",
  input: { description: DESCRIPTION, date: "2026-11-24", sport: "running" },
};

/** Anthropic reads HRV, then proposes the workout, then answers. */
async function stubProviders(page: Page) {
  const anthropic: string[] = [];
  const openai: string[] = [];
  await page.route(ANTHROPIC, (route: Route) => {
    const body = route.request().postData() ?? "";
    anthropic.push(body);
    const answer = body.includes(CREATE.id)
      ? llmSseBody(route.request().url(), { content: [{ text: REPLY }] })
      : toolUse(body.includes(READ_HRV.id) ? CREATE : READ_HRV);
    return route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      body: answer,
    });
  });
  await page.route(OPENAI, (route: Route) => {
    openai.push(route.request().postData() ?? "");
    return route.fulfill({ status: 500, body: "{}" });
  });
  return { anthropic, openai };
}

/** Chat on Anthropic, generation on OpenAI, both bound to the athlete. */
async function seedTwoProviders(page: Page) {
  await page.evaluate(async (profileId) => {
    const w = window as unknown as Record<string, unknown>;
    const seed = w.__KAIORD_E2E_SEED__ as {
      aiProvider: (p: unknown) => Promise<void>;
    };
    const db = w.__KAIORD_DB__ as {
      table: (n: string) => { put: (r: unknown) => Promise<void> };
    };
    const now = new Date().toISOString();
    await seed.aiProvider({
      id: "p-anthropic",
      type: "anthropic",
      apiKey: "sk-ant-e2e",
      model: "claude-sonnet-4-5-20241022",
      label: "Chat",
      isDefault: true,
      createdAt: 1,
    });
    await seed.aiProvider({
      id: "p-openai",
      type: "openai",
      apiKey: "sk-openai-e2e",
      model: "gpt-4o-mini",
      label: "Workouts",
      isDefault: false,
      createdAt: 2,
    });
    const bind = (purpose: string, providerId: string, modelId: string) =>
      db
        .table("aiModelBindings")
        .put({ profileId, purpose, providerId, modelId, updatedAt: now });
    await bind("default", "p-anthropic", "claude-sonnet-4-5-20241022");
    await bind("workout_generation", "p-openai", "gpt-4o-mini");
  }, E2E_DEFAULT_PROFILE_ID);
}

async function openChat(page: Page) {
  const bodies = await stubProviders(page);
  await page.goto("/calendar");
  await waitForDexieReady(page);
  await clearDexie(page);
  await seedTwoProviders(page);
  await page.goto("/chat");
  return bodies;
}

/** What the App answered the Provider's `create_workout` call with. */
const createResult = (bodies: string[]) =>
  JSON.stringify(
    bodies
      .filter((body) => body.includes(CREATE.id))
      .flatMap(
        (body) =>
          (JSON.parse(body) as { messages: Array<{ content: unknown }> })
            .messages
      )
      .flatMap((m) => (Array.isArray(m.content) ? m.content : []))
      .find(
        (part: { type?: string; tool_use_id?: string }) =>
          part.type === "tool_result" && part.tool_use_id === CREATE.id
      ) ?? null
  );

test.describe("A workout the assistant creates after reading health data", () => {
  test("is not created, and nothing reaches OpenAI, when the athlete keeps health data from OpenAI", async ({
    page,
  }) => {
    await answerHealthSharing(page, { anthropic: "always", openai: "never" });
    const { anthropic, openai } = await openChat(page);

    await page.getByLabel("Message").fill("Plan tomorrow from my HRV");
    await page.getByRole("button", { name: "Send", exact: true }).click();
    await page.getByRole("button", { name: "Approve" }).click();

    await expect(
      page
        .getByText(
          "The workout was not created: this conversation read your health data, and you chose not to send health data to OpenAI."
        )
        .first()
    ).toBeVisible();
    await expect(
      page.getByTestId("chat-messages").getByText(REPLY)
    ).toBeVisible();
    expect(openai).toHaveLength(0);
    await expect
      .poll(() => createResult(anthropic))
      .toContain("The athlete chose not to send health data to OpenAI");
    expect(await countKaiordStore(page, "workouts")).toBe(0);
  });
});

test.describe("A workout the assistant creates after reading health data, in Spanish", () => {
  test.use({ locale: "es-ES" });

  test("asks OpenAI's question first, and is not created on no", async ({
    page,
  }) => {
    await answerHealthSharing(page, { anthropic: "always" });
    const { anthropic, openai } = await openChat(page);

    await page.getByLabel("Mensaje").fill("Planifica mañana según mi VFC");
    await page.getByRole("button", { name: "Enviar", exact: true }).click();
    await page.getByRole("button", { name: "Aprobar" }).click();

    const notice = page.getByTestId("health-sharing-notice");
    await expect(notice).toContainText("¿Enviar tus datos de salud a OpenAI?");
    await expect(notice).toContainText(
      "El asistente escribió la descripción de este entrenamiento después de leer tus datos de salud, así que puede citarlos."
    );
    await expect(notice).toContainText("El entrenamiento no se crea.");
    expect(openai).toHaveLength(0);

    await notice.getByRole("button", { name: "No enviar" }).click();
    await expect(
      page
        .getByText(
          "No se ha creado el entrenamiento: esta conversación leyó tus datos de salud y elegiste no enviar datos de salud a OpenAI."
        )
        .first()
    ).toBeVisible();
    expect(openai).toHaveLength(0);
    await expect
      .poll(() => createResult(anthropic))
      .toContain("The athlete chose not to send health data to OpenAI");
    expect(
      JSON.parse(
        (await page.evaluate(
          (key) => window.localStorage.getItem(key),
          HEALTH_SHARING_KEY
        )) ?? "{}"
      )
    ).toEqual({ anthropic: "always", openai: "never" });
  });
});
