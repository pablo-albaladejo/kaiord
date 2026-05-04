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
  const calls: Call[] = [];
  (window as unknown as Record<string, unknown>).__T2G_STUB_CALLS__ = calls;
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
  // Two complementary triggers handle the race between React mount
  // (when bridge-discovery attaches its listener) and our addInitScript:
  // listen for DISCOVER, AND post repeatedly during the first 6 seconds.
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
