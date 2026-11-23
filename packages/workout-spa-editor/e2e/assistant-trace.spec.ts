import { readFile } from "node:fs/promises";

import type { Page, Route } from "@playwright/test";

import { expect, test } from "./fixtures/base";
import { llmSseBody } from "./fixtures/llm-sse";
import { answerHealthSharing } from "./helpers/health-sharing";
import { countKaiordStore } from "./helpers/kaiord-idb";
import { seedAiProvider } from "./helpers/seed-ai-provider";
import { clearDexie } from "./helpers/seed-dexie";
import { waitForDexieReady } from "./helpers/wait-for-dexie-ready";

/**
 * E2E: a run of the assistant leaves a Trace the athlete reads and exports
 * in Settings, Privacy. The Provider is a local stub; nothing reaches a real
 * endpoint, and no request the App makes carries the Trace.
 */

const ANTHROPIC = "**/api.anthropic.com/**";
const MODEL = "claude-sonnet-4-5-20241022";

type Copy = {
  message: string;
  send: string;
  reply: string;
  summary: RegExp;
  model: string;
  sent: string;
  noTools: string;
  export: string;
};

const EN: Copy = {
  message: "Message",
  send: "Send",
  reply: "Rest today.",
  summary: /^Chat · .+ · Finished · /,
  model: `Anthropic ${MODEL}`,
  sent: "To Anthropic: your messages",
  noTools: "No Tool was called.",
  export: "Export all (JSON)",
};

const ES: Copy = {
  message: "Mensaje",
  send: "Enviar",
  reply: "Descansa hoy.",
  summary: /^Chat · .+ · Terminada · /,
  model: `Anthropic ${MODEL}`,
  sent: "A Anthropic: tus mensajes",
  noTools: "No se llamó a ninguna herramienta.",
  export: "Exportar todas (JSON)",
};

/** Stubs the Provider and records every request the page makes. */
async function openChat(page: Page, reply: string): Promise<string[]> {
  const outbound: string[] = [];
  page.on("request", (request) =>
    outbound.push(`${request.url()} ${request.postData() ?? ""}`)
  );
  await page.route(ANTHROPIC, (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      body: llmSseBody(route.request().url(), { content: [{ text: reply }] }),
    })
  );
  await answerHealthSharing(page, { anthropic: "never" });
  await page.goto("/calendar");
  await waitForDexieReady(page);
  await clearDexie(page);
  await seedAiProvider(page);
  await page.goto("/chat");
  return outbound;
}

async function runAndReadTrace(page: Page, copy: Copy, text: string) {
  const outbound = await openChat(page, copy.reply);
  await page.getByLabel(copy.message).fill(text);
  await page.getByRole("button", { name: copy.send, exact: true }).click();
  await expect(
    page.getByTestId("chat-messages").getByText(copy.reply)
  ).toBeVisible();
  // The Trace is written as the turn settles; leave only once it is stored.
  await expect.poll(() => countKaiordStore(page, "traces")).toBe(1);

  await page.goto("/settings/privacy");
  const section = page.getByTestId("traces-section");
  const summary = section.locator("summary");
  await expect(summary).toHaveCount(1);
  await expect(summary).toHaveText(copy.summary);
  await summary.click();
  const details = section.getByTestId("trace-details");
  await expect(details).toContainText(copy.model);
  await expect(details).toContainText(copy.sent);
  await expect(details).toContainText(copy.noTools);

  const download = page.waitForEvent("download");
  await section.getByRole("button", { name: copy.export }).click();
  const file = await (await download).path();
  const exported = JSON.parse(await readFile(file, "utf8")) as {
    format: string;
    traces: Array<{ id: string; feature: string; outcome: string }>;
  };
  return { exported, outbound, raw: await readFile(file, "utf8") };
}

test.describe("The assistant's Trace", () => {
  test("is read and exported in Settings, Privacy, and never sent", async ({
    page,
  }) => {
    const text = "Should I train today?";
    const { exported, outbound, raw } = await runAndReadTrace(page, EN, text);

    expect(exported.format).toBe("kaiord-traces");
    expect(exported.traces).toHaveLength(1);
    expect(exported.traces[0]).toMatchObject({
      feature: "chat",
      outcome: "ok",
    });
    expect(raw).not.toContain(text);
    expect(raw).not.toContain(EN.reply);
    const id = exported.traces[0]?.id ?? "missing";
    expect(outbound.filter((line) => line.includes(id))).toEqual([]);
  });
});

test.describe("The assistant's Trace, in Spanish", () => {
  test.use({ locale: "es-ES" });

  test("se lee y se exporta en Ajustes, Privacidad", async ({ page }) => {
    const text = "¿Entreno hoy?";
    const { exported, outbound } = await runAndReadTrace(page, ES, text);

    expect(exported.traces).toHaveLength(1);
    const id = exported.traces[0]?.id ?? "missing";
    expect(outbound.filter((line) => line.includes(id))).toEqual([]);
  });
});
