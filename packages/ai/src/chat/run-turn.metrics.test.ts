/**
 * Real-SDK tests (no `ai` mock) for the per-turn metrics: tool names are
 * limited to registered tools with valid input, and a thrown turn carries the
 * metrics of the steps it finished.
 */
import { APICallError } from "ai";
import { convertArrayToReadableStream, MockLanguageModelV4 } from "ai/test";
import { describe, expect, it } from "vitest";

import { createHubChatToolFixtures } from "../evals/chat-tool-fixtures";
import { buildSdkTools } from "./build-sdk-tools";
import { runTurn } from "./run-turn";
import { turnMetricsOf } from "./turn-stats";

const finish = (unified: string) => ({
  type: "finish",
  finishReason: { unified, raw: unified },
  usage: { inputTokens: { total: 5 }, outputTokens: { total: 2 } },
});

const call = (toolCallId: string, toolName: string, input: string) => ({
  type: "tool-call",
  toolCallId,
  toolName,
  input,
});

const toolStep = () => ({
  stream: convertArrayToReadableStream([
    { type: "stream-start", warnings: [] },
    call("r1", "get_data_routes", "{}"),
    call("r2", "made_up_tool", "{}"),
    call("r3", "set_data_route", '{"action":"explode"}'),
    finish("tool-calls"),
  ]),
});

const textStep = () => ({
  stream: convertArrayToReadableStream([
    { type: "stream-start", warnings: [] },
    { type: "text-start", id: "t" },
    { type: "text-delta", id: "t", delta: "done" },
    { type: "text-end", id: "t" },
    finish("stop"),
  ]),
});

const scripted = (second: () => unknown) => {
  let calls = 0;
  return new MockLanguageModelV4({
    doStream: async () => {
      calls += 1;
      return (calls === 1 ? toolStep() : second()) as never;
    },
  });
};

const tools = () => buildSdkTools(createHubChatToolFixtures());
const messages = [{ role: "user" as const, content: "routes?" }];

describe("runTurn metrics", () => {
  it("should name only registered tools called with a valid input", async () => {
    // Arrange
    const model = scripted(textStep);

    // Act
    const raw = await runTurn({ model, messages, tools: tools(), maxSteps: 8 });

    // Assert
    expect(raw.toolNames).toEqual(["get_data_routes"]);
    expect(raw.steps).toBe(2);
  });

  it("should attach the finished steps' metrics to a provider error", async () => {
    // Arrange
    const failure = new APICallError({
      message: "overloaded",
      url: "https://api.anthropic.com/v1/messages",
      requestBodyValues: {},
      statusCode: 529,
      isRetryable: true,
    });
    const model = scripted(() => {
      throw failure;
    });

    // Act
    const error = await runTurn({
      model,
      messages,
      tools: tools(),
      maxSteps: 8,
    }).catch((e: unknown) => e);

    // Assert
    expect(error).toBe(failure);
    expect(turnMetricsOf(error)).toEqual({
      steps: 1,
      toolNames: ["get_data_routes"],
      usage: { promptTokens: 5, completionTokens: 2 },
    });
  });
});
