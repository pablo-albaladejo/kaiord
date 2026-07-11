import { describe, expect, it } from "vitest";

import { providerTypeFromSdk } from "./provider-type-from-sdk";

describe("providerTypeFromSdk", () => {
  it.each([
    { sdk: "anthropic.messages", expected: "anthropic" },
    { sdk: "openai.chat", expected: "openai" },
    { sdk: "azure.openai", expected: "openai" },
    { sdk: "google.generative-ai", expected: "google" },
    { sdk: "gemini", expected: "google" },
    { sdk: "vertex.ai", expected: "google" },
    { sdk: "unknown", expected: undefined },
  ])("should map SDK provider $sdk to $expected", ({ sdk, expected }) => {
    // Arrange

    // Act
    const type = providerTypeFromSdk(sdk);

    // Assert
    expect(type).toBe(expected);
  });
});
