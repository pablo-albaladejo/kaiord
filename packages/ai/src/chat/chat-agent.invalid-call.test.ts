/**
 * Real-SDK test (no `ai` mock): a model call whose input fails the tool's
 * schema is marked `invalid` by the SDK, answered with a tool-error, and the
 * loop continues — but it still appears in `result.toolCalls`. Only a valid
 * action call may reach the confirmation card.
 */
import { convertArrayToReadableStream, MockLanguageModelV4 } from "ai/test";
import { describe, expect, it } from "vitest";

import { createHubChatToolFixtures } from "../evals/chat-tool-fixtures";
import { createChatAgent } from "./chat-agent";

const usage = { inputTokens: { total: 1 }, outputTokens: { total: 1 } };

const toolCallStep = (toolCallId: string, input: Record<string, unknown>) => ({
  stream: convertArrayToReadableStream([
    { type: "stream-start", warnings: [] },
    {
      type: "tool-call",
      toolCallId,
      toolName: "set_data_route",
      input: JSON.stringify(input),
    },
    {
      type: "finish",
      finishReason: { unified: "tool-calls", raw: "tool_use" },
      usage,
    },
  ]),
});

describe("chat agent with an invalid action call", () => {
  it("should surface only the valid set_data_route call for confirmation", async () => {
    // Arrange
    const valid = {
      action: "enable_route",
      dataType: "sleep",
      integrationId: "whoop",
      direction: "import",
    };
    const model = new MockLanguageModelV4({
      doStream: [
        toolCallStep("bad", {
          action: "enable_route",
          dataType: "sleep",
          integrationId: "whoop",
        }),
        toolCallStep("good", valid),
      ] as never,
    });
    const agent = createChatAgent({
      model,
      tools: createHubChatToolFixtures(),
    });

    // Act
    const result = await agent.sendTurn([
      { role: "user", content: "import sleep from whoop" },
    ]);

    // Assert
    expect(result.status).toBe("pending_action");
    if (result.status === "pending_action") {
      expect(result.pendingAction.toolCallId).toBe("good");
      expect(result.pendingAction.input).toEqual(valid);
    }
    expect(model.doStreamCalls).toHaveLength(2);
  });
});
