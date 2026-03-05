/**
 * Helpers to seed Zustand stores via page.evaluate() for E2E tests.
 * Since Zustand stores are in-memory, we inject state before navigation
 * using addInitScript (runs before page JS) or evaluate (runs after load).
 */

import type { Page } from "@playwright/test";

type ProviderSeed = {
  type: "anthropic" | "openai" | "google";
  apiKey: string;
  model: string;
  label: string;
};

const DEFAULT_PROVIDER: ProviderSeed = {
  type: "anthropic",
  apiKey: "sk-ant-test-key-for-e2e",
  model: "claude-sonnet-4-5-20241022",
  label: "Test Claude",
};

/**
 * Add an AI provider to the store after page load.
 * Must be called after page.goto().
 */
export async function seedAiProvider(
  page: Page,
  provider: ProviderSeed = DEFAULT_PROVIDER
): Promise<void> {
  await page.evaluate((p) => {
    // Access Zustand store via its internal API exposed on window
    // Zustand stores created with `create` have getState/setState
    const w = window as unknown as Record<string, unknown>;
    const stores = w.__ZUSTAND_STORES__;
    if (stores) {
      const aiStore = (
        stores as Record<string, { getState: () => unknown }>
      ).ai?.getState();
      if (aiStore) {
        (
          aiStore as Record<string, (...args: unknown[]) => unknown>
        ).addProvider(p);
        return;
      }
    }
  }, provider);
}

/**
 * Set Garmin credentials in the store after page load.
 * Must be called after page.goto().
 */
export async function seedGarminCredentials(
  page: Page,
  username = "test@garmin.com",
  password = "test-password"
): Promise<void> {
  await page.evaluate(
    ({ u, p }) => {
      const w = window as unknown as Record<string, unknown>;
      const stores = w.__ZUSTAND_STORES__;
      if (stores) {
        const garminStore = (
          stores as Record<string, { getState: () => unknown }>
        ).garmin?.getState();
        if (garminStore) {
          (
            garminStore as Record<string, (...args: unknown[]) => unknown>
          ).setCredentials(u, p);
          return;
        }
      }
    },
    { u: username, p: password }
  );
}
