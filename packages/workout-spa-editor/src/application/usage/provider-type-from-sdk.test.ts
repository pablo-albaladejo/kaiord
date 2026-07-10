import { describe, expect, it } from "vitest";

import { providerTypeFromSdk } from "./provider-type-from-sdk";

describe("providerTypeFromSdk", () => {
  it("should map an anthropic SDK provider to the anthropic rate type", () => {
    // Arrange
    const provider = "anthropic.messages";

    // Act
    const type = providerTypeFromSdk(provider);

    // Assert
    expect(type).toBe("anthropic");
  });

  it("should map openai and azure providers to openai", () => {
    // Arrange
    const providers = ["openai.chat", "azure.openai"];

    // Act
    const types = providers.map(providerTypeFromSdk);

    // Assert
    expect(types).toEqual(["openai", "openai"]);
  });

  it("should map google, gemini, and vertex providers to google", () => {
    // Arrange
    const providers = ["google.generative-ai", "gemini", "vertex.ai"];

    // Act
    const types = providers.map(providerTypeFromSdk);

    // Assert
    expect(types).toEqual(["google", "google", "google"]);
  });

  it("should return undefined for an unrecognized provider", () => {
    // Arrange
    const provider = "unknown";

    // Act
    const type = providerTypeFromSdk(provider);

    // Assert
    expect(type).toBeUndefined();
  });
});
