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
    const w = window as unknown as Record<string, unknown>;
    const stores = w.__ZUSTAND_STORES__;
    if (!stores) throw new Error("Missing window.__ZUSTAND_STORES__");

    const aiStore = (
      stores as Record<string, { getState: () => unknown }>
    ).ai?.getState();
    if (!aiStore) throw new Error("Missing ai store on __ZUSTAND_STORES__");

    const addProvider = (aiStore as Record<string, unknown>).addProvider;
    if (typeof addProvider !== "function") {
      throw new Error("Missing ai.addProvider");
    }
    (addProvider as (provider: ProviderSeed) => unknown)(p);
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
      if (!stores) throw new Error("Missing window.__ZUSTAND_STORES__");

      const garminStore = (
        stores as Record<string, { getState: () => unknown }>
      ).garmin?.getState();
      if (!garminStore) {
        throw new Error("Missing garmin store on __ZUSTAND_STORES__");
      }

      const setCredentials = (garminStore as Record<string, unknown>)
        .setCredentials;
      if (typeof setCredentials !== "function") {
        throw new Error("Missing garmin.setCredentials");
      }
      (setCredentials as (u: string, p: string) => unknown)(u, p);
    },
    { u: username, p: password }
  );
}
