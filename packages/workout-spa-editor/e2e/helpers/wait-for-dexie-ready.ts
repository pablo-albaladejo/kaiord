import type { Page } from "@playwright/test";

/**
 * Wait until the SPA has exposed its Dexie handle on `window.__KAIORD_DB__`
 * (the seed helpers require it). The timeout rides the correct 3rd positional
 * slot — `waitForFunction(fn, arg, options)` — so it is actually applied,
 * unlike the 2-arg copy-paste this replaces.
 */
export const waitForDexieReady = (page: Page): Promise<unknown> =>
  page.waitForFunction(
    () => Boolean((window as unknown as Record<string, unknown>).__KAIORD_DB__),
    undefined,
    { timeout: 10_000 }
  );
