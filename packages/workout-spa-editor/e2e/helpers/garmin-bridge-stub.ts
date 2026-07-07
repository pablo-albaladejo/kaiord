/**
 * Playwright helper: install a fake Garmin bridge in the page context.
 *
 * Mirrors `installTrain2GoBridgeStub` for the Garmin push transport,
 * which uses `chrome.runtime.sendMessage` (extension IPC) and is NOT
 * interceptable by `page.route(...)`. Documented DI fallback per the
 * transport probe rule in issue #553.
 */
import type { Page } from "@playwright/test";

import { installGarminStubScript } from "./garmin-bridge-stub-page-script";

export const GARMIN_EXTENSION_ID = "garmin-stub-ext";
export const GARMIN_BRIDGE_ID = "garmin-bridge";

const DEFAULT_CAPS = [
  "write:workouts",
  "read:workouts",
  "read:activities",
] as const;

export type GarminStubOptions = {
  /** Raw Garmin activity feed the `activities` action returns (F5). */
  activities?: readonly unknown[];
};

/**
 * Install the bridge stub. Call BEFORE `page.goto(...)` so the
 * `addInitScript` runs before the SPA boots and bridge-discovery starts.
 */
export const installGarminBridgeStub = async (
  page: Page,
  options: GarminStubOptions = {}
): Promise<void> => {
  await page.addInitScript(installGarminStubScript, {
    extensionId: GARMIN_EXTENSION_ID,
    bridgeId: GARMIN_BRIDGE_ID,
    caps: DEFAULT_CAPS,
    activities: options.activities ?? [],
  });
};

/** Returns the action names recorded by the Garmin stub since page load. */
export const getGarminBridgeCallActions = async (
  page: Page
): Promise<string[]> =>
  page.evaluate(() => {
    const calls =
      ((window as unknown as Record<string, unknown>).__GARMIN_STUB_CALLS__ as
        { action: string }[] | undefined) ?? [];
    return calls.map((c) => c.action);
  });
