/**
 * resolveModelForPurpose — the centralized provider+model resolution path and
 * its fallback chain.
 */
import { describe, expect, it } from "vitest";

import { getDefaultModel } from "../../lib/provider-models";
import type { LlmProviderConfig } from "../../store/ai-store-types";
import type { AiModelBinding } from "../../types/ai-model-binding";
import { resolveModelForPurpose } from "./resolve-model-for-purpose";

const NOW = "2026-06-15T10:00:00.000Z";

const provider = (
  over: Partial<LlmProviderConfig> = {}
): LlmProviderConfig => ({
  id: "prov-1",
  type: "anthropic",
  apiKey: "k",
  model: "legacy",
  label: "A",
  isDefault: true,
  createdAt: 1,
  ...over,
});

const binding = (over: Partial<AiModelBinding> = {}): AiModelBinding => ({
  profileId: "p-1",
  purpose: "default",
  providerId: "prov-1",
  modelId: "m-default",
  updatedAt: NOW,
  ...over,
});

describe("resolveModelForPurpose", () => {
  it("should use the purpose override binding when present", () => {
    // Arrange
    const providers = [
      provider({ id: "prov-1" }),
      provider({ id: "prov-2", isDefault: false }),
    ];
    const bindings = [
      binding({ purpose: "chat", providerId: "prov-2", modelId: "chat-model" }),
      binding({
        purpose: "default",
        providerId: "prov-1",
        modelId: "def-model",
      }),
    ];

    // Act
    const resolved = resolveModelForPurpose("chat", providers, bindings);

    // Assert
    expect(resolved).toEqual({ provider: providers[1], modelId: "chat-model" });
  });

  it("should fall back to the default binding when no override exists", () => {
    // Arrange
    const providers = [provider({ id: "prov-1" })];
    const bindings = [binding({ purpose: "default", modelId: "def-model" })];

    // Act
    const resolved = resolveModelForPurpose("chat", providers, bindings);

    // Assert
    expect(resolved).toEqual({ provider: providers[0], modelId: "def-model" });
  });

  it("should fall back to the default provider's stored model", () => {
    // Arrange
    const providers = [provider({ isDefault: true, model: "stored-model" })];

    // Act
    const resolved = resolveModelForPurpose("chat", providers, []);

    // Assert
    expect(resolved).toEqual({
      provider: providers[0],
      modelId: "stored-model",
    });
  });

  it("should use the catalog default when the provider has no stored model", () => {
    // Arrange
    const providers = [
      provider({ type: "anthropic", isDefault: true, model: undefined }),
    ];

    // Act
    const resolved = resolveModelForPurpose("chat", providers, []);

    // Assert
    expect(resolved).toEqual({
      provider: providers[0],
      modelId: getDefaultModel("anthropic"),
    });
  });

  it("should skip a binding whose provider no longer exists", () => {
    // Arrange
    const providers = [provider({ id: "prov-1", isDefault: true })];
    const bindings = [
      binding({ purpose: "chat", providerId: "gone", modelId: "x" }),
    ];

    // Act
    const resolved = resolveModelForPurpose("chat", providers, bindings);

    // Assert
    expect(resolved?.provider.id).toBe("prov-1");
  });

  it("should return null when no providers are configured", () => {
    // Arrange
    const providers: LlmProviderConfig[] = [];

    // Act
    const resolved = resolveModelForPurpose("chat", providers, []);

    // Assert
    expect(resolved).toBeNull();
  });
});
