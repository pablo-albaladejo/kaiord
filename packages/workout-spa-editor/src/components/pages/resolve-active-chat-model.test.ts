import { describe, expect, it } from "vitest";

import type { LlmProviderConfig } from "../../store/ai-store-types";
import type { ChatConversationRecord } from "../../types/chat/chat-conversation-record";
import { resolveActiveChatModel } from "./resolve-active-chat-model";
import type { ChatModels } from "./resolve-chat-models";

const PROVIDER: LlmProviderConfig = {
  id: "prov-1",
  type: "anthropic",
  apiKey: "sk-test",
  label: "Claude",
  isDefault: true,
  createdAt: 0,
};

const FALLBACK: ChatModels = {
  provider: PROVIDER,
  modelId: "claude-sonnet-5",
  generationProvider: PROVIDER,
  generationModelId: "claude-sonnet-5",
};

const conversation = (modelId: string): ChatConversationRecord => ({
  id: "c1",
  profileId: "p1",
  title: "Plan",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  providerId: PROVIDER.id,
  modelId,
});

describe("resolveActiveChatModel", () => {
  it("should heal a conversation stamped with a retired model to its successor", () => {
    // Arrange
    const conv = conversation("claude-3-haiku-20240307");

    // Act
    const model = resolveActiveChatModel(conv, [PROVIDER], FALLBACK);

    // Assert
    expect(model.provider).toBe(PROVIDER);
    expect(model.modelId).toBe("claude-haiku-4-5");
    expect(model.requestedModelId).toBe("claude-3-haiku-20240307");
  });

  it("should keep a conversation's served model override", () => {
    // Arrange
    const conv = conversation("claude-opus-5");

    // Act
    const model = resolveActiveChatModel(conv, [PROVIDER], FALLBACK);

    // Assert
    expect(model.modelId).toBe("claude-opus-5");
    expect(model.requestedModelId).toBe("claude-opus-5");
  });

  it("should fall back when the conversation's provider no longer exists", () => {
    // Arrange
    const conv = conversation("claude-3-haiku-20240307");

    // Act
    const model = resolveActiveChatModel(conv, [], FALLBACK);

    // Assert
    expect(model).toEqual({
      provider: PROVIDER,
      modelId: "claude-sonnet-5",
      requestedModelId: "claude-sonnet-5",
    });
  });
});
