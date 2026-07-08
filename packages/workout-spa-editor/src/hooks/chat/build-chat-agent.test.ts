import { describe, expect, it, vi } from "vitest";

const createLanguageModel = vi.fn().mockResolvedValue({ id: "model" });
const createChatAgent = vi.fn(() => ({ sendTurn: vi.fn(), resume: vi.fn() }));
const buildChatTools = vi.fn(() => ["tool"]);

vi.mock("@kaiord/ai", () => ({
  createChatAgent: (config: unknown) => createChatAgent(config),
}));
vi.mock("@kaiord/ai/providers", () => ({
  createLanguageModel: (...args: unknown[]) => createLanguageModel(...args),
}));
vi.mock("@kaiord/ai/prompts", () => ({
  buildChatSystemPrompt: () => "SYSTEM_PROMPT",
}));
vi.mock("../../application/chat/tools/build-chat-tools", () => ({
  buildChatTools: (deps: unknown) => buildChatTools(deps),
}));

import type { ChatActionOps } from "../../application/chat/tools/chat-tool-deps";
import type { DataHubMatrixSignals } from "../../application/data-hub/build-data-hub-matrix";
import type { PersistencePort } from "../../ports/persistence-port";
import { buildChatAgent } from "./build-chat-agent";

const onTextDelta = vi.fn();

const args = {
  persistence: {} as PersistencePort,
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
      tools: ["tool"],
      system: "SYSTEM_PROMPT",
      onTextDelta,
    });
    expect(result.tools).toEqual(["tool"]);
  });
});
