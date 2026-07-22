/**
 * Playwright helper: install a fake Tanita bridge in the page context.
 *
 * Mirrors `installGarminBridgeStub` for the Tanita read transport, which uses
 * `chrome.runtime.sendMessage` (extension IPC) and is NOT interceptable by
 * `page.route(...)`. Documented DI fallback per the transport probe rule.
 */
import type { Page } from "@playwright/test";

import { installTanitaStubScript } from "./tanita-bridge-stub-page-script";

export const TANITA_EXTENSION_ID = "tanita-stub-ext";
export const TANITA_BRIDGE_ID = "tanita-bridge";

const DEFAULT_CAPS = ["read:body"] as const;

/** Two MyTANITA weigh-ins on distinct days — one KRD each. */
export const DEFAULT_TANITA_CSV = [
  "Date,Weight (kg),Body Fat (%)",
  "2026-07-20 08:00:00,75.2,18.5",
  "2026-07-21 08:00:00,75.0,18.3",
  "",
].join("\n");

export type TanitaStubOptions = {
  /** MyTANITA export CSV the `read-export-csv` action returns. */
  csv?: string;
};

/**
 * Install the bridge stub. Call BEFORE `page.goto(...)` so the `addInitScript`
 * runs before the SPA boots and bridge-discovery starts.
 */
export const installTanitaBridgeStub = async (
  page: Page,
  options: TanitaStubOptions = {}
): Promise<void> => {
  await page.addInitScript(installTanitaStubScript, {
    extensionId: TANITA_EXTENSION_ID,
    bridgeId: TANITA_BRIDGE_ID,
    caps: DEFAULT_CAPS,
    csv: options.csv ?? DEFAULT_TANITA_CSV,
  });
};

/** Returns the action names recorded by the Tanita stub since page load. */
export const getTanitaBridgeCallActions = async (
  page: Page
): Promise<string[]> =>
  page.evaluate(() => {
    const calls =
      ((window as unknown as Record<string, unknown>).__TANITA_STUB_CALLS__ as
        { action: string }[] | undefined) ?? [];
    return calls.map((c) => c.action);
  });
