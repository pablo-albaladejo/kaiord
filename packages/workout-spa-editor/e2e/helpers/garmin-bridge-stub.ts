/**
 * Playwright helper: install a fake Garmin bridge in the page context.
 *
 * Mirrors `installTrain2GoBridgeStub` for the Garmin push transport,
 * which uses `chrome.runtime.sendMessage` (extension IPC) and is NOT
 * interceptable by `page.route(...)`. Documented DI fallback per the
 * transport probe rule in issue #553.
 */
import type { BrowserContext, Page } from "@playwright/test";

import { installGarminAnnounceScript } from "./garmin-announce-page-script";
import { installGarminStubScript } from "./garmin-bridge-stub-page-script";
import {
  GARMIN_STUB_RELEASE_KEY,
  GARMIN_STUB_STATE_KEY,
  type GarminStubState,
  installGarminCalendarStubScript,
  type StubFailure,
} from "./garmin-calendar-stub-page-script";
import { installGarminStubActionsScript } from "./garmin-stub-actions-page-script";

export const GARMIN_EXTENSION_ID = "garmin-stub-ext";
export const GARMIN_BRIDGE_ID = "garmin-bridge";

const DEFAULT_CAPS = [
  "write:workouts",
  "read:workouts",
  "read:activities",
  "write:body",
] as const;

export const CALENDAR_FEATURES = ["calendar-write-v1", "calendar-find-v1"];

export type GarminStubOptions = {
  /** Raw Garmin activity feed the `activities` action returns (F5). */
  activities?: readonly unknown[];
  /** The ping's calendar features (default: both); `null` = older bridge. */
  features?: readonly string[] | null;
  /** Answers injected, in order, instead of an action's own. */
  failures?: Record<string, StubFailure[]>;
  /** Milliseconds before an action answers (it commits on receipt). */
  delays?: Record<string, number>;
  /** Actions that commit on receipt but answer only after `releaseGarminStub`. */
  holds?: readonly string[];
};

/**
 * Install the bridge stub. Call BEFORE `page.goto(...)` so the
 * `addInitScript` runs before the SPA boots and bridge-discovery starts.
 * On a `BrowserContext`, every page shares one Garmin account.
 */
export const installGarminBridgeStub = async (
  target: Page | BrowserContext,
  options: GarminStubOptions = {}
): Promise<void> => {
  await target.addInitScript(installGarminStubActionsScript);
  await target.addInitScript(installGarminCalendarStubScript, {
    failures: options.failures ?? {},
    delays: options.delays ?? {},
    holds: options.holds ?? [],
  });
  await target.addInitScript(installGarminStubScript, {
    extensionId: GARMIN_EXTENSION_ID,
    bridgeId: GARMIN_BRIDGE_ID,
    caps: DEFAULT_CAPS,
    activities: options.activities ?? [],
    features:
      options.features === undefined ? CALENDAR_FEATURES : options.features,
  });
  await target.addInitScript(installGarminAnnounceScript, {
    extensionId: GARMIN_EXTENSION_ID,
    bridgeId: GARMIN_BRIDGE_ID,
    caps: DEFAULT_CAPS,
  });
};

/** The shared Garmin account: calendar entries and every action received. */
export const readGarminStubState = async (
  page: Page
): Promise<GarminStubState | null> =>
  page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? "null"),
    GARMIN_STUB_STATE_KEY
  );

/** Lets every held action answer, in every page of the context. */
export const releaseGarminStub = async (page: Page): Promise<void> =>
  page.evaluate(
    (key) => localStorage.setItem(key, "1"),
    GARMIN_STUB_RELEASE_KEY
  );

/** The actions the shared Garmin account received, across pages. */
export const garminStubActions = async (page: Page): Promise<string[]> =>
  ((await readGarminStubState(page))?.log ?? []).map((c) => c.action);

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
