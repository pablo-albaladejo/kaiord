/**
 * Page-side init script for the Garmin bridge stub.
 *
 * Mirrors `train2go-bridge-stub-page-script.ts` for the Garmin push
 * transport, which uses `chrome.runtime.sendMessage` (extension IPC)
 * — `page.route(...)` cannot intercept it. Documented DI fallback
 * per the transport probe rule (issue #553).
 *
 * Records calls on `window.__GARMIN_STUB_CALLS__` so tests can assert
 * which actions fired.
 */
export type GarminStubScriptArgs = {
  extensionId: string;
  bridgeId: string;
  caps: readonly string[];
};

export const installGarminStubScript = (args: GarminStubScriptArgs): void => {
  type Call = { action: string; payload: unknown };
  const calls: Call[] = [];
  (window as unknown as Record<string, unknown>).__GARMIN_STUB_CALLS__ = calls;
  const m = {
    id: args.bridgeId,
    name: "Garmin (stub)",
    version: "0.0.0-stub",
    protocolVersion: 1,
    capabilities: args.caps,
  };
  const ann = {
    type: "KAIORD_BRIDGE_ANNOUNCE",
    bridgeId: args.bridgeId,
    extensionId: args.extensionId,
    ...m,
  };
  const wrap = (data: unknown) => ({ ok: true, protocolVersion: 1, data });
  const responses: Record<string, () => unknown> = {
    ping: () => wrap({ ...m, gcApi: { ok: true } }),
    push: () => wrap({ workoutId: "stub-garmin-id" }),
    list: () => wrap([]),
  };
  (window as unknown as Record<string, unknown>).chrome = {
    runtime: {
      lastError: null,
      sendMessage: (
        _id: string,
        msg: Record<string, unknown>,
        cb?: (r: unknown) => void
      ): void => {
        const action = String(msg?.action ?? "");
        calls.push({ action, payload: msg });
        const r = responses[action]?.() ?? {
          ok: false,
          protocolVersion: 1,
          error: `Unknown action: ${action}`,
        };
        if (cb) setTimeout(() => cb(r), 0);
      },
    },
  };
  const post = (): void => void window.postMessage(ann, "*");
  window.addEventListener("message", (e: MessageEvent) => {
    if (
      e.source === window &&
      (e.data as { type?: string } | null)?.type === "KAIORD_BRIDGE_DISCOVER"
    )
      post();
  });
  for (const delayMs of [0, 250, 500, 1000, 2000, 4000, 6000])
    setTimeout(post, delayMs);
};
