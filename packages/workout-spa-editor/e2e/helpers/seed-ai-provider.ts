import type { Page } from "@playwright/test";

type ProviderSeed = {
  type: "anthropic" | "openai" | "google";
  apiKey: string;
  model: string;
  label: string;
};

type E2eSeed = {
  aiProvider: (input: ProviderSeed & {
    id: string;
    isDefault: boolean;
    createdAt: number;
  }) => Promise<void>;
};

const DEFAULT_PROVIDER: ProviderSeed = {
  type: "anthropic",
  apiKey: "sk-ant-test-key-for-e2e",
  model: "claude-sonnet-4-5-20241022",
  label: "Test Claude",
};

export async function seedAiProvider(
  page: Page,
  provider: ProviderSeed = DEFAULT_PROVIDER
): Promise<void> {
  await page.evaluate(async (p) => {
    const seed = (window as unknown as Record<string, unknown>)
      .__KAIORD_E2E_SEED__ as E2eSeed | undefined;
    if (!seed) throw new Error("__KAIORD_E2E_SEED__ not available");
    await seed.aiProvider({
      ...p,
      id: crypto.randomUUID(),
      isDefault: true,
      createdAt: Date.now(),
    });
  }, provider);
}
