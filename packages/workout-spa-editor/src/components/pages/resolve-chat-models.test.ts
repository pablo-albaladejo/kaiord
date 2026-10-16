import { describe, expect, it } from "vitest";

import type { LlmProviderConfig } from "../../store/ai-store-types";
import type { AiModelBinding } from "../../types/ai-model-binding";
import { resolveChatModels } from "./resolve-chat-models";

const provider = (over: Partial<LlmProviderConfig>): LlmProviderConfig => ({
  id: "prov-1",
  type: "anthropic",
  apiKey: "sk-test",
  label: "Claude",
  isDefault: true,
  createdAt: 0,
  ...over,
});

const gpt = provider({ id: "prov-2", type: "openai", isDefault: false });

const binding = (over: Partial<AiModelBinding>): AiModelBinding => ({
  profileId: "p1",
  purpose: "default",
  providerId: gpt.id,
  modelId: "gpt-5-mini",
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...over,
});

describe("resolveChatModels", () => {
  it("should run the draft's chosen provider and model together", () => {
    // Arrange
    const providers = [provider({}), gpt];
    const draft = { providerId: gpt.id, modelId: "gpt-5" };

    // Act
    const models = resolveChatModels(providers, [], draft);

    // Assert
    expect(models.provider).toBe(gpt);
    expect(models.modelId).toBe("gpt-5");
    expect(models.chosen).toBe(true);
  });

  it("should heal a draft's retired model to its successor", () => {
    // Arrange
    const providers = [provider({})];
    const draft = { providerId: "prov-1", modelId: "claude-3-haiku-20240307" };

    // Act
    const models = resolveChatModels(providers, [], draft);

    // Assert
    expect(models.modelId).toBe("claude-haiku-4-5");
  });

  it("should follow the athlete's main model, not the isDefault provider, without a draft choice", () => {
    // Arrange
    const providers = [provider({}), gpt];

    // Act
    const models = resolveChatModels(providers, [binding({})], null);

    // Assert
    expect(models.provider).toBe(gpt);
    expect(models.modelId).toBe("gpt-5-mini");
    expect(models.chosen).toBe(false);
  });

  it("should ignore a draft choice whose provider was removed", () => {
    // Arrange
    const providers = [provider({})];
    const draft = { providerId: "gone", modelId: "gpt-5" };

    // Act
    const models = resolveChatModels(providers, [], draft);

    // Assert
    expect(models.provider?.id).toBe("prov-1");
    expect(models.modelId).toBe("claude-sonnet-5");
    expect(models.chosen).toBe(false);
  });
});
