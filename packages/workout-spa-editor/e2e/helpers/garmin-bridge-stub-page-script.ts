/**
 * Page-side init script for the Garmin bridge stub.
 *
 * Mirrors `train2go-bridge-stub-page-script.ts` for the Garmin push
 * transport, which uses `chrome.runtime.sendMessage` (extension IPC)
 * — `page.route(...)` cannot intercept it. Documented DI fallback
 * per the transport probe rule (issue #553).
 *
 * Records calls on `window.__GARMIN_STUB_CALLS__` so tests can assert
 * which actions fired. The library and calendar actions are answered by
 * `window.__GARMIN_STUB__` (see `garmin-calendar-stub-page-script`).
 */
export type GarminStubScriptArgs = {
  extensionId: string;
  bridgeId: string;
  caps: readonly string[];
  /** Raw activity feed returned by the read-only `activities` action (F5). */
  activities?: readonly unknown[];
  /** The ping's calendar features; `null` omits them (an older bridge). */
  features: readonly string[] | null;
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
  const wrap = (data: unknown) => ({ ok: true, protocolVersion: 1, data });
  const features = args.features ? { features: args.features } : {};
  type Handled = { response: unknown; delayMs: number } | undefined;
  const stub = (window as unknown as Record<string, unknown>)
    .__GARMIN_STUB__ as
    { handle: (a: string, m: unknown) => Handled } | undefined;
  const responses: Record<string, () => unknown> = {
    ping: () => wrap({ ...m, gcApi: { ok: true }, ...features }),
    "push-body-composition": () => wrap({ uploadId: "stub-body-composition" }),
    list: () => wrap([]),
    activities: () =>
      wrap({
        activities: args.activities ?? [],
        disabled: false,
        throttled: false,
      }),
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
        const handled = stub?.handle(action, msg);
        const r = handled
          ? handled.response
          : (responses[action]?.() ?? {
              ok: false,
              protocolVersion: 1,
              error: `Unknown action: ${action}`,
            });
        if (cb) setTimeout(() => cb(r), handled?.delayMs ?? 0);
      },
    },
  };
};
