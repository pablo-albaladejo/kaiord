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
import type { LlmProviderConfig } from "../store/ai-store";
import { createLanguageModel } from "./provider-factory";

const baseConfig: Omit<LlmProviderConfig, "type" | "model"> = {
  id: "test-id",
  apiKey: "test-key",
  label: "Test",
  isDefault: false,
};

describe("createLanguageModel", () => {
  it("should create an Anthropic model with browser access header", () => {
    const config: LlmProviderConfig = {
      ...baseConfig,
      type: "anthropic",
      model: "claude-sonnet-4-5-20241022",
    };

    const result = createLanguageModel(config);

    expect(createAnthropic).toHaveBeenCalledWith({
      apiKey: "test-key",
      headers: { "anthropic-dangerous-direct-browser-access": "true" },
    });
    expect(result).toEqual({ modelId: "anthropic-model" });
  });

  it("should create an OpenAI model", () => {
    const config: LlmProviderConfig = {
      ...baseConfig,
      type: "openai",
      model: "gpt-4o",
    };

    const result = createLanguageModel(config);

    expect(createOpenAI).toHaveBeenCalledWith({ apiKey: "test-key" });
    expect(result).toEqual({ modelId: "openai-model" });
  });

  it("should create a Google model", () => {
    const config: LlmProviderConfig = {
      ...baseConfig,
      type: "google",
      model: "gemini-2.0-flash",
    };

    const result = createLanguageModel(config);

    expect(createGoogleGenerativeAI).toHaveBeenCalledWith({
      apiKey: "test-key",
    });
    expect(result).toEqual({ modelId: "google-model" });
  });
});
