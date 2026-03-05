import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import type { LlmProviderConfig } from "../store/ai-store";
import type { LanguageModel } from "ai";

export const createLanguageModel = (
  config: LlmProviderConfig
): LanguageModel => {
  switch (config.type) {
    case "anthropic": {
      const provider = createAnthropic({
        apiKey: config.apiKey,
        headers: { "anthropic-dangerous-direct-browser-access": "true" },
      });
      return provider(config.model);
    }
    case "openai": {
      const provider = createOpenAI({
        apiKey: config.apiKey,
      });
      return provider(config.model);
    }
    case "google": {
      const provider = createGoogleGenerativeAI({
        apiKey: config.apiKey,
      });
      return provider(config.model);
    }
  }
};
