import type { LanguageModel } from "ai";

import type { LlmProviderConfig } from "../store/ai-store";

export const createLanguageModel = async (
  config: LlmProviderConfig
): Promise<LanguageModel> => {
  switch (config.type) {
    case "anthropic": {
      const { createAnthropic } = await import("@ai-sdk/anthropic");
      const provider = createAnthropic({
        apiKey: config.apiKey,
        headers: { "anthropic-dangerous-direct-browser-access": "true" },
      });
      return provider(config.model);
    }
    case "openai": {
      const { createOpenAI } = await import("@ai-sdk/openai");
      const provider = createOpenAI({
        apiKey: config.apiKey,
      });
      return provider(config.model);
    }
    case "google": {
      const { createGoogleGenerativeAI } = await import("@ai-sdk/google");
      const provider = createGoogleGenerativeAI({
        apiKey: config.apiKey,
      });
      return provider(config.model);
    }
  }
};
