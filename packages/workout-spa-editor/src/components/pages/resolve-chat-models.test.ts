import { describe, expect, it } from "vitest";

import type { LlmProviderConfig } from "../../store/ai-store-types";
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

describe("resolveChatModels", () => {
  it("should heal the stored retired model of an explicitly selected provider", () => {
    // Arrange
    const selected = provider({
      id: "prov-2",
      isDefault: false,
      model: "claude-3-haiku-20240307",
    });
    const providers = [provider({}), selected];

    // Act
    const models = resolveChatModels(providers, [], selected.id);

    // Assert
    expect(models.provider).toBe(selected);
    expect(models.modelId).toBe("claude-haiku-4-5");
  });

  it("should use the type default for a selected provider with no stored model", () => {
    // Arrange
    const selected = provider({ id: "prov-2", isDefault: false });
    const providers = [provider({}), selected];

    // Act
    const models = resolveChatModels(providers, [], selected.id);

    // Assert
    expect(models.modelId).toBe("claude-sonnet-5");
  });
});
