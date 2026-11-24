/**
 * Real-SDK tests (no `ai` mock): every model step of a chat turn is one
 * request the Provider bills, and the turn's event lists them all.
 */
import { APICallError } from "ai";
import { convertArrayToReadableStream, MockLanguageModelV4 } from "ai/test";
import { describe, expect, it } from "vitest";

import { createHubChatToolFixtures } from "../evals/chat-tool-fixtures";
import { createRingBufferTelemetrySink } from "../observability/ring-buffer-sink";
import { createChatAgent } from "./chat-agent";

const TOOL_STEP = { input: 300, output: 20 };
const TEXT_STEP = { input: 400, output: 50 };

const finish = (
  unified: string,
  tokens: { input: number; output: number }
) => ({
  type: "finish",
  finishReason: { unified, raw: unified },
  usage: {
    inputTokens: { total: tokens.input },
    outputTokens: { total: tokens.output },
  },
});

const toolStep = () => ({
  stream: convertArrayToReadableStream([
    { type: "stream-start", warnings: [] },
    {
      type: "tool-call",
      toolCallId: "r1",
      toolName: "get_data_routes",
      input: "{}",
    },
    finish("tool-calls", TOOL_STEP),
  ]),
});

const textStep = () => ({
  stream: convertArrayToReadableStream([
    { type: "stream-start", warnings: [] },
    { type: "text-start", id: "t" },
    { type: "text-delta", id: "t", delta: "done" },
    { type: "text-end", id: "t" },
    finish("stop", TEXT_STEP),
  ]),
});

const overloaded = () =>
  new APICallError({
    message: "overloaded",
    url: "https://provider.test",
    requestBodyValues: {},
    statusCode: 529,
    isRetryable: true,
  });

const turnWith = async (second: () => unknown) => {
  let calls = 0;
  const model = new MockLanguageModelV4({
    doStream: async () => {
      calls += 1;
      return (calls === 1 ? toolStep() : second()) as never;
    },
  });
  const sink = createRingBufferTelemetrySink();
  const agent = createChatAgent({
    model,
    tools: createHubChatToolFixtures(),
    telemetry: sink,
  });
  await agent
    .sendTurn([{ role: "user", content: "routes?" }])
    .catch(() => undefined);
  return sink.events()[0]!;
};

describe("createChatAgent cost reporting", () => {
  it("should report each tool-loop step as a billed request", async () => {
    // Arrange
    const second = textStep;

    // Act
    const event = await turnWith(second);

    // Assert
    expect(event).toMatchObject({
      type: "chat_turn_finished",
      status: "complete",
      inputTokens: 700,
      outputTokens: 70,
      requests: [
        { outcome: "ok", usage: { promptTokens: 300, completionTokens: 20 } },
        { outcome: "ok", usage: { promptTokens: 400, completionTokens: 50 } },
      ],
    });
  });

  it("should report a step that failed with no usage as an unmeasured request", async () => {
    // Arrange
    const second = () => {
      throw overloaded();
    };

    // Act
    const event = await turnWith(second);

    // Assert
    expect(event).toMatchObject({
      status: "error",
      inputTokens: 300,
      requests: [
        { outcome: "ok", usage: { promptTokens: 300 } },
        { outcome: "error" },
      ],
    });
    expect(
      event.type === "chat_turn_finished" && event.requests[1]
    ).not.toHaveProperty("usage");
  });
});
