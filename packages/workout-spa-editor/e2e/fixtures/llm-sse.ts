/**
 * Serves a mocked LLM reply in the wire format the request asked for.
 *
 * A run with a progress listener streams (`streamText`), so the SDK sends
 * `"stream": true` (Anthropic, OpenAI) or calls Gemini's
 * `:streamGenerateContent?alt=sse`, and parses `text/event-stream` in that
 * provider's own event shape. A JSON body answers a non-streaming call only.
 * The fixtures are Anthropic message objects; their text is what streams.
 */
import type { Route } from "@playwright/test";

import { anthropic } from "./llm-sse-anthropic";
import { gemini } from "./llm-sse-gemini";
import { openAiChat, openAiResponses } from "./llm-sse-openai";
import type { SseEvent } from "./llm-sse-types";

const CHUNKS = 3;

const textOf = (response: unknown): string => {
  const content = (response as { content?: { text?: unknown }[] }).content;
  const text = content?.[0]?.text;
  return typeof text === "string" ? text : JSON.stringify(response);
};

// Split so the client sees several partial outputs, as a real stream gives.
const split = (text: string): string[] => {
  const size = Math.ceil(text.length / CHUNKS);
  return Array.from({ length: CHUNKS }, (_, i) =>
    text.slice(i * size, (i + 1) * size)
  ).filter(Boolean);
};

const eventsFor = (url: string, deltas: string[]): SseEvent[] => {
  if (url.includes("generativelanguage.googleapis.com")) return gemini(deltas);
  if (url.includes("api.openai.com"))
    return url.includes("/chat/completions")
      ? openAiChat(deltas)
      : openAiResponses(deltas);
  return anthropic(deltas);
};

const serialize = (events: SseEvent[]): string =>
  events
    .map(({ event, data }) => {
      const line = `data: ${typeof data === "string" ? data : JSON.stringify(data)}`;
      return event ? `event: ${event}\n${line}\n\n` : `${line}\n\n`;
    })
    .join("");

const wantsStream = (route: Route): boolean => {
  const request = route.request();
  if (request.url().includes(":streamGenerateContent")) return true;
  try {
    return (
      (JSON.parse(request.postData() ?? "{}") as { stream?: unknown })
        .stream === true
    );
  } catch {
    return false;
  }
};

/** The `text/event-stream` body a provider at `url` would send. */
export const llmSseBody = (url: string, response: unknown): string =>
  serialize(eventsFor(url, split(textOf(response))));

/** Fulfil an LLM call with `response`, streamed when the request streams. */
export const fulfillLlm = (route: Route, response: unknown): Promise<void> =>
  wantsStream(route)
    ? route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        body: llmSseBody(route.request().url(), response),
      })
    : route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(response),
      });
