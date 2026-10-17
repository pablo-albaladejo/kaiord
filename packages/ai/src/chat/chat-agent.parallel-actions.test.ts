/**
 * Real-SDK test (no `ai` mock): a model may emit two action calls in one
 * step. Only one can be confirmed, and every tool call must be answered
 * before the conversation is sent again — Anthropic rejects a `tool_use`
 * with no matching `tool_result`. The resumed prompt is the evidence.
 */
import { convertArrayToReadableStream, MockLanguageModelV4 } from "ai/test";
import { describe, expect, it } from "vitest";

import { createHubChatToolFixtures } from "../evals/chat-tool-fixtures";
import { createChatAgent } from "./chat-agent";

const usage = { inputTokens: { total: 1 }, outputTokens: { total: 1 } };

const route = (dataType: string) =>
  JSON.stringify({
    action: "enable_route",
    dataType,
    integrationId: "whoop",
    direction: "import",
  });

const stream = (parts: unknown[], finish: string, raw: string) => ({
  stream: convertArrayToReadableStream([
    { type: "stream-start", warnings: [] },
    ...parts,
    { type: "finish", finishReason: { unified: finish, raw }, usage },
  ]),
});

// A stream is read once, so each test builds its own.
const twoActionsInOneStep = () =>
  stream(
    [
      {
        type: "tool-call",
        toolCallId: "first",
        toolName: "set_data_route",
        input: route("sleep"),
      },
      {
        type: "tool-call",
        toolCallId: "second",
        toolName: "set_data_route",
        input: route("hrv"),
      },
    ],
    "tool-calls",
    "tool_use"
  );

const done = () =>
  stream(
    [
      { type: "text-start", id: "t" },
      { type: "text-delta", id: "t", delta: "Done." },
      { type: "text-end", id: "t" },
    ],
    "stop",
    "end_turn"
  );

const answeredIds = (prompt: Array<{ role: string; content: unknown }>) =>
  prompt
    .filter((m) => m.role === "tool")
    .flatMap((m) => m.content as Array<{ type: string; toolCallId: string }>)
    .filter((part) => part.type === "tool-result")
    .map((part) => part.toolCallId);

const reAskHrv = () =>
  stream(
    [
      {
        type: "tool-call",
        toolCallId: "third",
        toolName: "set_data_route",
        input: route("hrv"),
      },
    ],
    "tool-calls",
    "tool_use"
  );

const deferredAnswer = (prompt: Array<{ role: string; content: unknown }>) =>
  prompt
    .filter((m) => m.role === "tool")
    .flatMap((m) => m.content as Array<Record<string, unknown>>)
    .find((part) => part.toolCallId === "first");

describe("chat agent with parallel action calls", () => {
  it("should offer the deferred action again once the user has declined the pending one", async () => {
    // Arrange
    const model = new MockLanguageModelV4({
      doStream: [twoActionsInOneStep(), reAskHrv()] as never,
    });
    const agent = createChatAgent({
      model,
      tools: createHubChatToolFixtures(),
    });
    const first = await agent.sendTurn([
      { role: "user", content: "import sleep and hrv from whoop" },
    ]);
    if (first.status !== "pending_action") throw new Error(first.status);

    // Act
    const resumed = await agent.resume(first.messages, {
      toolCallId: first.pendingAction.toolCallId,
      toolName: first.pendingAction.toolName,
      status: "declined",
    });

    // Assert
    expect(first.pendingAction.deferredCount).toBe(1);
    const prompt = model.doStreamCalls[1]?.prompt ?? [];
    expect(JSON.stringify(deferredAnswer(prompt as never))).toContain(
      "applies to that action only"
    );
    if (resumed.status !== "pending_action") throw new Error(resumed.status);
    expect(resumed.pendingAction).toEqual({
      toolName: "set_data_route",
      toolCallId: "third",
      input: JSON.parse(route("hrv")),
    });
  });

  it("should answer every tool call in the resumed prompt when two actions share a step", async () => {
    // Arrange
    const model = new MockLanguageModelV4({
      doStream: [twoActionsInOneStep(), done()] as never,
    });
    const agent = createChatAgent({
      model,
      tools: createHubChatToolFixtures(),
    });
    const first = await agent.sendTurn([
      { role: "user", content: "import sleep and hrv from whoop" },
    ]);
    if (first.status !== "pending_action") throw new Error(first.status);

    // Act
    const resumed = await agent.resume(first.messages, {
      toolCallId: first.pendingAction.toolCallId,
      toolName: first.pendingAction.toolName,
      status: "approved",
      output: { ok: true },
    });

    // Assert
    expect(resumed.status).toBe("complete");
    const prompt = model.doStreamCalls[1]?.prompt ?? [];
    expect(answeredIds(prompt as never).sort()).toEqual(["first", "second"]);
  });
});
