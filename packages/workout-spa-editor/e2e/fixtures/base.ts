/**
 * Base test fixture that retries `page.goto` on transient browser crashes.
 *
 * It retries `page.goto` on transient browser-internal crashes (see
 * `TRANSIENT_NAV_CRASH`): WebKit on CI intermittently aborts a navigation
 * with "WebKit encountered an internal error" (and processes can crash).
 * WebKit also aborts back-to-back navigations with "Frame load interrupted"
 * or "is interrupted by another navigation" while it is still settling the
 * PREVIOUS goto — the named interruptor is the residue of a navigation that
 * already resolved, not app logic. These are not test failures — re-issuing
 * the same navigation recovers — so we retry in-place a bounded number of
 * times. Any other navigation error propagates unchanged, and the retry is
 * narrow enough that normal navigations are untouched.
 */

import type { Page } from "@playwright/test";
import { test as base } from "@playwright/test";

const TRANSIENT_NAV_CRASH =
  /encountered an internal error|target crashed|page crashed|Frame load interrupted|is interrupted by another navigation/i;
const GOTO_CRASH_RETRIES = 2;

export const test = base.extend({
  page: async ({ page }, use) => {
    const originalGoto = page.goto.bind(page);
    page.goto = (async (url, options) => {
      let lastError: unknown;
      for (let attempt = 0; attempt <= GOTO_CRASH_RETRIES; attempt++) {
        try {
          return await originalGoto(url, options);
        } catch (error) {
          lastError = error;
          const transient =
            error instanceof Error && TRANSIENT_NAV_CRASH.test(error.message);
          if (!transient) throw error;
        }
      }
      throw lastError;
    }) as Page["goto"];

    await use(page);
  },
});

export { expect } from "@playwright/test";
