/**
 * Page-side init script for the Train2Go bridge stub.
 *
 * Playwright serialises `installStubScript` via `.toString()` and runs
 * it in the page context before the SPA boots — references to other
 * module-level functions in this file are NOT available there, so the
 * whole body is intentionally self-contained.
 */
export type T2GStubScriptArgs = {
  extensionId: string;
  bridgeId: string;
  caps: readonly string[];
  payload: unknown;
};

// eslint-disable-next-line max-lines-per-function -- self-contained on purpose; Playwright `.toString()` serialisation precludes referencing module-level helpers from inside.
export const installStubScript = (args: T2GStubScriptArgs): void => {
  type Call = { action: string; payload: unknown };
  const win = window as unknown as Record<string, unknown>;
  // Persist call tracking across in-test navigations. `addInitScript` re-runs
  // on every page load with a fresh `window`, so a per-load array would drop
  // calls that fired before a navigation — e.g. an auto-sync `read-week` that
  // fires on `/calendar` right after the profile seed, before the test
  // navigates to the target week. sessionStorage survives same-tab
  // navigations, so those actions stay visible to the assertion (this is the
  // flake `zones-sync (a)` hit on slow/cold engines that synced pre-nav).
  // The script can also run on an opaque origin (initial about:blank) where
  // storage access throws, so both paths fall back to the in-memory array.
  const STORE_KEY = "__T2G_STUB_CALLS_STORE__";
  win.__T2G_STUB_CALLS__ = [];
  try {
    win.__T2G_STUB_CALLS__ = JSON.parse(
      window.sessionStorage.getItem(STORE_KEY) ?? "[]"
    ) as Call[];
  } catch {
    // opaque-origin storage unavailable — keep the empty in-memory log.
  }
  // BridgeManifest shape (`id` etc.) — the wire announcement adds
  // `type`, `bridgeId`, `extensionId` on top of these same fields.
  const m = {
    id: args.bridgeId,
    name: "Train2Go (stub)",
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
    ping: () =>
      wrap({
        ...m,
        sessionActive: true,
        userId: "99999",
        userName: "Test User",
      }),
    "read-week": () => wrap({ activities: [] }),
    "read-day": () => wrap({ activities: [] }),
    "read-details": () => wrap(args.payload),
    "open-train2go": () => wrap(null),
    // Snapshot push hooks fire on every mount; respond no-op so stub
    // calls don't fall through to the "Unknown action" error path.
    "profile-snapshot": () => wrap(null),
    "profile-snapshot-clear": () => wrap(null),
  };
  win.chrome = {
    runtime: {
      lastError: null,
      sendMessage: (
        _id: string,
        msg: Record<string, unknown>,
        cb?: (r: unknown) => void
      ): void => {
        const action = String(msg?.action ?? "");
        const arr = (win.__T2G_STUB_CALLS__ as Call[] | undefined) ?? [];
        arr.push({ action, payload: msg });
        win.__T2G_STUB_CALLS__ = arr;
        try {
          window.sessionStorage.setItem(STORE_KEY, JSON.stringify(arr));
        } catch {
          // storage unavailable — the in-memory array still tracks the call.
        }
        const r = responses[action]?.() ?? {
          ok: false,
          protocolVersion: 1,
          error: `Unknown action: ${action}`,
        };
        if (cb) setTimeout(() => cb(r), 0);
      },
    },
  };
  // Two complementary triggers handle the race between React mount
  // (when bridge-discovery attaches its listener) and our addInitScript:
  // listen for DISCOVER, AND post repeatedly during the first 6 seconds.
  const post = (): void => void window.postMessage(ann, "*");
  window.addEventListener("message", (e: MessageEvent) => {
    const d = e.data as { type?: string } | null;
    if (e.source === window && d?.type === "KAIORD_BRIDGE_DISCOVER") post();
  });
  [0, 250, 500, 1000, 2000, 4000, 6000].forEach((d) => setTimeout(post, d));
};
