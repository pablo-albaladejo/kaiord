import { describe, expect, it, vi } from "vitest";

vi.mock("@ai-sdk/anthropic", () => ({
  createAnthropic: vi.fn(() => vi.fn(() => ({ modelId: "anthropic-model" }))),
}));

vi.mock("@ai-sdk/openai", () => ({
  createOpenAI: vi.fn(() => vi.fn(() => ({ modelId: "openai-model" }))),
}));

vi.mock("@ai-sdk/google", () => ({
  createGoogleGenerativeAI: vi.fn(() =>
    vi.fn(() => ({ modelId: "google-model" }))
  ),
}));

import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";

import { createLanguageModel } from "./create-language-model";

describe("createLanguageModel", () => {
  it("should add the browser-access header for Anthropic when browser is true", async () => {
    // Arrange

    // Act
    const result = await createLanguageModel(
      { type: "anthropic", apiKey: "test-key" },
      "claude-sonnet-4-5-20241022",
      { browser: true }
    );

    // Assert
    expect(createAnthropic).toHaveBeenCalledWith({
      apiKey: "test-key",
      headers: { "anthropic-dangerous-direct-browser-access": "true" },
    });
    expect(result).toEqual({ modelId: "anthropic-model" });
  });

  it("should omit the browser-access header when browser is not set", async () => {
    // Arrange

    // Act
    await createLanguageModel(
      { type: "anthropic", apiKey: "node-key" },
      "claude-sonnet-4-5-20241022"
    );

    // Assert
    expect(createAnthropic).toHaveBeenLastCalledWith({ apiKey: "node-key" });
  });

  it("should create an OpenAI model", async () => {
    // Arrange

    // Act
    const result = await createLanguageModel(
      { type: "openai", apiKey: "test-key" },
      "gpt-4o"
    );

    // Assert
    expect(createOpenAI).toHaveBeenCalledWith({ apiKey: "test-key" });
    expect(result).toEqual({ modelId: "openai-model" });
  });

  it("should create a Google model", async () => {
    // Arrange

    // Act
    const result = await createLanguageModel(
      { type: "google", apiKey: "test-key" },
      "gemini-2.0-flash"
    );

    // Assert
    expect(createGoogleGenerativeAI).toHaveBeenCalledWith({
      apiKey: "test-key",
    });
    expect(result).toEqual({ modelId: "google-model" });
  });
});
