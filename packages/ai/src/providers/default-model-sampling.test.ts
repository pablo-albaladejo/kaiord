/**
 * The anthropic default is a model that rejects sampling parameters. Kaiord
 * sends `temperature: 0` on every generation, so this proves — through the
 * real `@ai-sdk/anthropic` provider with only `fetch` stubbed — that the SDK
 * strips it rather than letting the default answer 400 on every call.
 */
import { generateText } from "ai";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createLanguageModel } from "./create-language-model";
import { getDefaultModel } from "./provider-models";

const anthropicReply = (model: string) =>
  new Response(
    JSON.stringify({
      id: "msg_1",
      type: "message",
      role: "assistant",
      model,
      content: [{ type: "text", text: "ok" }],
      stop_reason: "end_turn",
      stop_sequence: null,
      usage: { input_tokens: 1, output_tokens: 1 },
    }),
    { headers: { "content-type": "application/json" } }
  );

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("anthropic default model sampling", () => {
  it("should strip temperature from requests to the default model", async () => {
    // Arrange
    const modelId = getDefaultModel("anthropic");
    const fetchMock = vi.fn(async () => anthropicReply(modelId));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("AI_SDK_LOG_WARNINGS", false);
    const model = await createLanguageModel(
      { type: "anthropic", apiKey: "test-key" },
      modelId
    );

    // Act
    await generateText({ model, prompt: "hi", temperature: 0 });

    // Assert
    const [, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    const body = JSON.parse(String(init.body)) as Record<string, unknown>;
    expect(body.model).toBe(modelId);
    expect(body).not.toHaveProperty("temperature");
  });
});
