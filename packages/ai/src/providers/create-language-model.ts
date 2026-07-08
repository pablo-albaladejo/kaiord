import type { LanguageModel } from "ai";

import type { ProviderCredential } from "./types";

/**
 * `browser: true` adds the Anthropic direct-browser-access header so the SPA
 * can call the API with the user's key from the browser. Node consumers omit
 * it and get standard headers.
 */
export type CreateLanguageModelOptions = { browser?: boolean };

export const createLanguageModel = async (
  credential: ProviderCredential,
  modelId: string,
  options: CreateLanguageModelOptions = {}
): Promise<LanguageModel> => {
  switch (credential.type) {
    case "anthropic": {
      const { createAnthropic } = await import("@ai-sdk/anthropic");
      const provider = createAnthropic({
        apiKey: credential.apiKey,
        ...(options.browser
          ? {
              headers: {
                "anthropic-dangerous-direct-browser-access": "true",
              },
            }
          : {}),
      });
      return provider(modelId);
    }
    case "openai": {
      const { createOpenAI } = await import("@ai-sdk/openai");
      const provider = createOpenAI({ apiKey: credential.apiKey });
      return provider(modelId);
    }
    case "google": {
      const { createGoogleGenerativeAI } = await import("@ai-sdk/google");
      const provider = createGoogleGenerativeAI({ apiKey: credential.apiKey });
      return provider(modelId);
    }
    default: {
      // Compile-time exhaustiveness plus a runtime guard against a corrupted
      // stored credential type that bypassed the type system.
      const exhaustive: never = credential.type;
      throw new Error(`Unsupported provider type: ${String(exhaustive)}`);
    }
  }
};
