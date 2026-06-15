import type { LanguageModel } from "ai";

import type { LlmProviderConfig } from "../store/ai-store-types";

export type ProviderCredential = Pick<LlmProviderConfig, "type" | "apiKey">;

export const createLanguageModel = async (
  credential: ProviderCredential,
  modelId: string
): Promise<LanguageModel> => {
  switch (credential.type) {
    case "anthropic": {
      const { createAnthropic } = await import("@ai-sdk/anthropic");
      const provider = createAnthropic({
        apiKey: credential.apiKey,
        headers: { "anthropic-dangerous-direct-browser-access": "true" },
      });
      return provider(modelId);
    }
    case "openai": {
      const { createOpenAI } = await import("@ai-sdk/openai");
      const provider = createOpenAI({
        apiKey: credential.apiKey,
      });
      return provider(modelId);
    }
    case "google": {
      const { createGoogleGenerativeAI } = await import("@ai-sdk/google");
      const provider = createGoogleGenerativeAI({
        apiKey: credential.apiKey,
      });
      return provider(modelId);
    }
  }
};
