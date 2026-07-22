/**
 * Page-side init script for the Tanita bridge stub.
 *
 * Mirrors `garmin-bridge-stub-page-script.ts` for the Tanita read transport,
 * which uses `chrome.runtime.sendMessage` (extension IPC) — `page.route(...)`
 * cannot intercept it. Documented DI fallback per the transport probe rule.
 *
 * Announces `tanita-bridge` with the `read:body` capability, answers `ping`
 * (manifest + `authenticated: true`, so bridge-discovery verifies it) and
 * `read-export-csv` (the injected fixture CSV). Records calls on
 * `window.__TANITA_STUB_CALLS__`. Messages for other extension ids delegate to
 * any previously-installed stub so both bridges coexist on one page.
 */
type StubSend = (id: string, msg: unknown, cb?: (r: unknown) => void) => void;

export type TanitaStubScriptArgs = {
  extensionId: string;
  bridgeId: string;
  caps: readonly string[];
  /** Raw MyTANITA export CSV returned by `read-export-csv`. */
  csv: string;
};

export const installTanitaStubScript = (args: TanitaStubScriptArgs): void => {
  type Call = { action: string; payload: unknown };
  const calls: Call[] = [];
  const win = window as unknown as Record<string, unknown>;
  win.__TANITA_STUB_CALLS__ = calls;
  const m = {
    id: args.bridgeId,
    name: "Tanita (stub)",
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
    ping: () => wrap({ ...m, authenticated: true }),
    "read-export-csv": () => wrap({ csv: args.csv }),
  };
  const prevSend = (
    win.chrome as { runtime?: { sendMessage?: StubSend } } | undefined
  )?.runtime?.sendMessage;
  win.chrome = {
    runtime: {
      lastError: null,
      sendMessage: (
        id: string,
        msg: Record<string, unknown>,
        cb?: (r: unknown) => void
      ): void => {
        if (id !== args.extensionId) {
          prevSend?.(id, msg, cb);
          return;
        }
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
