import { describe, expect, it, vi } from "vitest";

const createLanguageModel = vi.fn().mockResolvedValue({ id: "model" });
const createChatAgent = vi.fn(() => ({ sendTurn: vi.fn(), resume: vi.fn() }));
const ACTION_TOOL = { name: "create_workout", requiresConfirmation: true };
const buildChatTools = vi.fn(() => [ACTION_TOOL]);

vi.mock("@kaiord/ai", () => ({
  createChatAgent: (config: unknown) => createChatAgent(config),
}));
vi.mock("@kaiord/ai/providers", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  createLanguageModel: (...args: unknown[]) => createLanguageModel(...args),
}));
vi.mock("@kaiord/ai/prompts", () => ({
  buildChatSystemPrompt: () => "SYSTEM_PROMPT",
  CHAT_PROMPT_VERSION: "9.9.9",
}));
vi.mock("../../application/chat/tools/build-chat-tools", () => ({
  buildChatTools: (deps: unknown) => buildChatTools(deps),
}));

import type { ChatActionOps } from "../../application/chat/tools/chat-tool-deps";
import type { DataHubMatrixSignals } from "../../application/data-hub/build-data-hub-matrix";
import { startTraceRun } from "../../application/trace/trace-run";
import type { PersistencePort } from "../../ports/persistence-port";
import { createInMemoryTraceRepository } from "../../test-utils/in-memory-trace-repository";
import { buildChatAgent } from "./build-chat-agent";

const onTextDelta = vi.fn();

const traces = createInMemoryTraceRepository();
const trace = startTraceRun({ feature: "chat", traces });

const args = {
  persistence: {} as PersistencePort,
  trace,
  profileId: "p1",
  today: "2026-07-08",
  provider: { type: "anthropic" as const, apiKey: "sk-test" },
  modelId: "claude-sonnet-4-5",
  actions: {} as ChatActionOps,
  getMatrixSignals: vi.fn(async () => ({}) as DataHubMatrixSignals),
  onTextDelta,
};

describe("buildChatAgent", () => {
  it("should create the language model with the browser flag", async () => {
    // Arrange
    createLanguageModel.mockClear();

    // Act
    await buildChatAgent(args);

    // Assert
    expect(createLanguageModel).toHaveBeenCalledWith(
      args.provider,
      args.modelId,
      { browser: true }
    );
  });

  it("should assemble the agent from the chat prompt, tools, and model", async () => {
    // Arrange
    createChatAgent.mockClear();

    // Act
    const result = await buildChatAgent(args);

    // Assert
    expect(createChatAgent).toHaveBeenCalledWith({
      model: { id: "model" },
      tools: [ACTION_TOOL],
      system: "SYSTEM_PROMPT",
      promptVersion: "9.9.9",
      telemetry: expect.objectContaining({ emit: expect.any(Function) }),
      onTextDelta,
    });
    expect(result.tools).toEqual([ACTION_TOOL]);
  });

  it("should report the agent's model calls to the turn's Trace", async () => {
    // Arrange
    createChatAgent.mockClear();
    await buildChatAgent(args);
    const config = (
      createChatAgent.mock.calls.at(-1) as unknown as [
        { telemetry: { emit: (e: unknown) => void } },
      ]
    )[0];

    // Act
    config.telemetry.emit({
      type: "chat_turn_finished",
      traceId: "x",
      promptVersion: "9.9.9",
      provider: "anthropic.messages",
      modelId: "claude-sonnet-4-5",
      steps: 1,
      toolNames: [],
      status: "complete",
      inputTokens: 0,
      outputTokens: 0,
      latencyMs: 1,
      requests: [{ outcome: "ok" }],
    });
    const stored = await trace.finish();

    // Assert
    expect(stored?.units).toEqual([{ promptVersion: "9.9.9" }]);
    expect(stored?.modelCalls).toBe(1);
  });
});
