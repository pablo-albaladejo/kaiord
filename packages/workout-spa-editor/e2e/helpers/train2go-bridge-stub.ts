/**
 * Playwright helper: install a fake Train2Go bridge in the page context.
 *
 * The real bridge is a Chrome extension — Playwright Chromium runs without
 * the extension loaded, so `chrome.runtime` is undefined and the SPA's
 * bridge-discovery handshake never completes. This helper paves over both:
 *
 *   1. Stubs `chrome.runtime.sendMessage(extensionId, msg, callback)` to
 *      route action calls into a deterministic per-test response map.
 *   2. Posts `{ type: "KAIORD_BRIDGE_ANNOUNCE", ... }` on `window` so the
 *      SPA's `bridgeDiscovery` handler verifies and registers the stub.
 *   3. Tracks every action call on `window.__T2G_STUB_CALLS__` so tests can
 *      assert which actions fired (and which did NOT, e.g. `read-details`
 *      in the toggle-off flow).
 *
 * The action responses mirror what `parseDetailsHtml` would produce against
 * the sanitized fixture at `packages/train2go-bridge/test/fixtures/
 * details-active.html` — values are derived from that fixture so any future
 * shape drift in the parser is caught by the e2e in addition to its
 * dedicated unit tests.
 */
import type { Page } from "@playwright/test";

import { installStubScript } from "./train2go-bridge-stub-page-script";

export const TRAIN2GO_EXTENSION_ID = "train2go-stub-ext";
export const TRAIN2GO_BRIDGE_ID = "train2go-bridge";

/**
 * Parsed shape that `parseDetailsHtml` emits for the sanitized
 * `details-active.html` fixture (verified by the bridge's own unit tests).
 * Kept alongside the stub so the e2e and the bridge can drift in lockstep.
 */
export const FIXTURE_ZONES_PAYLOAD = {
  physiological: { weight: 83, bpmMax: 187, bpmRest: 51 },
  paces: {
    cycling: {
      z1: { lower: 111, upper: 149 },
      z2: { lower: 150, upper: 203 },
      z3: { lower: 204, upper: 239 },
      z4: { lower: 240, upper: 268 },
      z5: { lower: 269, upper: 386 },
      z4Upper: 268,
      z5Lower: 269,
    },
    running: {
      z4: {
        lower: { min: 4, sec: 44 },
        upper: { min: 4, sec: 10 },
      },
      z4Upper: { min: 4, sec: 10 },
    },
    swimming: {
      z4: {
        lower: { min: 1, sec: 39 },
        upper: { min: 1, sec: 32 },
      },
      z4Upper: { min: 1, sec: 32 },
    },
  },
  hrZones: {
    generic: {
      z1: { lower: 107, upper: 133 },
      z2: { lower: 134, upper: 147 },
      z3: { lower: 148, upper: 160 },
      z4: { lower: 161, upper: 174 },
      z5: { lower: 175, upper: 187 },
    },
    cycling: { z4Upper: 174 },
    running: { z4Upper: 168 },
  },
} as const;

export type T2GStubOptions = {
  /** Override the manifest capabilities. Defaults include training-zones. */
  capabilities?: readonly string[];
  /** Override the zones payload returned for `read-details`. */
  zonesPayload?: unknown;
};

const DEFAULT_CAPS = ["read:training-plan", "read:training-zones"] as const;

/**
 * Install the bridge stub. Call BEFORE `page.goto(...)` so the
 * `addInitScript` runs before the SPA boots and bridge-discovery starts.
 */
export const installTrain2GoBridgeStub = async (
  page: Page,
  options: T2GStubOptions = {}
): Promise<void> => {
  await page.addInitScript(installStubScript, {
    extensionId: TRAIN2GO_EXTENSION_ID,
    bridgeId: TRAIN2GO_BRIDGE_ID,
    caps: options.capabilities ?? DEFAULT_CAPS,
    payload: options.zonesPayload ?? FIXTURE_ZONES_PAYLOAD,
  });
};

/** Returns the action names recorded by the stub since page load (or last clear). */
export const getBridgeCallActions = async (page: Page): Promise<string[]> =>
  page.evaluate(() => {
    const calls =
      ((window as unknown as Record<string, unknown>).__T2G_STUB_CALLS__ as
        { action: string }[] | undefined) ?? [];
    return calls.map((c) => c.action);
  });

/** Reset the call tracker (useful when an action fires during navigation). */
export const clearBridgeCalls = (page: Page): Promise<void> =>
  page.evaluate(() => {
    (window as unknown as Record<string, unknown>).__T2G_STUB_CALLS__ = [];
  });
